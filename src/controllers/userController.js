const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_LIMITS,
} = require("../utils/constants");
const { validateRequired } = require("../utils/helpers");

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        avatarUrl: req.user.avatar, // Use avatar field for Cloudinary URL
        role: req.user.role || "user", // Include user role
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: ERROR_MESSAGES.PROFILE_FETCH_FAILED,
      message: "An error occurred while fetching user profile",
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, username } = req.body;

    // Validate input
    const validation = validateRequired({ name });
    if (!validation.isValid) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: validation.message,
      });
    }

    // Check name length
    if (name.trim().length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: `Name cannot exceed ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`,
      });
    }

    const updateData = { name: name.trim() };

    // Handle username update if provided
    if (username !== undefined) {
      if (!username.trim()) {
        return res.status(400).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Username is required",
        });
      }

      if (username.trim().length < 3) {
        return res.status(400).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message: "Username must be at least 3 characters long",
        });
      }

      if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
        return res.status(400).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message:
            "Username can only contain letters, numbers, dots, and underscores",
        });
      }

      // Check if username is already taken by another user
      const existingUser = await User.findOne({
        username: username.trim(),
        _id: { $ne: req.user._id }, // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          message:
            "This username is already taken. Please choose a different one.",
        });
      }

      updateData.username = username.trim();
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatar, // Use avatar field for Cloudinary URL
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: error.message,
      });
    }

    res.status(500).json({
      error: ERROR_MESSAGES.PROFILE_UPDATE_FAILED,
      message: "An error occurred while updating user profile",
    });
  }
};

/**
 * Upload user avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "No avatar file provided",
      });
    }

    const userId = req.user._id;
    const oldAvatarPublicId = req.user.avatarPublicId; // Store Cloudinary public_id

    // File is already uploaded to Cloudinary via multer-storage-cloudinary
    const avatarUrl = req.file.path; // Cloudinary URL
    const publicId = req.file.filename; // Cloudinary public_id

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: avatarUrl,
        avatarPublicId: publicId,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      // Clean up uploaded file if user update fails
      await cloudinary.uploader.destroy(publicId).catch(console.error);
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    // Remove old avatar from Cloudinary if it exists
    if (oldAvatarPublicId) {
      await cloudinary.uploader.destroy(oldAvatarPublicId).catch((err) => {
        console.warn(
          "Failed to delete old avatar from Cloudinary:",
          err.message
        );
      });
    }

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.AVATAR_UPLOADED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatar, // Same as avatar for Cloudinary
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);

    // Clean up uploaded file on error
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(console.error);
    }

    res.status(500).json({
      error: ERROR_MESSAGES.AVATAR_UPLOAD_FAILED,
      message: "An error occurred while uploading avatar",
    });
  }
};

/**
 * Delete user avatar
 */
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentAvatarPublicId = req.user.avatarPublicId;

    if (!currentAvatarPublicId) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "No avatar to delete",
      });
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: null,
        avatarPublicId: null,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    // Delete avatar from Cloudinary
    await cloudinary.uploader.destroy(currentAvatarPublicId).catch((err) => {
      console.warn("Failed to delete avatar from Cloudinary:", err.message);
    });

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.AVATAR_DELETED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Delete avatar error:", error);
    res.status(500).json({
      error: ERROR_MESSAGES.AVATAR_DELETE_FAILED,
      message: "An error occurred while deleting avatar",
    });
  }
};

/**
 * Delete user account and all associated data
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const User = require("../models/User");
    const Review = require("../models/Review");
    const Favorite = require("../models/Favorite");
    const Game = require("../models/Game");

    // Get user data first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    // Delete user's avatar file if exists
    if (user.avatar) {
      const avatarPath = path.join(
        __dirname,
        "../../uploads/avatars",
        user.avatar
      );
      try {
        await fs.unlink(avatarPath);
      } catch (error) {
        console.warn("Failed to delete avatar file:", error.message);
      }
    }

    // Get all user's reviews to update game statistics
    const userReviews = await Review.find({ userId });

    // Update game statistics for each reviewed game
    for (const review of userReviews) {
      const reviews = await Review.find({
        gameId: review.gameId,
        userId: { $ne: userId },
      });
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      await Game.findByIdAndUpdate(review.gameId, {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      });
    }

    // Delete user's reviews
    await Review.deleteMany({ userId });

    // Delete user's favorites
    await Favorite.deleteMany({ userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message:
        SUCCESS_MESSAGES.ACCOUNT_DELETED || "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      error: ERROR_MESSAGES.ACCOUNT_DELETE_FAILED || "Account deletion failed",
      message: "An error occurred while deleting the account",
    });
  }
};

/**
 * Check username availability
 */
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    // Validate username format
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "Username must be between 3 and 20 characters",
      });
    }

    // Check if username contains only allowed characters (alphanumeric, underscore, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") }, // Case-insensitive check
    });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
    });
  } catch (error) {
    console.error("Check username availability error:", error);
    res.status(500).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: "An error occurred while checking username availability",
    });
  }
};

/**
 * Update username
 */
const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // Validate username format
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "Username must be between 3 and 20 characters",
      });
    }

    // Check if username contains only allowed characters
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
      _id: { $ne: req.user._id }, // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "Username is already taken",
      });
    }

    // Update user username
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.toLowerCase() }, // Store username in lowercase
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Username updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update username error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "Username is already taken",
      });
    }

    res.status(500).json({
      error: ERROR_MESSAGES.PROFILE_UPDATE_FAILED,
      message: "An error occurred while updating username",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  checkUsernameAvailability,
  updateUsername,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
};
