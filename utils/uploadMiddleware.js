const multer = require('multer');
const { postStorage, profileStorage, communityStorage, shopStorage } = require('../config/cloudinary');

// File filter for images only
const imageFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Upload middleware for post images (multiple files)
exports.uploadPostImages = multer({
  storage: postStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 10, // Maximum 10 images per post
  },
}).array('images', 10);

// Upload middleware for profile picture (single file)
exports.uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('profilePicture');

// Upload middleware for community cover image (single file)
exports.uploadCommunityCover = multer({
  storage: communityStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('coverImage');

// Upload middleware for shop item images (single file)
exports.uploadShopImage = multer({
  storage: shopStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('image');

// Error handler for multer errors
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Maximum size is 10MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 images per post.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload.',
      });
    }
  }
  
  if (err) {
    console.error('Upload Error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file.',
    });
  }
  
  next();
};
