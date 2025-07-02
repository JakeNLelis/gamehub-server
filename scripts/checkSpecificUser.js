const mongoose = require("mongoose");
const User = require("../src/models/User");
require("dotenv").config();

async function checkSpecificUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check the specific user from the review
    const userId = "6864c92aba705b30b0f75095";
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Raw user from database:");
    console.log(JSON.stringify(user.toObject(), null, 2));

    console.log("\nUser fields present:", Object.keys(user.toObject()));

    // Check specifically for username and email
    console.log("\nField checks:");
    console.log("Has username:", !!user.username, user.username);
    console.log("Has email:", !!user.email, user.email);

    // If missing fields, let's update this user
    if (!user.username || !user.email) {
      console.log("\nUpdating user with missing fields...");

      const updates = {};

      if (!user.username) {
        // Generate username from name
        const nameBasedUsername = user.name
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");
        updates.username = `${nameBasedUsername}${Date.now()}`;
        console.log("Adding username:", updates.username);
      }

      if (!user.email) {
        // This is problematic since email should be required
        // Let's add a placeholder or extract from Google ID
        updates.email = `user${user.googleId}@placeholder.com`;
        console.log("Adding placeholder email:", updates.email);
      }

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: false } // Skip validation temporarily
      );

      console.log("\nUpdated user:");
      console.log(JSON.stringify(updatedUser.toObject(), null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the check
checkSpecificUser();
