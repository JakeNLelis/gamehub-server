const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer (avatars)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gamehub/avatars", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" }, // Square crop focused on face
      { quality: "auto", fetch_format: "auto" }, // Optimize quality and format
    ],
    public_id: (req, file) => {
      // Generate unique filename
      return `avatar-${req.user.id}-${Date.now()}`;
    },
  },
});

// Configure Cloudinary storage for game thumbnails
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gamehub/thumbnails", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 800, height: 600, crop: "fill" }, // Game thumbnail dimensions
      { quality: "auto", fetch_format: "auto" }, // Optimize quality and format
    ],
    public_id: (req, file) => {
      // Generate unique filename for game thumbnail
      return `thumbnail-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    },
  },
});

// Configure Cloudinary storage for game background images
const backgroundStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gamehub/backgrounds", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "fill" }, // Background image dimensions
      { quality: "auto", fetch_format: "auto" }, // Optimize quality and format
    ],
    public_id: (req, file) => {
      // Generate unique filename for game background
      return `background-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    },
  },
});

// Configure multer with Cloudinary storage (for avatars)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Configure multer for game thumbnails
const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for game thumbnails
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload,
  thumbnailUpload,
};
