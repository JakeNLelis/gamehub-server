#!/usr/bin/env node

/**
 * Game Data Synchronization Script
 *
 * This script fetches game data from the FreeToGame API and synchronizes
 * it with our MongoDB database. It can be run manually or scheduled as a cron job.
 *
 * Usage:
 *   node scripts/fetchGames.js
 *   npm run sync-games
 *
 * Features:
 * - Fetches all games from FreeToGame API
 * - Updates existing games or creates new ones
 * - Preserves user ratings and reviews
 * - Provides detailed logging and error reporting
 * - Handles API rate limiting and errors gracefully
 */

require("dotenv").config();
const mongoose = require("mongoose");
const gameService = require("../src/services/gameService");

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

// Main synchronization function
const syncGames = async () => {
  const startTime = Date.now();
  console.log("🚀 Starting game synchronization...");
  console.log("⏰ Start time:", new Date().toISOString());
  console.log("🌐 API URL:", process.env.FREETOGAME_API_URL);
  console.log("-".repeat(50));

  try {
    const result = await gameService.syncGames();

    const duration = Date.now() - startTime;
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    console.log("-".repeat(50));
    console.log("📊 SYNCHRONIZATION SUMMARY");
    console.log("-".repeat(50));

    if (result.success) {
      console.log("✅ Status: SUCCESS");
      console.log(`📈 Total games processed: ${result.stats.totalProcessed}`);
      console.log(`🆕 New games added: ${result.stats.newGames}`);
      console.log(`🔄 Existing games updated: ${result.stats.updatedGames}`);
      console.log(`❌ Errors encountered: ${result.stats.errors}`);
      console.log(`⏱️  Total duration: ${durationMinutes} minutes`);

      if (result.errors && result.errors.length > 0) {
        console.log("\n⚠️  ERRORS DETAILS:");
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.gameTitle}: ${error.error}`);
        });
      }

      console.log("\n🎉 Game synchronization completed successfully!");
      process.exit(0);
    } else {
      console.log("❌ Status: FAILED");
      console.log(`💥 Error: ${result.message}`);
      console.log(`⏱️  Duration: ${durationMinutes} minutes`);
      process.exit(1);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    console.log("-".repeat(50));
    console.log("💥 SYNCHRONIZATION FAILED");
    console.log("-".repeat(50));
    console.error("❌ Error:", error.message);
    console.log(`⏱️  Duration: ${durationMinutes} minutes`);

    if (error.stack) {
      console.error("\n🔍 Stack trace:");
      console.error(error.stack);
    }

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
