const passport = require("passport");
require("../config/googleAuth");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");
const User = require("../models/User");

// Google OAuth login
const googleAuth = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

// Google OAuth callback
const googleCallback = async (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    try {
      const clientURL = process.env.CLIENT_URL;
      console.log("CLIENT_URL:", process.env.CLIENT_URL || "❌ Missing");
      console.log("Computed Client URL:", clientURL);

      if (err) {
        console.error("Google OAuth error:", err);
        return res.redirect(
          `${clientURL}/login?error=${encodeURIComponent(
            "Authentication failed"
          )}`
        );
      }

      if (!user) {
        return res.redirect(
          `${clientURL}/login?error=${encodeURIComponent(
            "Authentication failed"
          )}`
        );
      }

      const accessToken = generateToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      const redirectUrl = `${clientURL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`;
      console.log("Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Token generation error:", error);
      // Determine client URL for error redirect
      const clientURL = process.env.CLIENT_URL || "http://localhost:3000";
      // Redirect to frontend with error
      return res.redirect(
        `${clientURL}/login?error=${encodeURIComponent(
          "Token generation failed"
        )}`
      );
    }
  })(req, res, next);
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
        message: "Please provide a refresh token",
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "The user associated with this token no longer exists",
      });
    }

    // Generate new access token
    const newAccessToken = generateToken({ userId: user._id });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      tokens: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRE,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    if (error.message === "Invalid token") {
      return res.status(401).json({
        error: "Invalid refresh token",
        message: "The provided refresh token is invalid or expired",
      });
    }

    res.status(500).json({
      error: "Token refresh failed",
      message: "An error occurred while refreshing the token",
    });
  }
};

// Logout user (client-side token removal)
const logout = async (req, res) => {
  try {
    // Note: With JWT, logout is primarily handled client-side
    // by removing the token from storage. Server-side logout
    // would require token blacklisting, which we can implement later.

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      message: "An error occurred during logout",
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        avatarUrl: req.user.avatar, // Use avatar field for Cloudinary URL
        role: req.user.role || "user", // Include user role
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Failed to get user data",
      message: "An error occurred while fetching user information",
    });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  refreshToken,
  logout,
  getCurrentUser,
};
