const mongoose = require('mongoose');

const CelestialEventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an event name'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Meteor Shower',
      'Lunar Eclipse',
      'Solar Eclipse',
      'Planetary Conjunction',
      'Transit',
      'Occultation',
      'Comet',
      'Moon Phase',
      'Planet Visibility',
      'ISS Pass',
      'Satellite',
      'Other',
    ],
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
  },
  peakTime: {
    type: Date,
  },
  visibility: {
    type: String,
    enum: ['Global', 'Northern Hemisphere', 'Southern Hemisphere', 'Specific Regions'],
    default: 'Global',
  },
  visibleRegions: [String],
  magnitude: Number, // Brightness (lower is brighter)
  constellation: String,
  coordinates: {
    ra: String,
    dec: String,
  },
  tips: [String],
  imageUrl: String,
  source: {
    type: String,
    default: 'NASA',
  },
  externalLink: String,
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
CelestialEventSchema.index({ startDate: 1 });
CelestialEventSchema.index({ type: 1 });
CelestialEventSchema.index({ startDate: 1, endDate: 1 });

// Static method to get upcoming events
CelestialEventSchema.statics.getUpcoming = function(limit = 10) {
  return this.find({
    startDate: { $gte: new Date() },
  })
    .sort({ startDate: 1 })
    .limit(limit);
};

// Static method to get events in date range
CelestialEventSchema.statics.getInRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate },
      },
    ],
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('CelestialEvent', CelestialEventSchema);
