const { verifyToken } = require("../config/jwt");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
        message: "Please provide a valid authentication token",
      });
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
        message: "The user associated with this token no longer exists",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.message === "Invalid token") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "The provided token is invalid or expired",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      message: "An error occurred during authentication",
    });
  }
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by authenticateToken middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "Please authenticate to access this resource",
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({
        success: false,
        error: "Authorization failed",
        message: "An error occurred during authorization",
      });
    }
  };
};

// Convenience middleware for specific roles
const requireAdmin = requireRole(["admin", "superadmin"]);
const requireSuperAdmin = requireRole(["superadmin"]);

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  // Aliases for consistency
  auth: authenticateToken,
};
