const cron = require("node-cron");
const gameService = require("./gameService");

class CronService {
  constructor() {
    this.tasks = [];
    this.isInitialized = false;
  }

  // Initialize all cron jobs
  init() {
    if (this.isInitialized) {
      console.log("⚠️  Cron service already initialized");
      return;
    }

    console.log("⏰ Initializing cron service...");

    // Weekly game synchronization (every Sunday at 3:00 AM)
    this.scheduleGameSync();

    this.isInitialized = true;
    console.log("✅ Cron service initialized successfully");
  }

  // Schedule weekly game synchronization
  scheduleGameSync() {
    // Cron pattern: second minute hour day month dayOfWeek
    // "0 0 3 * * 0" = Every Sunday at 3:00 AM
    const gameSync = cron.schedule(
      "0 0 3 * * 0",
      async () => {
        console.log("🔄 Scheduled game synchronization started");
        console.log("⏰ Time:", new Date().toISOString());

        try {
          const result = await gameService.syncGames();

          if (result.success) {
            console.log("✅ Scheduled game sync completed successfully");
            console.log(`📊 Stats: ${JSON.stringify(result.stats)}`);
          } else {
            console.error("❌ Scheduled game sync failed:", result.message);
          }
        } catch (error) {
          console.error("💥 Scheduled game sync error:", error.message);
        }
      },
      {
        scheduled: false, // Don't start immediately
        timezone: "UTC", // Use UTC timezone
      }
    );

    this.tasks.push({
      name: "gameSync",
      task: gameSync,
      schedule: "0 0 3 * * 0",
      description: "Weekly game synchronization",
    });

    // Start the task if not in test environment
    if (process.env.NODE_ENV !== "test") {
      gameSync.start();
      console.log("⏰ Game sync scheduled: Every Sunday at 3:00 AM UTC");
    } else {
      console.log("🧪 Test environment: Game sync not scheduled");
    }
  }

  // Manual trigger for testing (development only)
  scheduleTestSync() {
    if (process.env.NODE_ENV === "production") {
      console.log("⚠️  Test sync not available in production");
      return;
    }

    // Every minute for testing (use carefully!)
    const testSync = cron.schedule(
      "0 * * * * *",
      async () => {
        console.log("🧪 Test game synchronization triggered");

        try {
          const result = await gameService.syncGames();

          if (result.success) {
            console.log("✅ Test sync completed");
          } else {
            console.error("❌ Test sync failed:", result.message);
          }
        } catch (error) {
          console.error("💥 Test sync error:", error.message);
        }
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    this.tasks.push({
      name: "testSync",
      task: testSync,
      schedule: "0 * * * * *",
      description: "Test synchronization (every minute)",
    });

    console.log("🧪 Test sync scheduled: Every minute");
    return testSync;
  }

  // Get all scheduled tasks info
  getTasks() {
    return this.tasks.map(({ name, schedule, description }) => ({
      name,
      schedule,
      description,
      isRunning: this.tasks.find((t) => t.name === name)?.task.running || false,
    }));
  }

  // Start all tasks
  startAll() {
    this.tasks.forEach(({ name, task }) => {
      if (!task.running) {
        task.start();
        console.log(`▶️  Started cron task: ${name}`);
      }
    });
  }

  // Stop all tasks
  stopAll() {
    this.tasks.forEach(({ name, task }) => {
      if (task.running) {
        task.stop();
        console.log(`⏸️  Stopped cron task: ${name}`);
      }
    });
  }

  // Destroy all tasks
  destroy() {
    this.tasks.forEach(({ name, task }) => {
      task.destroy();
      console.log(`💥 Destroyed cron task: ${name}`);
    });

    this.tasks = [];
    this.isInitialized = false;
    console.log("🗑️  Cron service destroyed");
  }

  // Get task by name
  getTask(name) {
    return this.tasks.find((t) => t.name === name);
  }

  // Start specific task
  startTask(name) {
    const taskInfo = this.getTask(name);
    if (taskInfo && !taskInfo.task.running) {
      taskInfo.task.start();
      console.log(`▶️  Started cron task: ${name}`);
      return true;
    }
    return false;
  }

  // Stop specific task
  stopTask(name) {
    const taskInfo = this.getTask(name);
    if (taskInfo && taskInfo.task.running) {
      taskInfo.task.stop();
      console.log(`⏸️  Stopped cron task: ${name}`);
      return true;
    }
    return false;
  }

  // Trigger manual sync (bypasses schedule)
  async triggerManualSync() {
    console.log("🔄 Manual game sync triggered via cron service");

    try {
      const result = await gameService.syncGames();

      if (result.success) {
        console.log("✅ Manual sync completed successfully");
        return {
          success: true,
          message: "Manual synchronization completed",
          stats: result.stats,
        };
      } else {
        console.error("❌ Manual sync failed:", result.message);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error("💥 Manual sync error:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

// Create singleton instance
const cronService = new CronService();

module.exports = cronService;
