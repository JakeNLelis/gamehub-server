// Performance monitoring and optimization utilities
const mongoose = require("mongoose");

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;

    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(
        `Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    }

    // Add performance header
    res.set("X-Response-Time", `${duration}ms`);

    return originalJson.call(this, data);
  };

  next();
};

// Database query optimization helpers
const optimizeQuery = (query) => {
  // Add common optimizations
  return query
    .lean() // Return plain JavaScript objects instead of Mongoose documents
    .cache(300); // Cache for 5 minutes if mongoose-cache is available
};

// Pagination helper with performance optimizations
const paginateQuery = (query, page = 1, limit = 20) => {
  const maxLimit = 100;
  const safeLimit = Math.min(parseInt(limit), maxLimit);
  const skip = (parseInt(page) - 1) * safeLimit;

  return {
    query: query.skip(skip).limit(safeLimit),
    pagination: {
      currentPage: parseInt(page),
      itemsPerPage: safeLimit,
      skip,
    },
  };
};

// Memory usage monitoring
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
};

// Database connection monitoring
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: Math.round(stats.dataSize / 1024 / 1024), // MB
      indexSize: Math.round(stats.indexSize / 1024 / 1024), // MB
      storageSize: Math.round(stats.storageSize / 1024 / 1024), // MB
      objects: stats.objects,
    };
  } catch (error) {
    return null;
  }
};

// Response compression helper
const shouldCompress = (req, res) => {
  // Don't compress images or already compressed content
  if (
    req.headers["accept-encoding"] &&
    req.headers["accept-encoding"].includes("gzip")
  ) {
    const contentType = res.get("Content-Type");
    if (
      contentType &&
      (contentType.includes("application/json") ||
        contentType.includes("text/") ||
        contentType.includes("application/javascript"))
    ) {
      return true;
    }
  }
  return false;
};

// Cache headers helper
const setCacheHeaders = (res, maxAge = 300) => {
  res.set({
    "Cache-Control": `public, max-age=${maxAge}`,
    ETag: `"${Date.now()}"`,
    "Last-Modified": new Date().toUTCString(),
  });
};

// API rate limiting per user (more granular than IP-based)
const userRateLimit = new Map();

const checkUserRateLimit = (
  userId,
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!userRateLimit.has(userId)) {
    userRateLimit.set(userId, []);
  }

  const userRequests = userRateLimit.get(userId);

  // Remove old requests outside the window
  const validRequests = userRequests.filter(
    (timestamp) => timestamp > windowStart
  );

  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request
  validRequests.push(now);
  userRateLimit.set(userId, validRequests);

  return true; // Request allowed
};

// Clean up rate limit data periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  for (const [userId, requests] of userRateLimit.entries()) {
    const validRequests = requests.filter(
      (timestamp) => timestamp > now - windowMs
    );
    if (validRequests.length === 0) {
      userRateLimit.delete(userId);
    } else {
      userRateLimit.set(userId, validRequests);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

module.exports = {
  requestLogger,
  optimizeQuery,
  paginateQuery,
  getMemoryUsage,
  getDatabaseStats,
  shouldCompress,
  setCacheHeaders,
  checkUserRateLimit,
};
