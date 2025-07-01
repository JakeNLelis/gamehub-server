const Game = require("../models/Game");

class GameService {
  constructor() {
    // Standalone game API service
  }

  // Get available categories/genres
  async getAvailableCategories() {
    try {
      const categories = await Game.distinct("genre");
      return categories.filter((cat) => cat && cat.trim() !== "").sort();
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  // Get available platforms
  async getAvailablePlatforms() {
    try {
      // For array-type platform field, we need to use aggregation to flatten arrays
      const platforms = await Game.aggregate([
        { $unwind: "$platform" },
        { $group: { _id: "$platform" } },
        { $sort: { _id: 1 } },
      ]);

      return platforms
        .map((p) => p._id)
        .filter((platform) => platform && platform.trim() !== "")
        .sort();
    } catch (error) {
      throw new Error(`Failed to get platforms: ${error.message}`);
    }
  }

  // Get popular tags based on game data
  async getPopularTags() {
    try {
      const games = await Game.find({}, "genre title shortDescription").lean();
      const tagCount = {};

      games.forEach((game) => {
        // Extract potential tags from genre, title, and description
        const text =
          `${game.genre} ${game.title} ${game.shortDescription}`.toLowerCase();

        // Common gaming tags to look for
        const commonTags = [
          "3d",
          "2d",
          "pvp",
          "pve",
          "mmorpg",
          "rpg",
          "fps",
          "strategy",
          "fantasy",
          "sci-fi",
          "medieval",
          "modern",
          "action",
          "adventure",
          "multiplayer",
          "singleplayer",
          "free-to-play",
          "browser",
          "client",
          "anime",
          "zombie",
          "survival",
          "battle",
          "war",
          "space",
          "shooter",
        ];

        commonTags.forEach((tag) => {
          if (text.includes(tag)) {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        });
      });

      // Sort tags by popularity
      return Object.entries(tagCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20) // Top 20 tags
        .map(([tag, count]) => ({ tag, count }));
    } catch (error) {
      throw new Error(`Failed to get popular tags: ${error.message}`);
    }
  }

  // Get filter metadata endpoint
  async getFilterMetadata() {
    try {
      const [categories, platforms, tags] = await Promise.all([
        this.getAvailableCategories(),
        this.getAvailablePlatforms(),
        this.getPopularTags(),
      ]);

      return {
        categories: categories.map((cat) => ({
          name: cat,
          displayName: cat.charAt(0).toUpperCase() + cat.slice(1),
        })),
        platforms: platforms.map((platform) => ({
          name: platform,
          displayName: platform,
        })),
        popularTags: tags,
        sortOptions: [
          { value: "relevance", label: "Most Relevant" },
          { value: "release-date", label: "Release Date" },
          { value: "alphabetical", label: "A-Z" },
          { value: "rating", label: "Highest Rated" },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get filter metadata: ${error.message}`);
    }
  }

  // Advanced game search with filters
  async searchGames(options = {}) {
    try {
      const {
        category,
        platform,
        sortBy = "relevance",
        tag,
        page = 1,
        limit = 20,
        search,
      } = options;

      // Build filter object
      const filter = {};

      // Category filter (genre)
      if (category) {
        filter.genre = new RegExp(category, "i"); // Case-insensitive
      }

      // Platform filter - updated for array-type platform field
      if (platform) {
        filter.platform = { $in: [new RegExp(platform, "i")] };
      }

      // Search filter (title and description)
      if (search) {
        filter.$or = [
          { title: new RegExp(search, "i") },
          { shortDescription: new RegExp(search, "i") },
        ];
      }

      // Tag filter (multiple tags separated by dots)
      if (tag) {
        const tags = tag.split(".");
        // For tags, we'll search in genre, title, and description
        const tagRegex = tags.map((t) => new RegExp(t, "i"));
        filter.$and = tagRegex.map((regex) => ({
          $or: [
            { genre: regex },
            { title: regex },
            { shortDescription: regex },
            { developer: regex },
            { publisher: regex },
          ],
        }));
      }

      // Build sort object
      let sort = {};
      switch (sortBy) {
        case "release-date":
          sort = { releaseDate: -1 }; // Newest first
          break;
        case "alphabetical":
          sort = { title: 1 }; // A-Z
          break;
        case "rating":
          sort = { averageRating: -1, totalReviews: -1 }; // Highest rated first
          break;
        case "relevance":
        default:
          sort = { lastUpdated: -1 }; // Most recently updated first
          break;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const maxLimit = 100; // Prevent excessive requests
      const safeLimit = Math.min(parseInt(limit), maxLimit);

      // Execute query
      const [games, totalGames] = await Promise.all([
        Game.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(), // Use lean() for better performance
        Game.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalGames / safeLimit);

      // Response with pagination metadata
      return {
        success: true,
        data: games,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalGames,
          gamesPerPage: safeLimit,
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1,
        },
        filters: {
          category,
          platform,
          sortBy,
          tag,
          search,
        },
      };
    } catch (error) {
      throw new Error(`Failed to search games: ${error.message}`);
    }
  }

  // Get single game by ID
  async getGameById(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error("Game not found");
      }
      return game;
    } catch (error) {
      throw new Error(`Failed to get game: ${error.message}`);
    }
  }
  // Get game statistics
  async getGameStats() {
    try {
      const User = require("../models/User");
      const Review = require("../models/Review");

      const [
        totalGames,
        totalUsers,
        totalReviews,
        topRatedGames,
        recentGames,
        genreStats,
      ] = await Promise.all([
        Game.countDocuments(),
        User.countDocuments(),
        Review.countDocuments(),
        Game.find({ totalReviews: { $gte: 5 } })
          .sort({ averageRating: -1 })
          .limit(10)
          .lean(),
        Game.find().sort({ releaseDate: -1 }).limit(10).lean(),
        Game.aggregate([
          {
            $group: {
              _id: "$genre",
              count: { $sum: 1 },
              avgRating: { $avg: "$averageRating" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return {
        totalGames,
        totalUsers,
        totalReviews,
        topRatedGames,
        recentGames,
        genreStats,
      };
    } catch (error) {
      throw new Error(`Failed to get game statistics: ${error.message}`);
    }
  }
}

module.exports = new GameService();
