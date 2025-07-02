const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { avatarUpload, handleMulterError } = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  checkUsernameAvailability,
  updateUsername,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
} = require("../controllers/userController");

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", authenticateToken, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticateToken, updateProfile);

// @route   GET /api/users/username/:username/availability
// @desc    Check username availability
// @access  Private
router.get(
  "/username/:username/availability",
  authenticateToken,
  checkUsernameAvailability
);

// @route   PUT /api/users/username
// @desc    Update username
// @access  Private
router.put("/username", authenticateToken, updateUsername);

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post(
  "/avatar",
  authenticateToken,
  avatarUpload,
  handleMulterError,
  uploadAvatar
);

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar
// @access  Private
router.delete("/avatar", authenticateToken, deleteAvatar);

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete("/account", authenticateToken, deleteAccount);

module.exports = router;
