const { body } = require("express-validator");

// Review validation rules
const validateReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5"),

  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Review content must be between 1 and 1000 characters"),
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`,
      });
    }
    next();
  };
};

module.exports = {
  validateReview,
  validateObjectId,
};
