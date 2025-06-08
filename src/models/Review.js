const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one review per game
reviewSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// Populate user and game data when fetching reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "userId",
    select: "name avatar",
  });
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
