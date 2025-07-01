#!/usr/bin/env node

/**
 * Game Data Synchronization Script
 *
 * Usage:
 *   node scripts/fetchGames.js
 *   npm run sync-games
 *
 * Features:
 * - Fetches all games from API
 * - Updates existing games or creates new ones
 * - Preserves user ratings and reviews
 * - Provides detailed logging and error reporting
 * - Handles API rate limiting and errors gracefully
 */

require("dotenv").config();
const mongoose = require("mongoose");
// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🗃️  MongoDB Connected for game sync");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\n🛑 Received shutdown signal...");
  try {
    await mongoose.connection.close();
    console.log("🗃️  MongoDB connection closed");
    console.log("👋 Game sync process terminated");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
    process.exit(1);
  }
};

// Handle process signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Main execution
const main = async () => {
  try {
    await connectDB();
    await syncGames();
  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  }
};

// Check if script is run directly
if (require.main === module) {
  main();
}

module.exports = {
  syncGames: main,
};
