const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    externalId: {
      type: Number,
      required: true,
      unique: true, // Unique external ID from FreeToGame API
    },
    title: {
      type: String,
      required: true,
      index: true, // Index for search performance
    },
    thumbnail: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
      index: "text", // Text index for search
    },
    gameUrl: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      required: true,
      index: true, // Index for filtering
    },
    platform: {
      type: String,
      required: true,
      index: true, // Index for filtering
    },
    publisher: {
      type: String,
      required: true,
    },
    developer: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    freetogameProfileUrl: {
      type: String,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Compound indexes for better query performance
gameSchema.index({ genre: 1, platform: 1 });
gameSchema.index({ averageRating: -1, totalReviews: -1 });
gameSchema.index({ releaseDate: -1 });
gameSchema.index({ title: "text", shortDescription: "text" });

// Virtual for formatted release date
gameSchema.virtual("formattedReleaseDate").get(function () {
  return this.releaseDate.toLocaleDateString();
});

// Virtual for rating summary
gameSchema.virtual("ratingSummary").get(function () {
  return {
    average: this.averageRating,
    total: this.totalReviews,
    stars: Math.round(this.averageRating),
  };
});

// Include virtuals when converting to JSON
gameSchema.set("toJSON", { virtuals: true });

// Remove sensitive/unnecessary fields when converting to JSON
gameSchema.methods.toJSON = function () {
  const game = this.toObject();
  delete game.__v;
  return game;
};

// Static method to update game rating
gameSchema.statics.updateRating = async function (
  gameId,
  newAverageRating,
  newTotalReviews
) {
  return this.findByIdAndUpdate(
    gameId,
    {
      averageRating: newAverageRating,
      totalReviews: newTotalReviews,
    },
    { new: true }
  );
};

// Static method to find games by external IDs
gameSchema.statics.findByExternalIds = function (externalIds) {
  return this.find({ externalId: { $in: externalIds } });
};

module.exports = mongoose.model("Game", gameSchema);
