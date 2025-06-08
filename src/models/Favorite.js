const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use addedAt instead
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to provide createdAt field for compatibility
favoriteSchema.virtual("createdAt").get(function () {
  return this.addedAt;
});

// Ensure a user can't add the same game to favorites twice
favoriteSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// Populate game data when fetching favorites
favoriteSchema.pre(/^find/, function (next) {
  this.populate({
    path: "gameId",
    select: "title thumbnail genre platform averageRating totalReviews",
  });
  next();
});

module.exports = mongoose.model("Favorite", favoriteSchema);
