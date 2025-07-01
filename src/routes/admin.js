const express = require("express");
const router = express.Router();
const { auth, requireRole } = require("../middleware/auth");
const { thumbnailUpload } = require("../config/cloudinary");
const Game = require("../models/Game");
const Review = require("../models/Review");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

// Middleware to check for admin or superadmin role
const requireAdmin = requireRole(["admin", "superadmin"]);
const requireSuperAdmin = requireRole(["superadmin"]);

// =============================================================================
// IMAGE UPLOAD ROUTES (Admin & SuperAdmin)
// =============================================================================

// @route   POST /api/admin/upload/thumbnail
// @desc    Upload game thumbnail image to Cloudinary
// @access  Admin/SuperAdmin
router.post(
  "/upload/thumbnail",
  auth,
  requireAdmin,
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      // Return the Cloudinary URL
      res.json({
        success: true,
        data: {
          url: req.file.path,
          public_id: req.file.filename,
        },
        message: "Thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload thumbnail",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/admin/upload/background
// @desc    Upload game background image to Cloudinary
// @access  Admin/SuperAdmin
router.post(
  "/upload/background",
  auth,
  requireAdmin,
  thumbnailUpload.single("background"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      // Return the Cloudinary URL
      res.json({
        success: true,
        data: {
          url: req.file.path,
          public_id: req.file.filename,
        },
        message: "Background image uploaded successfully",
      });
    } catch (error) {
      console.error("Background image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload background image",
        error: error.message,
      });
    }
  }
);

// =============================================================================
// GAME MANAGEMENT ROUTES (Admin & SuperAdmin)
// =============================================================================

// @route   GET /api/admin/games
// @desc    Get all games with pagination (for admin management)
// @access  Admin/SuperAdmin
router.get("/games", auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build search filter
    const filter = search
      ? {
          $or: [
            { title: new RegExp(search, "i") },
            { developer: new RegExp(search, "i") },
            { publisher: new RegExp(search, "i") },
          ],
        }
      : {};

    const [games, totalGames] = await Promise.all([
      Game.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Game.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalGames / limit);

    res.json({
      success: true,
      data: games,
      pagination: {
        currentPage: page,
        totalPages,
        totalGames,
        gamesPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Admin get games error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
      error: error.message,
    });
  }
});

// @route   POST /api/admin/games
// @desc    Create a new game
// @access  Admin/SuperAdmin
router.post(
  "/games",
  auth,
  requireAdmin,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("thumbnail").isURL().withMessage("Valid thumbnail URL is required"),
    body("shortDescription")
      .notEmpty()
      .withMessage("Short description is required"),
    body("gameUrl").isURL().withMessage("Valid game URL is required"),
    body("genre")
      .isArray({ min: 1 })
      .withMessage("At least one genre is required"),
    body("platform")
      .isArray({ min: 1 })
      .withMessage("At least one platform is required"),
    body("publisher").notEmpty().withMessage("Publisher is required"),
    body("developer").notEmpty().withMessage("Developer is required"),
    body("releaseDate")
      .isISO8601()
      .withMessage("Valid release date is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const gameData = {
        ...req.body,
        releaseDate: new Date(req.body.releaseDate),
        averageRating: 0,
        totalReviews: 0,
        inPlayersFavorites: 0,
      };

      const game = new Game(gameData);
      await game.save();

      res.status(201).json({
        success: true,
        message: "Game created successfully",
        data: game,
      });
    } catch (error) {
      console.error("Admin create game error:", error);

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A game with this title already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create game",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/admin/games/:id
// @desc    Update a game
// @access  Admin/SuperAdmin
router.put(
  "/games/:id",
  auth,
  requireAdmin,
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("thumbnail")
      .optional()
      .isURL()
      .withMessage("Valid thumbnail URL is required"),
    body("gameUrl")
      .optional()
      .isURL()
      .withMessage("Valid game URL is required"),
    body("genre")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one genre is required"),
    body("platform")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one platform is required"),
    body("releaseDate")
      .optional()
      .isISO8601()
      .withMessage("Valid release date is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const gameId = req.params.id;
      const updateData = { ...req.body };

      // Convert release date if provided
      if (updateData.releaseDate) {
        updateData.releaseDate = new Date(updateData.releaseDate);
      }

      const game = await Game.findByIdAndUpdate(gameId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      res.json({
        success: true,
        message: "Game updated successfully",
        data: game,
      });
    } catch (error) {
      console.error("Admin update game error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update game",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/admin/games/:id
// @desc    Delete a game
// @access  Admin/SuperAdmin
router.delete("/games/:id", auth, requireAdmin, async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // Delete all reviews associated with this game
    await Review.deleteMany({ game: gameId });

    // Delete the game
    await Game.findByIdAndDelete(gameId);

    res.json({
      success: true,
      message: "Game and associated reviews deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete game error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete game",
      error: error.message,
    });
  }
});

// =============================================================================
// REVIEW MANAGEMENT ROUTES (Admin & SuperAdmin)
// =============================================================================

// @route   GET /api/admin/reviews
// @desc    Get all reviews with pagination (for admin management)
// @access  Admin/SuperAdmin
router.get("/reviews", auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const gameId = req.query.gameId;

    // Build filter
    const filter = gameId ? { game: gameId } : {};

    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email username")
        .populate("game", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        reviewsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Admin get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete a review
// @access  Admin/SuperAdmin
router.delete("/reviews/:id", auth, requireAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update game's rating and review count
    const reviews = await Review.find({ game: review.game });
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await Game.findByIdAndUpdate(review.game, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
});

// =============================================================================
// USER MANAGEMENT ROUTES (SuperAdmin Only)
// =============================================================================

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  SuperAdmin
router.get("/users", auth, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role;

    // Build search filter
    let filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { username: new RegExp(search, "i") },
      ];
    }
    if (role && ["user", "admin", "superadmin"].includes(role)) {
      filter.role = role;
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-googleId") // Don't expose googleId
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        usersPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Promote or demote a user's role
// @access  SuperAdmin
router.put(
  "/users/:id/role",
  auth,
  requireSuperAdmin,
  [
    body("role")
      .isIn(["user", "admin", "superadmin"])
      .withMessage("Role must be user, admin, or superadmin"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const userId = req.params.id;
      const { role } = req.body;

      // Prevent superadmin from demoting themselves
      if (
        userId === req.user.id &&
        req.user.role === "superadmin" &&
        role !== "superadmin"
      ) {
        return res.status(400).json({
          success: false,
          message: "SuperAdmin cannot demote themselves",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select("-googleId");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        data: user,
      });
    } catch (error) {
      console.error("Admin update user role error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user role",
        error: error.message,
      });
    }
  }
);

// =============================================================================
// ADMIN DASHBOARD STATS
// =============================================================================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin/SuperAdmin
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const [
      totalGames,
      totalUsers,
      totalReviews,
      totalAdmins,
      recentGames,
      recentReviews,
      topRatedGames,
    ] = await Promise.all([
      Game.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
      Game.find().sort({ createdAt: -1 }).limit(5).lean(),
      Review.find()
        .populate("userId", "name")
        .populate("gameId", "title")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Game.find({ totalReviews: { $gte: 1 } })
        .sort({ averageRating: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalGames,
          totalUsers,
          totalReviews,
          totalAdmins,
        },
        recentActivity: {
          recentGames,
          recentReviews,
        },
        insights: {
          topRatedGames,
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message,
    });
  }
});

module.exports = router;
