const Review = require("../models/Review");
const Game = require("../models/Game");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get reviews for a specific game (user's review first)
const getGameReviews = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user?.id; // Optional, might not be authenticated

    // Validate if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    }

    // Get all reviews for the game
    const allReviews = await Review.find({ gameId }).sort({ createdAt: -1 });

    // Manually populate user data to ensure all fields are included
    const populatedReviews = await Promise.all(
      allReviews.map(async (review) => {
        const user = await User.findById(review.userId).lean();
        const reviewObj = review.toObject();
        reviewObj.userId = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          avatarUrl: user.avatar,
        };
        return reviewObj;
      })
    );

    // If user is authenticated, prioritize their review
    if (userId && populatedReviews.length > 0) {
      const userReviewIndex = populatedReviews.findIndex(
        (review) => review.userId._id.toString() === userId
      );

      if (userReviewIndex > 0) {
        // Move user's review to the front
        const userReview = populatedReviews.splice(userReviewIndex, 1)[0];
        populatedReviews.unshift(userReview);
      }
    }

    res.json({
      success: true,
      data: {
        reviews: populatedReviews,
        totalReviews: populatedReviews.length,
      },
    });
  } catch (error) {
    console.error("Error fetching game reviews:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch reviews",
    });
  }
};

// Create or update user's review for a game
const createOrUpdateReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }
    const { gameId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.id;

    // Validate if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Game not found",
      });
    } // Use service to create/update review
    const result = await ReviewService.createOrUpdateReview(userId, gameId, {
      rating,
      content,
    });

    res.json({
      success: true,
      data: result.review,
      message: result.message,
    });
  } catch (error) {
    console.error("Error creating/updating review:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "You already have a review for this game",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create/update review",
    });
  }
};

// Update user's review
const updateReview = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }
    const { reviewId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.id;

    // Find review and ensure it belongs to the user
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found or you are not authorized to update it",
      });
    } // Update review
    review.rating = rating;
    review.content = content;
    await review.save();

    // Update game's average rating and total reviews
    await updateGameRating(review.gameId);

    res.json({
      success: true,
      data: review,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update review",
    });
  }
};

// Delete user's review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Use service to delete review
    const result = await ReviewService.deleteReview(reviewId, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting review:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("not authorized")
    ) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete review",
    });
  }
};

// Get user's reviews (for profile page)
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user reviews without populate
    const reviews = await Review.find({ userId })
      .populate("gameId", "title thumbnail genre platform")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Manually populate user data
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findById(review.userId).lean();
        const reviewObj = review.toObject();
        reviewObj.userId = {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          avatarUrl: user.avatar,
        };
        return reviewObj;
      })
    );

    const totalReviews = await Review.countDocuments({ userId });
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.json({
      success: true,
      data: populatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        reviewsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch user reviews",
    });
  }
};

// Helper function to recalculate game rating
const updateGameRating = async (gameId) => {
  try {
    return await ReviewService.updateGameRating(gameId);
  } catch (error) {
    console.error("Error updating game rating:", error);
  }
};

module.exports = {
  getGameReviews,
  createOrUpdateReview,
  updateReview,
  deleteReview,
  getUserReviews,
};
