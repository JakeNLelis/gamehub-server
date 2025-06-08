const Favorite = require("../models/Favorite");
const Game = require("../models/Game");
const mongoose = require("mongoose");

class FavoriteService {
  /**
   * Get user's favorite games with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Paginated favorite games
   */ static async getUserFavorites(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const maxLimit = 100; // Prevent excessive requests
      const safeLimit = Math.min(limit, maxLimit);

      // Get user's favorites with pagination and populate game data
      const favorites = await Favorite.find({ userId })
        .populate("gameId")
        .sort({ addedAt: -1 }) // Most recently added first
        .skip(skip)
        .limit(safeLimit);

      // Get total count for pagination
      const totalFavorites = await Favorite.countDocuments({ userId });
      const totalPages = Math.ceil(totalFavorites / safeLimit);

      return {
        favorites,
        pagination: {
          currentPage: page,
          totalPages,
          totalFavorites,
          favoritesPerPage: safeLimit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error in getUserFavorites:", error);
      throw new Error(`Failed to fetch user favorites: ${error.message}`);
    }
  }
  /**
   * Add a game to user's favorites
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @returns {Object} Created favorite
   */
  static async addToFavorites(userId, gameId) {
    try {
      // Validate if game exists
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      // Check if already in favorites
      const existingFavorite = await Favorite.findOne({ userId, gameId });
      if (existingFavorite) {
        throw new Error("Game is already in your favorites");
      }

      // Create new favorite
      const favorite = new Favorite({
        userId,
        gameId,
      });

      await favorite.save();

      // Populate the game data for the response
      await favorite.populate("gameId");

      return {
        favorite,
        message: "Game added to favorites successfully",
      };
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        throw new Error("Game is already in your favorites");
      }
      throw new Error(`Failed to add game to favorites: ${error.message}`);
    }
  }

  /**
   * Remove a game from user's favorites
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @returns {Object} Deletion result
   */
  static async removeFromFavorites(userId, gameId) {
    try {
      // Find and delete favorite
      const favorite = await Favorite.findOneAndDelete({ userId, gameId });
      if (!favorite) {
        throw new Error("Game not found in favorites");
      }

      return {
        message: "Game removed from favorites successfully",
      };
    } catch (error) {
      throw new Error(`Failed to remove game from favorites: ${error.message}`);
    }
  }

  /**
   * Check if a game is in user's favorites
   * @param {string} userId - User ID
   * @param {string} gameId - Game ID
   * @returns {Object} Favorite status
   */
  static async checkFavoriteStatus(userId, gameId) {
    try {
      const favorite = await Favorite.findOne({ userId, gameId });

      return {
        isFavorite: !!favorite,
        favoriteId: favorite?._id || null,
        addedAt: favorite?.addedAt || null,
      };
    } catch (error) {
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }
  }
  /**
   * Get favorite games with advanced filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options (genre, platform, search, etc.)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Filtered favorite games
   */ static async getFilteredFavorites(
    userId,
    filters = {},
    page = 1,
    limit = 20
  ) {
    try {
      const { genre, platform, search, sortBy = "addedAt" } = filters;
      const skip = (page - 1) * limit;

      // Convert userId to ObjectId if it's a string
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Build aggregation pipeline
      const pipeline = [
        { $match: { userId: userObjectId } },
        {
          $lookup: {
            from: "games",
            localField: "gameId",
            foreignField: "_id",
            as: "gameId",
          },
        },
        { $unwind: "$gameId" },
      ];

      // Add filters
      const matchConditions = {};
      if (genre) {
        matchConditions["gameId.genre"] = new RegExp(genre, "i");
      }
      if (platform) {
        matchConditions["gameId.platform"] = new RegExp(platform, "i");
      }
      if (search) {
        matchConditions.$or = [
          { "gameId.title": new RegExp(search, "i") },
          { "gameId.shortDescription": new RegExp(search, "i") },
        ];
      }

      if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
      }

      // Add sorting
      const sortOptions = {};
      switch (sortBy) {
        case "title":
          sortOptions["gameId.title"] = 1;
          break;
        case "rating":
          sortOptions["gameId.averageRating"] = -1;
          break;
        case "release-date":
          sortOptions["gameId.releaseDate"] = -1;
          break;
        case "addedAt":
        default:
          sortOptions.addedAt = -1;
          break;
      }
      pipeline.push({ $sort: sortOptions });

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute aggregation
      const favorites = await Favorite.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = [...pipeline.slice(0, -2)]; // Remove skip and limit
      countPipeline.push({ $count: "total" });
      const countResult = await Favorite.aggregate(countPipeline);
      const totalFavorites = countResult[0]?.total || 0;
      const totalPages = Math.ceil(totalFavorites / limit);

      return {
        favorites,
        pagination: {
          currentPage: page,
          totalPages,
          totalFavorites,
          favoritesPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters,
      };
    } catch (error) {
      throw new Error(`Failed to fetch filtered favorites: ${error.message}`);
    }
  }

  /**
   * Get user's favorite game IDs (for quick checks)
   * @param {string} userId - User ID
   * @returns {Array} Array of game IDs
   */
  static async getUserFavoriteGameIds(userId) {
    try {
      const favorites = await Favorite.find({ userId }, "gameId");
      return favorites.map((fav) => fav.gameId.toString());
    } catch (error) {
      throw new Error(
        `Failed to fetch user favorite game IDs: ${error.message}`
      );
    }
  }
}

module.exports = FavoriteService;
