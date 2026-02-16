const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if Cloudinary credentials are configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_KEY.includes('your_cloudinary');

if (!isCloudinaryConfigured) {
  console.warn('\n⚠️  WARNING: Cloudinary credentials not configured!');
  console.warn('Image uploads will not work until you:');
  console.warn('1. Sign up at https://cloudinary.com (free account)');
  console.warn('2. Get your credentials from the dashboard');
  console.warn('3. Update CLOUDINARY_* variables in .env file\n');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for post images
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astronomy-lover/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// Storage configuration for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astronomy-lover/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

// Storage configuration for community cover images
const communityStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astronomy-lover/communities',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

// Storage configuration for shop item images
const shopStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astronomy-lover/shop',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
  },
});

module.exports = {
  cloudinary,
  postStorage,
  profileStorage,
  communityStorage,
  shopStorage,
};
