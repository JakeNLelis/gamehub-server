const Favorite = require("../models/Favorite");
const Game = require("../models/Game");
const FavoriteService = require("../services/favoriteService");

// Get user's favorite games
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, genre, platform, search, sortBy } = req.query;

    // If filtering is requested, use the filtered service
    if (genre || platform || search || sortBy) {
      const filters = { genre, platform, search, sortBy };
      const result = await FavoriteService.getFilteredFavorites(
        userId,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return res.json({
        success: true,
        data: result.favorites,
        pagination: result.pagination,
        filters: result.filters,
      });
    }

    // Use service to get user favorites
    const result = await FavoriteService.getUserFavorites(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.favorites,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch favorites",
    });
  }
};

// Add game to favorites
const addToFavorites = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // Use service to add to favorites
    const result = await FavoriteService.addToFavorites(userId, gameId);

    res.status(201).json({
      success: true,
      data: result.favorite,
      message: result.message,
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("already in")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to add game to favorites",
    });
  }
};

// Remove game from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // Use service to remove from favorites
    const result = await FavoriteService.removeFromFavorites(userId, gameId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to remove game from favorites",
    });
  }
};

// Check if a game is in user's favorites
const checkFavoriteStatus = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // Use service to check favorite status
    const result = await FavoriteService.checkFavoriteStatus(userId, gameId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check favorite status",
    });
  }
};

// Get filtered favorites with advanced filtering
const getFilteredFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { genre, platform, search, sortBy, page = 1, limit = 20 } = req.query;

    const filters = { genre, platform, search, sortBy };

    // Use service to get filtered favorites
    const result = await FavoriteService.getFilteredFavorites(
      userId,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.favorites,
      pagination: result.pagination,
      filters: result.filters,
    });
  } catch (error) {
    console.error("Error fetching filtered favorites:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch filtered favorites",
    });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
  getFilteredFavorites,
};
