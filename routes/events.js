const express = require('express');
const router = express.Router();
const {
  getUpcomingEvents,
  getEventsInRange,
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getPendingEvents,
} = require('../controllers/eventsController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Admin only routes (must be before /:id routes)
router.get('/admin/pending', protect, authorize('admin'), getPendingEvents);
router.put('/:id/approve', protect, authorize('admin'), approveEvent);
router.put('/:id/reject', protect, authorize('admin'), rejectEvent);

// Public routes (with optional auth to check admin status)
router.get('/upcoming', optionalAuth, getUpcomingEvents);
router.get('/range', optionalAuth, getEventsInRange);
router.get('/', optionalAuth, getAllEvents);
router.get('/:id', getEvent);

// Protected routes - Any authenticated user can create
router.post('/', protect, createEvent);

// Admin only routes for update/delete
router.put('/:id', protect, authorize('admin'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;
