const Review = require("../models/Review");
const Game = require("../models/Game");

class ReviewService {
  /**
   * Get reviews for a game with user's review first
   * @param {string} gameId - Game ID
   * @param {string} userId - User ID (optional)
   * @returns {Object} Reviews data
   */
  static async getGameReviews(gameId, userId = null) {
    try {
      let userReview = null;
      let otherReviews = [];

      if (userId) {
        // Get user's review first if authenticated
        userReview = await Review.findOne({ gameId, userId });

        // Get other reviews (excluding user's review)
        otherReviews = await Review.find({
          gameId,
          userId: { $ne: userId },
        }).sort({ createdAt: -1 });
      } else {
        // If not authenticated, just get all reviews
        otherReviews = await Review.find({ gameId }).sort({ createdAt: -1 });
      }

      // Combine with user's review first
      const allReviews = userReview
        ? [userReview, ...otherReviews]
        : otherReviews;

      return {
        reviews: allReviews,
        userReview: userReview,
        totalReviews: allReviews.length,
      };
    } catch (error) {
      throw new Error(`Failed to fetch game reviews: ${error.message}`);
    }
  }

  /**
   * Calculate and update game rating statistics
   * @param {string} gameId - Game ID
   * @returns {Object} Updated game rating stats
   */
  static async updateGameRating(gameId) {
    try {
      const reviews = await Review.find({ gameId });
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      // Round to 2 decimal places
      const roundedAverageRating = Math.round(averageRating * 100) / 100;

      // Update game with new statistics
      const updatedGame = await Game.updateRating(
        gameId,
        roundedAverageRating,
        totalReviews
      );

      return {
        gameId,
        averageRating: roundedAverageRating,
        totalReviews,
        game: updatedGame,
      };
    } catch (error) {
      throw new Error(`Failed to update game rating: ${error.message}`);
    }
  }

  /**
   * Create a new review or update existing one
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID   * @param {Object} reviewData - Review data (rating, content)
   * @returns {Object} Created/updated review
   */
  static async createOrUpdateReview(userId, gameId, reviewData) {
    try {
      const { rating, content } = reviewData;

      // Check if user already has a review for this game
      let review = await Review.findOne({ userId, gameId });
      let isNewReview = false;
      if (review) {
        // Update existing review
        review.rating = rating;
        review.content = content;
        await review.save();
      } else {
        // Create new review
        review = new Review({
          userId,
          gameId,
          rating,
          content,
        });
        await review.save();
        isNewReview = true;
      }

      // Update game rating statistics
      await this.updateGameRating(gameId);

      return {
        review,
        isNewReview,
        message: isNewReview
          ? "Review created successfully"
          : "Review updated successfully",
      };
    } catch (error) {
      throw new Error(`Failed to create/update review: ${error.message}`);
    }
  }

  /**
   * Delete a review and update game statistics
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Deletion result
   */
  static async deleteReview(reviewId, userId) {
    try {
      // Find review and ensure it belongs to the user
      const review = await Review.findOne({ _id: reviewId, userId });
      if (!review) {
        throw new Error(
          "Review not found or you are not authorized to delete it"
        );
      }

      const gameId = review.gameId;

      // Delete review
      await Review.findByIdAndDelete(reviewId);

      // Update game rating statistics
      await this.updateGameRating(gameId);

      return {
        message: "Review deleted successfully",
        gameId,
      };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  /**
   * Get user's review for a specific game
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @returns {Object|null} User's review or null
   */
  static async getUserReview(userId, gameId) {
    try {
      return await Review.findOne({ userId, gameId });
    } catch (error) {
      throw new Error(`Failed to fetch user review: ${error.message}`);
    }
  }

  /**
   * Get user's reviews with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Paginated user reviews
   */
  static async getUserReviews(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const reviews = await Review.find({ userId })
        .populate("gameId", "title thumbnail genre platform")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalReviews = await Review.countDocuments({ userId });
      const totalPages = Math.ceil(totalReviews / limit);

      return {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          reviewsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`);
    }
  }
}

module.exports = ReviewService;
