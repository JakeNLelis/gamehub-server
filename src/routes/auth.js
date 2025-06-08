const express = require("express");
const router = express.Router();
const {
  googleAuth,
  googleCallback,
  refreshToken,
  logout,
  getCurrentUser,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get("/google", googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get("/google/callback", googleCallback);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post("/refresh", refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", authenticateToken, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, getCurrentUser);

// @route   GET /api/auth/profile
// @desc    Get current user profile (alias for /me)
// @access  Private
router.get("/profile", authenticateToken, getCurrentUser);

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account and all associated data
// @access  Private
router.delete(
  "/delete-account",
  authenticateToken,
  require("../controllers/userController").deleteAccount
);

module.exports = router;
