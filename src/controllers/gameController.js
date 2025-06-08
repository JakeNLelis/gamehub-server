const gameService = require("../services/gameService");
const Game = require("../models/Game");

// @route   GET /api/games
// @desc    Get paginated games list with filters
// @access  Public
const getGames = async (req, res) => {
  try {
    // Map "sort-by" parameter to "sortBy" for service compatibility
    const queryParams = { ...req.query };
    if (queryParams["sort-by"]) {
      queryParams.sortBy = queryParams["sort-by"];
      delete queryParams["sort-by"];
    }

    const result = await gameService.searchGames(queryParams);
    res.json(result);
  } catch (error) {
    console.error("Get games error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve games",
      message: error.message,
    });
  }
};

// @route   GET /api/games/:id
// @desc    Get single game details
// @access  Public
const getGameById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Game ID is required",
        message: "Please provide a valid game ID",
      });
    }

    const game = await gameService.getGameById(id);

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    console.error("Get game by ID error:", error);

    if (error.message === "Game not found") {
      return res.status(404).json({
        success: false,
        error: "Game not found",
        message: "The requested game does not exist",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to retrieve game",
      message: error.message,
    });
  }
};

// @route   GET /api/games/filters/metadata
// @desc    Get available filter options (categories, platforms, tags)
// @access  Public
const getFilterMetadata = async (req, res) => {
  try {
    const metadata = await gameService.getFilterMetadata();

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Get filter metadata error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve filter metadata",
      message: error.message,
    });
  }
};

// @route   GET /api/games/stats
// @desc    Get game statistics (admin/development endpoint)
// @access  Public
const getGameStats = async (req, res) => {
  try {
    const stats = await gameService.getGameStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get game stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve game statistics",
      message: error.message,
    });
  }
};

// @route   POST /api/games/sync
// @desc    Manually trigger game synchronization (admin endpoint)
// @access  Public (should be protected in production)
const syncGames = async (req, res) => {
  try {
    console.log("🔄 Manual game sync triggered");
    const result = await gameService.syncGames();

    if (result.success) {
      res.json({
        success: true,
        message: "Game synchronization completed successfully",
        data: result.stats,
        errors: result.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Game synchronization failed",
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Sync games error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to synchronize games",
      message: error.message,
    });
  }
};

// @route   GET /api/games/search/advanced
// @desc    Advanced search with multiple filters (alternative endpoint)
// @access  Public
const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      genres,
      platforms,
      minRating,
      maxRating,
      sortBy,
      page,
      limit,
    } = req.query;

    // Build advanced filter object
    const filter = {};

    // Text search
    if (query) {
      filter.$or = [
        { title: new RegExp(query, "i") },
        { shortDescription: new RegExp(query, "i") },
        { developer: new RegExp(query, "i") },
        { publisher: new RegExp(query, "i") },
      ];
    }

    // Multiple genres filter
    if (genres) {
      const genreList = genres.split(",").map((g) => g.trim());
      filter.genre = { $in: genreList.map((g) => new RegExp(g, "i")) };
    }

    // Multiple platforms filter
    if (platforms) {
      const platformList = platforms.split(",").map((p) => p.trim());
      filter.platform = { $in: platformList.map((p) => new RegExp(p, "i")) };
    }

    // Rating range filter
    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = parseFloat(minRating);
      if (maxRating) filter.averageRating.$lte = parseFloat(maxRating);
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "rating-desc":
        sort = { averageRating: -1, totalReviews: -1 };
        break;
      case "rating-asc":
        sort = { averageRating: 1 };
        break;
      case "release-date-desc":
        sort = { releaseDate: -1 };
        break;
      case "release-date-asc":
        sort = { releaseDate: 1 };
        break;
      case "title-asc":
        sort = { title: 1 };
        break;
      case "title-desc":
        sort = { title: -1 };
        break;
      default:
        sort = { lastUpdated: -1 };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [games, totalGames] = await Promise.all([
      Game.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Game.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalGames / limitNum);

    res.json({
      success: true,
      data: games,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalGames,
        gamesPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      filters: {
        query,
        genres,
        platforms,
        minRating,
        maxRating,
        sortBy,
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({
      success: false,
      error: "Advanced search failed",
      message: error.message,
    });
  }
};

module.exports = {
  getGames,
  getGameById,
  getFilterMetadata,
  getGameStats,
  syncGames,
  advancedSearch,
};
