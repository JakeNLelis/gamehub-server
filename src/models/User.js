const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: null, // Optional username for user
      unique: true, // Ensure usernames are unique if provided
      sparse: true, // Allows null values to coexist with unique usernames
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"], // Define roles
      default: "user", // Default role is user
    },
    avatar: {
      type: String,
      default: null, // Cloudinary URL or Google profile photo URL
    },
    avatarPublicId: {
      type: String,
      default: null, // Cloudinary public_id for deletion (only for uploaded avatars)
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Virtual field for backward compatibility
userSchema.virtual("avatarUrl").get(function () {
  return this.avatar;
});

// Ensure virtual fields are included in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
