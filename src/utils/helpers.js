/**
 * Utility Helper Functions
 * Common utility functions used across the application
 */

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  const mongoose = require("mongoose");
  return mongoose.Types.ObjectId.isValid(id);
};

// Sanitize search query
const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== "string") {
    return "";
  }

  // Remove special regex characters and limit length
  return query
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
    .substring(0, 100); // Limit to 100 characters
};

// Validate pagination parameters
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  // Ensure reasonable limits
  const safePage = Math.max(1, pageNum);
  const safeLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 items per page

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

// Format date for API responses
const formatDate = (date) => {
  if (!date) return null;

  try {
    return new Date(date).toISOString();
  } catch (error) {
    return null;
  }
};

// Calculate average rating
const calculateAverageRating = (ratings) => {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 100) / 100; // Round to 2 decimal places
};

// Generate unique filename for uploads
const generateUniqueFilename = (prefix, userId, extension) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const userIdSuffix = userId ? userId.toString().slice(-6) : "anon";

  return `${prefix}-${userIdSuffix}-${timestamp}-${random}${extension}`;
};

// Validate required fields
const validateRequired = (fields) => {
  const missingFields = [];

  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === "string" && value.trim().length === 0)) {
      missingFields.push(key);
    }
  }

  return {
    isValid: missingFields.length === 0,
    message:
      missingFields.length > 0
        ? `Missing required fields: ${missingFields.join(", ")}`
        : null,
    missingFields,
  };
};

// Validate image file type
const isValidImageType = (mimetype) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  return allowedTypes.includes(mimetype);
};

// Convert file size to human readable format
const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validate rating value (1-5 stars)
const validateRating = (rating) => {
  const ratingNum = parseFloat(rating);
  return !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
};

// Extract keywords from text for search indexing
const extractKeywords = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace non-word characters with spaces
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 2) // Filter out short words
    .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
    .slice(0, 20); // Limit to 20 keywords
};

// Create slug from title
const createSlug = (title) => {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random string
const generateRandomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove empty values from object
const removeEmptyValues = (obj) => {
  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== "") {
      if (typeof value === "object" && !Array.isArray(value)) {
        const cleanedNested = removeEmptyValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
};

// Capitalize first letter of each word
const titleCase = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Truncate text with ellipsis
const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength).trim() + "...";
};

// Calculate time ago
const timeAgo = (date) => {
  if (!date) return "";

  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

module.exports = {
  isValidObjectId,
  sanitizeSearchQuery,
  validatePagination,
  formatDate,
  calculateAverageRating,
  generateUniqueFilename,
  validateRequired,
  isValidImageType,
  formatFileSize,
  validateRating,
  extractKeywords,
  createSlug,
  isValidEmail,
  generateRandomString,
  deepClone,
  removeEmptyValues,
  titleCase,
  truncateText,
  timeAgo,
};
