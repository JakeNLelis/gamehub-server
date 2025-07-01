require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("./config/googleAuth");

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "http://localhost:3000",
          "http://localhost:5000",
          "*", // Allow images from any origin for development
        ],
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "http://localhost:5000",
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration for mobile apps
const corsOptions = {
  origin: function (origin, callback) {
    // Allow mobile apps (which don't send origin header)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.startsWith("http://localhost")) return callback(null, true);

    // Add your production domain here when needed
    // if (origin === 'https://yourdomain.com') return callback(null, true);

    callback(null, true); // For development, allow all origins
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "GameHub API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes will be added here
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to GameHub API",
    version: "1.0.0",
    status: "Phase 5: Deployment & Testing + Cloudinary Integration",
    endpoints: {
      health: "/health",
      auth: {
        base: "/api/auth",
        endpoints: [
          "GET /api/auth/google - Initiate Google OAuth",
          "GET /api/auth/google/callback - Google OAuth callback",
          "POST /api/auth/refresh - Refresh access token",
          "POST /api/auth/logout - Logout user (Protected)",
          "GET /api/auth/me - Get current user (Protected)",
        ],
      },
      games: {
        base: "/api/games",
        endpoints: [
          "GET /api/games - Get paginated games with filters",
          "GET /api/games/:id - Get single game details",
          "GET /api/games/filters/metadata - Get filter options",
          "GET /api/games/stats - Get game statistics",
          "GET /api/games/search/advanced - Advanced search",
        ],
        filters: [
          "?category={genre} - Filter by game genre",
          "?platform={platform} - Filter by platform",
          "?sort-by={sort} - Sort by (release-date, alphabetical, rating, relevance)",
          "?tag={tags} - Filter by tags (dot-separated)",
          "?search={query} - Search in title and description",
          "?page={num}&limit={num} - Pagination",
        ],
      },
      users: {
        base: "/api/users",
        endpoints: [
          "GET /api/users/profile - Get user profile (Protected)",
          "PUT /api/users/profile - Update user profile (Protected)",
          "POST /api/users/avatar - Upload user avatar to Cloudinary (Protected)",
          "DELETE /api/users/avatar - Delete user avatar from Cloudinary (Protected)",
        ],
        notes: [
          "Avatar uploads are processed via Cloudinary CDN",
          "Automatic image optimization and transformation applied",
          "Supports: JPG, JPEG, PNG, GIF, WEBP formats",
          "Maximum file size: 5MB per upload",
          "Images are automatically resized to 400x400px",
        ],
      },
      reviews: {
        base: "/api/reviews",
        endpoints: [
          "GET /api/reviews/:gameId - Get reviews for a game",
          "POST /api/reviews/:gameId - Create/update user's review (Protected)",
          "PUT /api/reviews/:reviewId - Update user's review (Protected)",
          "DELETE /api/reviews/:reviewId - Delete user's review (Protected)",
        ],
      },
      favorites: {
        base: "/api/favorites",
        endpoints: [
          "GET /api/favorites - Get user's favorite games (Protected)",
          "GET /api/favorites/:gameId/status - Check if game is favorited (Protected)",
          "POST /api/favorites/:gameId - Add game to favorites (Protected)",
          "DELETE /api/favorites/:gameId - Remove game from favorites (Protected)",
        ],
      },
      upcoming: ["Advanced User Management", "Testing & Polish"],
    },
    features: {
      completed: [
        "✅ Authentication System (Google OAuth + JWT)",
        "✅ User Management with Cloudinary Avatar Storage",
        "✅ Game System (External API Integration)",
        "✅ Game Search & Filtering",
        "✅ Automated Game Synchronization",
        "✅ Reviews System (Create, Read, Update, Delete)",
        "✅ Favorites System (Add, Remove, List)",
        "✅ Cloud-based Image Storage & Optimization",
      ],
      next: [
        "Unit & Integration Tests",
        "Error Handling Enhancement",
        "Performance Optimization",
        "Avatar Upload Frontend Testing",
      ],
    },
  });
});

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const reviewRoutes = require("./routes/reviews");
const favoriteRoutes = require("./routes/favorites");
const adminRoutes = require("./routes/admin");

// Import error handling middleware
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
