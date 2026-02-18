require('dotenv').config();
const connectDB = require('../config/db');
const CelestialEvent = require('../models/CelestialEvent');

// Sample celestial events for 2026
const events = [
  {
    name: 'New Moon',
    type: 'Moon Phase',
    description: 'The Moon will be directly between the Earth and Sun and will not be visible from Earth.',
    startDate: new Date('2026-02-20T12:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
  },
  {
    name: 'Venus at Greatest Brightness',
    type: 'Planet Visibility',
    description: 'Venus will reach its greatest brightness in the evening sky, making it easily visible just after sunset.',
    startDate: new Date('2026-02-24T18:00:00Z'),
    visibility: 'Global',
    magnitude: -4.5,
    source: 'NASA',
  },
  {
    name: 'Full Moon',
    type: 'Moon Phase',
    description: 'The Moon will be fully illuminated as seen from Earth.',
    startDate: new Date('2026-03-07T12:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
  },
  {
    name: 'Lyrid Meteor Shower',
    type: 'Meteor Shower',
    description: 'The Lyrids is an average shower, usually producing about 20 meteors per hour at its peak. Best viewing is after midnight.',
    startDate: new Date('2026-04-16T00:00:00Z'),
    endDate: new Date('2026-04-25T23:59:59Z'),
    peakTime: new Date('2026-04-22T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Best viewed from a dark location away from city lights',
      'Look towards the constellation Lyra',
      'Be patient - it may take 20-30 minutes for eyes to adjust',
    ],
    source: 'International Meteor Organization',
  },
  {
    name: 'Eta Aquarid Meteor Shower',
    type: 'Meteor Shower',
    description: 'Debris from Halley\'s Comet. Can produce up to 60 meteors per hour at its peak. Best viewed from the Southern Hemisphere.',
    startDate: new Date('2026-04-19T00:00:00Z'),
    endDate: new Date('2026-05-28T23:59:59Z'),
    peakTime: new Date('2026-05-06T03:00:00Z'),
    visibility: 'Southern Hemisphere',
    tips: [
      'Southern Hemisphere observers will see higher rates',
      'Look towards the constellation Aquarius',
      'Pre-dawn hours offer the best viewing',
    ],
    source: 'International Meteor Organization',
  },
  {
    name: 'Jupiter Opposition',
    type: 'Planet Visibility',
    description: 'Jupiter will be at its closest approach to Earth and fully illuminated. This is the best time to view and photograph Jupiter.',
    startDate: new Date('2026-06-15T20:00:00Z'),
    visibility: 'Global',
    magnitude: -2.7,
    constellation: 'Sagittarius',
    tips: [
      'Visible all night long',
      'Use binoculars to see the four largest moons',
      'Small telescopes can reveal cloud bands',
    ],
    source: 'NASA',
  },
  {
    name: 'Perseid Meteor Shower',
    type: 'Meteor Shower',
    description: 'One of the best meteor showers, producing up to 60 meteors per hour at its peak. Known for its bright meteors.',
    startDate: new Date('2026-07-17T00:00:00Z'),
    endDate: new Date('2026-08-24T23:59:59Z'),
    peakTime: new Date('2026-08-12T22:00:00Z'),
    visibility: 'Northern Hemisphere',
    tips: [
      'Best meteor shower of the year',
      'Look towards the constellation Perseus',
      'Warm summer nights make for comfortable viewing',
    ],
    source: 'International Meteor Organization',
  },
  {
    name: 'Partial Solar Eclipse',
    type: 'Solar Eclipse',
    description: 'A partial solar eclipse will be visible across parts of Europe, Africa, and Asia. Never look directly at the sun without proper eye protection.',
    startDate: new Date('2026-08-12T17:00:00Z'),
    endDate: new Date('2026-08-12T21:00:00Z'),
    visibility: 'Specific Regions',
    visibleRegions: ['Europe', 'Africa', 'Western Asia'],
    tips: [
      'NEVER look directly at the sun without proper eclipse glasses',
      'Use ISO 12312-2 certified eclipse glasses',
      'Or use indirect viewing methods like pinhole projection',
    ],
    source: 'NASA Eclipse Website',
  },
  {
    name: 'Saturn Opposition',
    type: 'Planet Visibility',
    description: 'Saturn will be at its closest approach to Earth and its face will be fully illuminated. Best time to view Saturn\'s rings.',
    startDate: new Date('2026-09-21T22:00:00Z'),
    visibility: 'Global',
    magnitude: 0.2,
    constellation: 'Aquarius',
    tips: [
      'Visible all night long',
      'Small telescopes can reveal the rings',
      'Look for the moon Titan as a bright "star" near Saturn',
    ],
    source: 'NASA',
  },
  {
    name: 'Orionid Meteor Shower',
    type: 'Meteor Shower',
    description: 'Produced by dust from Halley\'s Comet. About 20 meteors per hour at its peak. Fast and bright meteors.',
    startDate: new Date('2026-10-02T00:00:00Z'),
    endDate: new Date('2026-11-07T23:59:59Z'),
    peakTime: new Date('2026-10-21T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Look towards the constellation Orion',
      'Best viewing after midnight',
      'Known for bright meteors with fine trains',
    ],
    source: 'International Meteor Organization',
  },
  {
    name: 'Total Lunar Eclipse',
    type: 'Lunar Eclipse',
    description: 'A total lunar eclipse, also known as a "Blood Moon". The Moon will pass completely through Earth\'s dark shadow.',
    startDate: new Date('2026-11-07T20:00:00Z'),
    endDate: new Date('2026-11-08T02:00:00Z'),
    peakTime: new Date('2026-11-07T23:30:00Z'),
    visibility: 'Northern Hemisphere',
    visibleRegions: ['North America', 'Europe', 'Africa'],
    tips: [
      'Safe to view with naked eye - no special equipment needed',
      'Moon will appear reddish-orange during totality',
      'Great opportunity for photography',
    ],
    source: 'NASA Eclipse Website',
  },
  {
    name: 'Geminid Meteor Shower',
    type: 'Meteor Shower',
    description: 'The king of meteor showers! Can produce up to 120 meteors per hour at its peak. Multi-colored meteors.',
    startDate: new Date('2026-12-07T00:00:00Z'),
    endDate: new Date('2026-12-17T23:59:59Z'),
    peakTime: new Date('2026-12-14T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Best meteor shower of the year for most locations',
      'Look towards the constellation Gemini',
      'Active all night, but best after midnight',
      'Meteors can be yellow, blue, red, or green',
    ],
    source: 'International Meteor Organization',
  },
  {
    name: 'Winter Solstice',
    type: 'Other',
    description: 'The December solstice marks the shortest day in the Northern Hemisphere and longest day in the Southern Hemisphere.',
    startDate: new Date('2026-12-21T14:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
  },
];

const seedEvents = async () => {
  try {
    await connectDB();

    // Clear existing events
    await CelestialEvent.deleteMany({});
    console.log('✓ Cleared existing events');

    // Mark all seeded events as approved
    const approvedEvents = events.map(event => ({
      ...event,
      status: 'approved',
    }));

    // Insert new events
    await CelestialEvent.insertMany(approvedEvents);
    console.log(`✓ Added ${approvedEvents.length} celestial events (all approved)`);

    console.log('\n✨ Events seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
};

seedEvents();
