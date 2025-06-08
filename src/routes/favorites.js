const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
  getFilteredFavorites,
} = require("../controllers/favoriteController");

// Get user's favorite games with advanced filtering
router.get("/filtered", authenticateToken, getFilteredFavorites);

// Get user's favorite games
router.get("/", authenticateToken, getUserFavorites);

// Check if a game is in user's favorites
router.get(
  "/check/:gameId",
  authenticateToken,
  validateObjectId("gameId"),
  checkFavoriteStatus
);

// Add game to favorites
router.post(
  "/:gameId",
  authenticateToken,
  validateObjectId("gameId"),
  addToFavorites
);

// Remove game from favorites
router.delete(
  "/:gameId",
  authenticateToken,
  validateObjectId("gameId"),
  removeFromFavorites
);

module.exports = router;
