const express = require("express");
const router = express.Router();
const {
  getGames,
  getGameById,
  getFilterMetadata,
  getGameStats,
  syncGames,
  advancedSearch,
} = require("../controllers/gameController");
const { optionalAuth } = require("../middleware/auth");

// @route   GET /api/games
// @desc    Get paginated games list with filters
// @access  Public
// Query Parameters:
//   - category: Filter by genre/category
//   - platform: Filter by platform
//   - sort-by: Sort by (release-date, alphabetical, relevance, rating)
//   - tag: Filter by multiple tags (comma-separated)
//   - page: Pagination page number
//   - limit: Number of items per page
//   - search: Search in title and description
router.get("/", optionalAuth, getGames);

// @route   GET /api/games/filters/metadata
// @desc    Get available filter options (categories, platforms, tags)
// @access  Public
router.get("/filters/metadata", getFilterMetadata);

// @route   GET /api/games/stats
// @desc    Get game statistics
// @access  Public
router.get("/stats", getGameStats);

// @route   GET /api/games/search/advanced
// @desc    Advanced search with multiple filters
// @access  Public
// Query Parameters:
//   - query: Text search in title, description, developer, publisher
//   - genres: Comma-separated list of genres
//   - platforms: Comma-separated list of platforms
//   - minRating: Minimum average rating
//   - maxRating: Maximum average rating
//   - sortBy: Sort by (rating-desc, rating-asc, release-date-desc, release-date-asc, title-asc, title-desc)
//   - page: Pagination page number
//   - limit: Number of items per page
router.get("/search/advanced", optionalAuth, advancedSearch);

// @route   POST /api/games/sync
// @desc    Manually trigger game synchronization
// @access  Public (should be protected in production)
router.post("/sync", syncGames);

// @route   GET /api/games/:id
// @desc    Get single game details
// @access  Public
router.get("/:id", optionalAuth, getGameById);

module.exports = router;
