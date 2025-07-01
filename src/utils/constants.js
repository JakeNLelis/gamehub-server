/**
 * Application Constants
 * Centralized constants used throughout the application
 */

// API Configuration
const API = {
  VERSION: "1.0.0",
  PREFIX: "/api",
  TIMEOUT: 30000, // 30 seconds
  MAX_REQUEST_SIZE: "10mb",
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

// File Upload Configuration
const FILE_UPLOAD = {
  AVATAR: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    DESTINATION: "uploads/avatars/",
  },
  GAME_IMAGES: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    DESTINATION: "uploads/games/",
  },
};

// Validation Limits
const VALIDATION_LIMITS = {
  NAME_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  BIO_MAX_LENGTH: 500,
  REVIEW_CONTENT_MIN_LENGTH: 10,
  REVIEW_CONTENT_MAX_LENGTH: 1000,
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
};

// JWT Configuration
const JWT = {
  ACCESS_TOKEN_EXPIRE: "7d",
  REFRESH_TOKEN_EXPIRE: "30d",
  ALGORITHM: "HS256",
};

// Game System Constants
const GAMES = {
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  MAX_GAMES_PER_PAGE: 100,
  POPULAR_TAGS_LIMIT: 20,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
};

// Review System Constants
const REVIEWS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_TITLE_LENGTH: 5,
  MAX_TITLE_LENGTH: 100,
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 1000,
  MAX_REVIEWS_PER_PAGE: 50,
};

// User System Constants
const USERS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  DEFAULT_AVATAR: null,
};

// Database Configuration
const DATABASE = {
  CONNECTION_TIMEOUT: 30000,
  MAX_POOL_SIZE: 10,
  SERVER_SELECTION_TIMEOUT: 5000,
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  AUTH_TOKEN_REQUIRED: "Authentication token is required",
  AUTH_TOKEN_INVALID: "Invalid or expired authentication token",
  AUTH_USER_NOT_FOUND: "User not found",
  AUTH_UNAUTHORIZED: "Unauthorized access",
  AUTH_FORBIDDEN: "Forbidden access", // User
  USER_NOT_FOUND: "User not found",
  PROFILE_FETCH_FAILED: "Failed to fetch user profile",
  PROFILE_UPDATE_FAILED: "Failed to update user profile",
  AVATAR_UPLOAD_FAILED: "Failed to upload avatar",
  AVATAR_DELETE_FAILED: "Failed to delete avatar",
  ACCOUNT_DELETE_FAILED: "Failed to delete account",

  // Validation
  VALIDATION_ERROR: "Validation error",
  VALIDATION_REQUIRED: "This field is required",
  VALIDATION_INVALID_EMAIL: "Invalid email format",
  VALIDATION_INVALID_RATING: "Rating must be between 1 and 5",
  VALIDATION_INVALID_OBJECT_ID: "Invalid ID format",
  VALIDATION_FILE_TOO_LARGE: "File size exceeds maximum limit",
  VALIDATION_INVALID_FILE_TYPE: "Invalid file type",

  // Games
  GAME_NOT_FOUND: "Game not found",
  GAME_SYNC_FAILED: "Game synchronization failed",
  GAME_API_ERROR: "External game API error",

  // Reviews
  REVIEW_NOT_FOUND: "Review not found",
  REVIEW_ALREADY_EXISTS: "You have already reviewed this game",
  REVIEW_UNAUTHORIZED: "You can only edit your own reviews",

  // Favorites
  FAVORITE_NOT_FOUND: "Favorite not found",
  FAVORITE_ALREADY_EXISTS: "Game is already in your favorites",

  // General
  SERVER_ERROR: "Internal server error",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  AUTH_LOGIN_SUCCESS: "Login successful",
  AUTH_LOGOUT_SUCCESS: "Logout successful",
  AUTH_TOKEN_REFRESHED: "Token refreshed successfully", // User
  PROFILE_UPDATED: "Profile updated successfully",
  AVATAR_UPLOADED: "Avatar uploaded successfully",
  AVATAR_DELETED: "Avatar deleted successfully",
  ACCOUNT_DELETED: "Account deleted successfully",
  USER_PROFILE_UPDATED: "Profile updated successfully",
  USER_AVATAR_UPLOADED: "Avatar uploaded successfully",
  USER_AVATAR_DELETED: "Avatar deleted successfully",

  // Games
  GAME_SYNC_SUCCESS: "Games synchronized successfully",
  GAMES_FETCHED: "Games retrieved successfully",

  // Reviews
  REVIEW_CREATED: "Review created successfully",
  REVIEW_UPDATED: "Review updated successfully",
  REVIEW_DELETED: "Review deleted successfully",

  // Favorites
  FAVORITE_ADDED: "Game added to favorites",
  FAVORITE_REMOVED: "Game removed from favorites",
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Game Genres (for validation and filtering)
const GAME_GENRES = [
  "Action",
  "Adventure",
  "Arcade",
  "Battle Royale",
  "Card Game",
  "Casino",
  "Fighting",
  "First-Person Shooter",
  "MMO",
  "MMORPG",
  "Puzzle",
  "Racing",
  "Real-Time Strategy",
  "RPG",
  "Simulation",
  "Sports",
  "Strategy",
  "Third-Person Shooter",
  "Tower Defense",
  "Turn-Based Strategy",
];

// Game Platforms
const GAME_PLATFORMS = [
  "PC (Windows)",
  "Web Browser",
  "Android",
  "iOS",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Mac",
  "Linux",
];

// Sort Options
const SORT_OPTIONS = {
  RELEVANCE: "relevance",
  RELEASE_DATE: "release-date",
  ALPHABETICAL: "alphabetical",
  RATING: "rating",
  POPULARITY: "popularity",
  RECENT: "recent",
};

// Cache Keys
const CACHE_KEYS = {
  GAMES_LIST: "games:list",
  GAME_DETAIL: "game:detail",
  FILTER_METADATA: "filters:metadata",
  POPULAR_TAGS: "tags:popular",
  GAME_STATS: "games:stats",
};

// Environment Types
const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
};

// Log Levels
const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  HTTP: "http",
  VERBOSE: "verbose",
  DEBUG: "debug",
  SILLY: "silly",
};

module.exports = {
  API,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION_LIMITS,
  RATE_LIMIT,
  JWT,
  GAMES,
  REVIEWS,
  USERS,
  DATABASE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  GAME_GENRES,
  GAME_PLATFORMS,
  SORT_OPTIONS,
  CACHE_KEYS,
  ENVIRONMENTS,
  LOG_LEVELS,
};
