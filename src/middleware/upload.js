const multer = require("multer");
const path = require("path");
const { FILE_UPLOAD } = require("../utils/constants");

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use temp directory, we'll move files manually for better control
    cb(null, path.join(__dirname, "../../uploads/temp"));
  },
  filename: function (req, file, cb) {
    // Generate temporary filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "temp-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for avatars
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }

  // Check file extension
  const allowedExtensions = FILE_UPLOAD.AVATAR.ALLOWED_EXTENSIONS;
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return cb(
      new Error(`Only ${allowedExtensions.join(", ")} files are allowed`),
      false
    );
  }

  cb(null, true);
};

// Avatar upload configuration
const avatarUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.AVATAR.MAX_SIZE, // 5MB
    files: 1, // Only one file at a time
  },
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: "File too large",
          message: `Avatar must be smaller than ${
            FILE_UPLOAD.AVATAR.MAX_SIZE / (1024 * 1024)
          }MB`,
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          error: "Too many files",
          message: "Only one avatar file is allowed",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected file",
          message: "Unexpected file field in request",
        });
      default:
        return res.status(400).json({
          error: "Upload error",
          message: error.message,
        });
    }
  }

  if (
    error.message.includes("Only image files are allowed") ||
    error.message.includes("files are allowed")
  ) {
    return res.status(400).json({
      error: "Invalid file type",
      message: error.message,
    });
  }

  next(error);
};

module.exports = {
  avatarUpload,
  handleMulterError,
};
