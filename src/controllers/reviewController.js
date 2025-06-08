const Review = require("../models/Review");
const Game = require("../models/Game");
const ReviewService = require("../services/reviewService");
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

    // Use service to get reviews
    const reviewData = await ReviewService.getGameReviews(gameId, userId);

    res.json({
      success: true,
      data: reviewData,
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

    // Use service to get user reviews
    const result = await ReviewService.getUserReviews(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
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
