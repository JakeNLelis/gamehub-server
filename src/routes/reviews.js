const express = require("express");
const router = express.Router();
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const {
  validateReview,
  validateObjectId,
} = require("../middleware/validation");
const {
  getGameReviews,
  createOrUpdateReview,
  updateReview,
  deleteReview,
  getUserReviews,
} = require("../controllers/reviewController");

// Get user's reviews (for profile page)
router.get("/user/reviews", authenticateToken, getUserReviews);

// Get reviews for a specific game (user's review first)
// This endpoint can be accessed without authentication
router.get(
  "/:gameId",
  validateObjectId("gameId"),
  optionalAuth,
  getGameReviews
);

// Create or update user's review for a game
router.post(
  "/:gameId",
  authenticateToken,
  validateObjectId("gameId"),
  validateReview,
  createOrUpdateReview
);

// Update user's review
router.put(
  "/:reviewId",
  authenticateToken,
  validateObjectId("reviewId"),
  validateReview,
  updateReview
);

// Delete user's review
router.delete(
  "/:reviewId",
  authenticateToken,
  validateObjectId("reviewId"),
  deleteReview
);

module.exports = router;
