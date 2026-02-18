const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory at:', uploadsDir);
}

console.log('✅ Using LOCAL disk storage for all images\n');

// Local disk storage configuration with custom filenames
const createDiskStorage = (subfolder) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '../uploads', subfolder);
      // Create subfolder if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, basename + '-' + uniqueSuffix + ext);
    }
  });
};

// Storage configurations for different image types
const postStorage = createDiskStorage('posts');
const profileStorage = createDiskStorage('profiles');
const communityStorage = createDiskStorage('communities');
const shopStorage = createDiskStorage('shop');

module.exports = {
  postStorage,
  profileStorage,
  communityStorage,
  shopStorage,
};
