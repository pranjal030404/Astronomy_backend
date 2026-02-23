const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
