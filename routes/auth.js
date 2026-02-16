const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateDetails,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later',
});

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Public routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh-token', refreshToken);

// Private routes (require authentication)
router.use(protect); // Apply protect middleware to all routes below

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/update-details', updateDetails);
router.put('/update-password', updatePassword);

module.exports = router;
