const mongoose = require("mongoose");
const User = require("../src/models/User");
require("dotenv").config();

async function updateUserFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updateFields = {};

      // Check if username is missing
      if (!user.username) {
        // Generate a username from name or email
        const nameBasedUsername = user.name
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");

        // Add a random number to make it unique
        const randomSuffix = Math.floor(Math.random() * 1000);
        updateFields.username = `${nameBasedUsername}${randomSuffix}`;
        needsUpdate = true;
        console.log(
          `Will add username: ${updateFields.username} for user: ${user.name}`
        );
      }

      // Check if email is missing (though it should be required)
      if (!user.email) {
        // This shouldn't happen since email is required, but just in case
        console.log(`Warning: User ${user._id} is missing email field`);
      }

      // Update the user if needed
      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updateFields);
        updatedCount++;
        console.log(`Updated user: ${user.name} (${user._id})`);
      }
    }

    console.log(`\nMigration complete! Updated ${updatedCount} users.`);

    // Verify the updates
    const usersAfterUpdate = await User.find({});
    const missingUsername = usersAfterUpdate.filter((u) => !u.username);
    const missingEmail = usersAfterUpdate.filter((u) => !u.email);

    console.log(`\nVerification:`);
    console.log(`Users missing username: ${missingUsername.length}`);
    console.log(`Users missing email: ${missingEmail.length}`);

    if (missingUsername.length > 0) {
      console.log(
        "Users still missing username:",
        missingUsername.map((u) => u._id)
      );
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
updateUserFields();
