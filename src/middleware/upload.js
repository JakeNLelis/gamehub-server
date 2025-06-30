const multer = require("multer");
const { upload } = require("../config/cloudinary");

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Only one file is allowed.",
      });
    }
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({
      success: false,
      error: "Invalid file type. Only image files are allowed.",
    });
  }

  // Generic error
  return res.status(400).json({
    success: false,
    error: error.message || "File upload failed",
  });
};

module.exports = {
  avatarUpload: upload.single("avatar"),
  handleMulterError,
};
