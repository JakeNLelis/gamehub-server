const User = require("../models/User");
const path = require("path");
const fs = require("fs").promises;
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_LIMITS,
  FILE_UPLOAD,
} = require("../utils/constants");
const {
  validateRequired,
  generateUniqueFilename,
} = require("../utils/helpers");

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
        email: req.user.email,
        avatar: req.user.avatar,
        avatarUrl: req.user.avatarUrl,
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
    const { name } = req.body;

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

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
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
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatarUrl,
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
    const oldAvatar = req.user.avatar;

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = generateUniqueFilename("avatar", userId, fileExtension);

    // Define paths
    const uploadsDir = path.join(__dirname, "../../uploads/avatars");
    const filePath = path.join(uploadsDir, filename);

    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Move file from temp location to final location
    await fs.rename(req.file.path, filePath);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: filename },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      // Clean up uploaded file if user update fails
      await fs.unlink(filePath).catch(console.error);
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    // Remove old avatar file if it exists
    if (oldAvatar) {
      const oldFilePath = path.join(uploadsDir, oldAvatar);
      await fs.unlink(oldFilePath).catch((err) => {
        console.warn("Failed to delete old avatar:", err.message);
      });
    }

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.AVATAR_UPLOADED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
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
    const currentAvatar = req.user.avatar;

    if (!currentAvatar) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: "No avatar to delete",
      });
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: null },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        message: "User not found",
      });
    }

    // Delete avatar file
    const filePath = path.join(
      __dirname,
      "../../uploads/avatars",
      currentAvatar
    );
    await fs.unlink(filePath).catch((err) => {
      console.warn("Failed to delete avatar file:", err.message);
    });

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.AVATAR_DELETED,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        avatarUrl: updatedUser.avatarUrl,
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

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
};
