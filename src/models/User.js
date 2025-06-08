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
    avatar: {
      type: String,
      default: null, // Local file path to uploaded avatar image
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Virtual for avatar URL
userSchema.virtual("avatarUrl").get(function () {
  if (this.avatar) {
    const baseUrl = process.env.SERVER_BASE_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/avatars/${this.avatar}`;
  }
  return null;
});

// Include virtuals when converting to JSON
userSchema.set("toJSON", { virtuals: true });

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
