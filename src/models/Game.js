const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true, // Index for search performance
    },
    thumbnail: {
      type: String,
      required: true,
    },
    backgroundImage: {
      type: String,
      default: null, // Optional background image
    },
    shortDescription: {
      type: String,
      required: true,
      index: "search", // Text index for search
    },
    gameUrl: {
      type: String,
      required: true,
    },
    genre: {
      type: [String],
      required: true,
      index: true, // Index for filtering
    },
    platform: {
      type: [String],
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
    inPlayersFavorites: {
      type: Number,
      default: 0,
    },
    minOS: {
      type: String,
      default: null, // Optional minimum OS requirement
    },
    minMemory: {
      type: String,
      default: null, // Optional minimum memory requirement
    },
    minStorage: {
      type: String,
      default: null, // Optional minimum storage requirement
    },
    minProcessor: {
      type: String,
      default: null, // Optional minimum processor requirement
    },
    minGraphics: {
      type: String,
      default: null, // Optional minimum graphics requirement
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
// Note: Cannot index parallel arrays (genre and platform are both arrays)
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

module.exports = mongoose.model("Game", gameSchema);
