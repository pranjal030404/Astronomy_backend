const CelestialEvent = require('../models/CelestialEvent');

// @desc    Get upcoming celestial events
// @route   GET /api/v1/events/upcoming
// @access  Public
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const events = await CelestialEvent.getUpcoming(parseInt(limit), isAdmin);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get events in date range
// @route   GET /api/v1/events/range
// @access  Public
exports.getEventsInRange = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start and end dates',
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    const isAdmin = req.user?.role === 'admin';
    const events = await CelestialEvent.getInRange(startDate, endDate, isAdmin);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all celestial events
// @route   GET /api/v1/events
// @access  Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const { type, status, upcoming, page = 1, limit = 10 } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const query = {};
    
    if (type) {
      query.type = type;
    }

    // Regular users only see approved events
    if (!isAdmin || !status) {
      query.status = 'approved';
    } else if (status) {
      query.status = status; // Admin can filter by status
    }

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const skip = (page - 1) * limit;

    const events = await CelestialEvent.find(query)
      .populate('createdBy', 'username profilePicture')
      .populate('approvedBy', 'username')
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CelestialEvent.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/v1/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await CelestialEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/v1/events
// @access  Private (authenticated users)
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user.id,
    };

    // Admins can create approved events directly
    if (req.user.role === 'admin') {
      eventData.status = 'approved';
      eventData.approvedBy = req.user.id;
      eventData.approvedAt = new Date();
    } else {
      // Regular users create pending events
      eventData.status = 'pending';
    }

    const event = await CelestialEvent.create(eventData);

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Event created and approved' 
        : 'Event submitted for approval',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Private (Admin only)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await CelestialEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Private (Admin only)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await CelestialEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve event
// @route   PUT /api/v1/events/:id/approve
// @access  Private (Admin only)
exports.approveEvent = async (req, res, next) => {
  try {
    const event = await CelestialEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Event is already approved',
      });
    }

    event.status = 'approved';
    event.approvedBy = req.user.id;
    event.approvedAt = new Date();
    await event.save();

    // Populate creator info
    await event.populate('createdBy', 'username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Event approved successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject event
// @route   PUT /api/v1/events/:id/reject
// @access  Private (Admin only)
exports.rejectEvent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const event = await CelestialEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    event.status = 'rejected';
    event.rejectionReason = reason || 'No reason provided';
    event.approvedBy = req.user.id;
    event.approvedAt = new Date();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event rejected',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending events
// @route   GET /api/v1/events/pending
// @access  Private (Admin only)
exports.getPendingEvents = async (req, res, next) => {
  try {
    const events = await CelestialEvent.find({ status: 'pending' })
      .populate('createdBy', 'username profilePicture email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};
