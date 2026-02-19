/**
 * Full Database Seeder
 * Usage:
 *   node seeder          – seed everything (skips if data already exists)
 *   node seeder --fresh  – wipe all data then seed from scratch
 *   node seeder --destroy – wipe all data and exit
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Community = require('./models/Community');
const ShopItem = require('./models/ShopItem');
const CelestialEvent = require('./models/CelestialEvent');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg) => console.log(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ⚠  ${msg}`);

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  ok('MongoDB connected');
}

async function destroyAll() {
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Community.deleteMany({}),
    ShopItem.deleteMany({}),
    CelestialEvent.deleteMany({}),
  ]);
  ok('All collections cleared');
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const USERS = [
  {
    username: 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@astronomylover.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
    bio: 'Super Administrator of Astronomy Lover platform',
    location: 'Earth 🌍',
    astronomyInterests: ['Deep Sky', 'Astrophotography', 'Galaxies', 'Nebulae'],
    isVerified: true,
  },
  {
    username: 'stargazer_priya',
    email: 'priya@example.com',
    password: 'Password@123',
    bio: 'Amateur astronomer from Mumbai. Passionate about lunar photography.',
    location: 'Mumbai, India',
    astronomyInterests: ['Moon', 'Planetary', 'Astrophotography'],
    equipment: {
      telescope: 'Celestron NexStar 8SE',
      camera: 'Canon EOS Ra',
      mount: 'Celestron AVX',
    },
    isVerified: true,
  },
  {
    username: 'cosmic_raj',
    email: 'raj@example.com',
    password: 'Password@123',
    bio: 'Deep sky enthusiast. Hunting galaxies one Messier object at a time.',
    location: 'Pune, India',
    astronomyInterests: ['Deep Sky', 'Galaxies', 'Nebulae'],
    equipment: {
      telescope: 'Sky-Watcher 10" Dobsonian',
      camera: 'ZWO ASI294MC Pro',
      mount: 'Sky-Watcher EQ6-R Pro',
    },
    isVerified: true,
  },
  {
    username: 'nebula_nina',
    email: 'nina@example.com',
    password: 'Password@123',
    bio: 'Astrophotographer specialising in emission nebulae. Halpha is life.',
    location: 'Bangalore, India',
    astronomyInterests: ['Nebulae', 'Astrophotography', 'Deep Sky'],
    equipment: {
      telescope: 'William Optics Redcat 51',
      camera: 'ZWO ASI2600MM Pro',
      mount: 'iOptron CEM40',
    },
    isVerified: true,
  },
  {
    username: 'planet_prakash',
    email: 'prakash@example.com',
    password: 'Password@123',
    bio: 'Planetary imaging geek. My Saturn shots will make you believe in aliens.',
    location: 'Delhi, India',
    astronomyInterests: ['Planetary', 'Solar System', 'Moon'],
    equipment: {
      telescope: 'Celestron C9.25 SCT',
      camera: 'ZWO ASI462MM',
      mount: 'Losmandy G-11',
    },
    isVerified: false,
  },
  {
    username: 'milkyway_meena',
    email: 'meena@example.com',
    password: 'Password@123',
    bio: 'Wide-field Milky Way and star trail photographer. Nature + Cosmos = 🤍',
    location: 'Jaipur, India',
    astronomyInterests: ['Milky Way', 'Star Trails', 'Astrophotography'],
    equipment: {
      telescope: 'Sigma 14mm f/1.8 Art',
      camera: 'Nikon Z6 II',
      mount: 'Sky-Watcher Star Adventurer 2i',
    },
    isVerified: true,
  },
  {
    username: 'comet_chaser_dev',
    email: 'dev@example.com',
    password: 'Password@123',
    bio: 'Chasing comets and transient phenomena. Always looking up.',
    location: 'Chennai, India',
    astronomyInterests: ['Comets', 'Meteor Showers', 'Eclipses'],
    isVerified: false,
  },
];

const COMMUNITY_TEMPLATES = [
  {
    name: 'Deep Sky Explorers',
    description: 'A community for deep sky observers and imagers. Share your galaxies, nebulae, and clusters. All skill levels welcome!',
    category: 'Deep Sky Objects',
    tags: ['galaxies', 'nebulae', 'clusters', 'dso'],
    rules: [
      { title: 'Be Respectful', description: 'Treat all members with respect regardless of their experience level.' },
      { title: 'Include Capture Details', description: 'When sharing images, try to include equipment and exposure details.' },
      { title: 'No Spam', description: 'Keep posts relevant to deep sky astronomy.' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1200&h=400&fit=crop',
  },
  {
    name: 'Planetary Imagers',
    description: 'Dedicated to planetary imaging — Jupiter, Saturn, Mars, Venus and beyond. Share your best planetary captures.',
    category: 'Planetary Imaging',
    tags: ['planets', 'solar system', 'lucky imaging'],
    rules: [
      { title: 'Share Processing Details', description: 'Mention the software and techniques used to process your planetary images.' },
      { title: 'Constructive Feedback', description: 'Offer constructive and positive feedback on others\' images.' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200&h=400&fit=crop',
  },
  {
    name: 'Astrophotography Beginners',
    description: 'New to astrophotography? This is the place for you! Ask questions, share your first light images, and learn together.',
    category: 'Beginners',
    tags: ['beginner', 'first light', 'learning'],
    rules: [
      { title: 'No Question is Dumb', description: 'Every question is welcome. We were all beginners once.' },
      { title: 'Be Encouraging', description: 'Encourage and support beginners even if the result isn\'t perfect.' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1200&h=400&fit=crop',
  },
  {
    name: 'Milky Way & Wide Field',
    description: 'For lovers of wide-field night sky photography — Milky Way arches, star trails, and landscape astrophotography.',
    category: 'Wide Field',
    tags: ['milky way', 'star trails', 'wide field', 'landscape'],
    rules: [
      { title: 'Include Location', description: 'Share the general location where the shot was taken.' },
      { title: 'Originals Only', description: 'Only post your own original images.' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=400&fit=crop',
  },
  {
    name: 'Equipment & Gear Talk',
    description: 'Discuss telescopes, mounts, cameras, accessories, and any astronomy equipment. Reviews, comparisons, and buying advice.',
    category: 'Equipment & Gear',
    tags: ['telescopes', 'cameras', 'mounts', 'gear', 'reviews'],
    rules: [
      { title: 'No Affiliate Spam', description: 'Do not post unsolicited affiliate links.' },
      { title: 'Honest Reviews', description: 'Share honest opinions based on your own experience.' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
  },
];

const POST_TEMPLATES = [
  {
    content: '🌌 Just captured the Andromeda Galaxy (M31) from my rooftop last night! \n\nThis is possibly the most distant object visible to the naked eye — 2.5 million light years away! Used my 8SE with the ZWO ASI294 for 3 hours of integration. Still amazed that light from this galaxy left before our ancestors walked the Earth. \n\n#DeepSky #Andromeda #M31 #Astrophotography',
    tags: ['deep sky', 'andromeda', 'm31', 'astrophotography'],
    astronomyData: {
      objectName: 'Andromeda Galaxy (M31)',
      objectType: 'Galaxy',
      captureDate: new Date('2026-01-15'),
      location: 'Mumbai, India',
      equipment: { telescope: 'Celestron NexStar 8SE', camera: 'ZWO ASI294MC Pro', filters: 'None' },
      shootingDetails: { iso: 3200, exposure: '180s', frames: 60, totalIntegration: '3 hours' },
    },
  },
  {
    content: '🪐 Saturn is putting on a beautiful show right now! Look southeast after 10 PM. \n\nThe rings are incredibly tilted this season giving us an amazing view. If you have any telescope — even a small one — now is the perfect time to point it at the ringed giant. I spotted 4 moons tonight: Titan, Rhea, Dione, and Tethys! \n\n#Saturn #Planets #Observe #SolarSystem',
    tags: ['saturn', 'planets', 'solar system', 'observe'],
    astronomyData: {
      objectName: 'Saturn',
      objectType: 'Planet',
      captureDate: new Date('2026-02-01'),
      location: 'Delhi, India',
      equipment: { telescope: 'Celestron C9.25 SCT', camera: 'ZWO ASI462MM' },
      shootingDetails: { exposure: '5ms', frames: 10000 },
    },
  },
  {
    content: 'Orion Nebula (M42) — the most iconic object in the winter sky! 🌟\n\nThis is a stellar nursery 1,344 light years from Earth. The four bright central stars form the Trapezium cluster, one of the youngest and most massive open clusters known. Took me 2 months to get the core exposed just right without blowing it out.\n\n#OrionNebula #M42 #Nebula #WinterSky',
    tags: ['orion nebula', 'm42', 'nebula', 'winter sky'],
    astronomyData: {
      objectName: 'Orion Nebula (M42)',
      objectType: 'Nebula',
      captureDate: new Date('2025-12-20'),
      location: 'Pune, India',
      equipment: { telescope: 'Sky-Watcher 10" Dobsonian', camera: 'ZWO ASI294MC Pro' },
      shootingDetails: { exposure: '120s', frames: 45, totalIntegration: '1.5 hours' },
    },
  },
  {
    content: 'The Horsehead Nebula (IC 434) in narrowband H-alpha! 🐴\n\nThis iconic dark nebula sits in the constellation Orion. The horse-head shape is formed by a dense cloud of gas and dust blocking the glowing H-alpha emission behind it. This was a 6-panel mosaic taken over 3 nights — the result I\'ve been dreaming of for 2 years!\n\n#Horsehead #IC434 #Narrowband #Halpha #Nebula',
    tags: ['horsehead', 'ic434', 'narrowband', 'halpha'],
    astronomyData: {
      objectName: 'Horsehead Nebula (IC 434)',
      objectType: 'Nebula',
      captureDate: new Date('2026-01-28'),
      location: 'Bangalore, India',
      equipment: { telescope: 'William Optics Redcat 51', camera: 'ZWO ASI2600MM Pro', filters: 'Chroma H-alpha 3nm' },
      shootingDetails: { exposure: '300s', frames: 80, totalIntegration: '6.6 hours' },
    },
  },
  {
    content: 'Milky Way arch over the Thar Desert last weekend 🏜️✨\n\nDrove 200km from Jaipur to get this shot under Bortle 2 skies. The transparency was insane — I could see the galactic centre with my naked eye for the first time. Sometimes you just have to chase the darkness.\n\nCamera: Nikon Z6 II | Lens: Sigma 14mm f/1.8 | 20s, ISO 6400, f/1.8\n\n#MilkyWay #NightPhotography #TharDesert #LandscapeAstro',
    tags: ['milky way', 'night photography', 'thar desert', 'landscape'],
    astronomyData: {
      objectName: 'Milky Way Galactic Core',
      objectType: 'Other',
      captureDate: new Date('2026-02-10'),
      location: 'Thar Desert, Rajasthan, India',
      equipment: { telescope: 'Sigma 14mm f/1.8 Art', camera: 'Nikon Z6 II', mount: 'Tripod' },
      shootingDetails: { iso: 6400, exposure: '20s', aperture: 'f/1.8', frames: 1 },
    },
  },
  {
    content: 'Hey everyone! 👋 Just got my first telescope — a Sky-Watcher 8" Dobsonian. First light last night on the Moon!\n\nI honestly cried a little seeing craters for the first time with my own eyes. This hobby is truly something else. Any tips for a complete beginner on what to look at next?',
    tags: ['beginner', 'first light', 'moon', 'dobsonian'],
    astronomyData: {
      objectName: 'Moon',
      objectType: 'Moon',
      captureDate: new Date('2026-02-14'),
      location: 'Hyderabad, India',
    },
  },
  {
    content: '☀️ Solar prominence captured today with my H-alpha solar telescope!\n\nThat arc of plasma is larger than Earth, and it\'s just... hanging there. Solar astronomy is criminally underrated. The sun changes every day and every image is unique. Do NOT stare at the sun with any regular telescope — please use proper solar filters or a dedicated solar scope!\n\n#SolarAstronomy #Prominence #Sun #Halpha #SafeSolar',
    tags: ['solar', 'sun', 'prominence', 'halpha', 'safe solar'],
    astronomyData: {
      objectName: 'Sun (Solar Prominence)',
      objectType: 'Star',
      captureDate: new Date('2026-02-16'),
      location: 'Kolkata, India',
      equipment: { telescope: 'Lunt LS60THa', camera: 'ZWO ASI178MM' },
    },
  },
  {
    content: 'Full Moon rising over the Taj Mahal last night 🌕\n\nHad to wait 3 months for the alignment where the full moon rises exactly behind the Taj. Shot from 2.3km away using a 600mm telephoto. The planning that goes into lunar landscape shots is half the fun!\n\nCamera: Sony A7IV | 600mm f/8 | 1/500s, ISO 800\n\n#MoonriseTaj #LunarPhotography #FullMoon #TajMahal',
    tags: ['moon', 'lunar photography', 'full moon', 'moonrise'],
    astronomyData: {
      objectName: 'Full Moon',
      objectType: 'Moon',
      captureDate: new Date('2026-02-12'),
      location: 'Agra, India',
    },
  },
];

const COMMENT_TEMPLATES = [
  'Absolutely stunning capture! The detail is incredible.',
  'What processing software did you use for this? The star colours are beautiful.',
  'This is goals! I\'ve been trying to image this object for months.',
  'The Bortle rating in your area must be really good. Jealous!',
  'Love the framing on this. How many hours of data went into it?',
  'That equipment list is serious! How long did you save up for the ASI?',
  'Welcome to the hobby! The Moon is the perfect first target. Try Jupiter next!',
  'Unbelievable sharpness on the planet. What\'s your seeing like there?',
  'The Milky Way core is so vivid. What sky darkness meter reading did you get?',
  'Can you share the full resolution version? Want to use it as my desktop bg!',
  'This is why I got into astronomy. Pure magic.',
  'How do you deal with light pollution? I\'m in central Mumbai and it\'s rough.',
  'First light on a new scope is always emotional. The hobby never gets old!',
  'That processing is next level. Would love a tutorial from you.',
  'H-alpha makes everything look epic. What integration time did you achieve?',
];

const SHOP_ITEMS = [
  {
    name: 'Celestron NexStar 8SE Telescope',
    description: 'The Celestron NexStar 8SE is a classic choice for both visual observing and astrophotography. 8" aperture with Schmidt-Cassegrain optics. Includes fully computerised GoTo mount.',
    price: 85000,
    category: 'telescopes',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
    inStock: true,
    stock: 5,
    rating: 4.7,
    reviews: 128,
    featured: true,
  },
  {
    name: 'Sky-Watcher 10" Dobsonian',
    description: 'A large-aperture visual telescope perfect for deep sky observation. Easy to set up and use, the Dobsonian design gives you maximum aperture for your money.',
    price: 32000,
    category: 'telescopes',
    image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&h=400&fit=crop',
    inStock: true,
    stock: 8,
    rating: 4.5,
    reviews: 94,
    featured: false,
  },
  {
    name: 'ZWO ASI294MC Pro Cooled Camera',
    description: 'One of the most popular colour dedicated astrophotography cameras. Large 4/3 inch sensor, active cooling to -35°C below ambient, and 14-bit ADC for exceptional dynamic range.',
    price: 55000,
    category: 'cameras',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop',
    inStock: true,
    stock: 3,
    rating: 4.8,
    reviews: 216,
    featured: true,
  },
  {
    name: 'Sky-Watcher EQ6-R Pro Mount',
    description: 'The EQ6-R Pro is a professional-grade equatorial mount for serious astrophotography. 20kg payload capacity, built-in polar scope, and SynScan WiFi for wireless control.',
    price: 120000,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1435224668334-0f82ec57b605?w=600&h=400&fit=crop',
    inStock: true,
    stock: 4,
    rating: 4.6,
    reviews: 87,
    featured: true,
  },
  {
    name: 'Optolong L-eNhance Dual Narrowband Filter',
    description: 'A dual-bandpass narrowband filter that passes H-alpha and OIII emission lines. Perfect for light-polluted skies. Fits standard 2" filter drawers and M48 accessories.',
    price: 12500,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop',
    inStock: true,
    stock: 15,
    rating: 4.4,
    reviews: 52,
    featured: false,
  },
  {
    name: 'PixInsight Software License',
    description: 'The industry-standard image processing software for astrophotography. Includes perpetual license with one year of updates. Runs on Windows, macOS, and Linux.',
    price: 19000,
    category: 'software',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
    inStock: true,
    stock: 999,
    rating: 4.9,
    reviews: 345,
    featured: true,
  },
  {
    name: 'Turn Left at Orion (5th Edition)',
    description: 'The best-selling guide for beginner and intermediate amateur astronomers. Over 300 deep-sky objects with star charts and descriptions. Essential reading for any stargazer.',
    price: 1800,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
    inStock: true,
    stock: 42,
    rating: 4.8,
    reviews: 189,
    featured: false,
  },
  {
    name: 'Baader Planetarium Zoom Eyepiece 8-24mm',
    description: 'A high-quality variable zoom eyepiece offering a continuous focal length range from 8mm to 24mm. Eliminates the need to carry multiple eyepieces.',
    price: 8500,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=400&fit=crop',
    inStock: true,
    stock: 12,
    rating: 4.3,
    reviews: 63,
    featured: false,
  },
  {
    name: 'Pegasus Astro Pocket Power Box',
    description: 'A smart power distribution hub for your telescope setup. Controls dew heaters, provides regulated USB power, reads temperature/humidity, and integrates with NINA and ASIAIR.',
    price: 28000,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    inStock: false,
    stock: 0,
    rating: 4.7,
    reviews: 41,
    featured: false,
  },
  {
    name: 'William Optics RedCat 51 APO Refractor',
    description: 'A compact, lightweight 250mm f/4.9 astrograph with built-in field flattener. Designed specifically for astrophotography with a range of astro cameras.',
    price: 68000,
    category: 'telescopes',
    image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&h=400&fit=crop',
    inStock: true,
    stock: 2,
    rating: 4.9,
    reviews: 74,
    featured: true,
  },
];

const CELESTIAL_EVENTS = [
  {
    name: 'New Moon',
    type: 'Moon Phase',
    description: 'The Moon will be directly between the Earth and Sun and will not be visible from Earth. This is the best time of the month for deep sky observation.',
    startDate: new Date('2026-02-20T12:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
    status: 'approved',
  },
  {
    name: 'Venus at Greatest Brilliancy',
    type: 'Planet Visibility',
    description: 'Venus will reach its greatest brightness in the evening sky at magnitude -4.5, making it the brightest object in the sky after the Sun and Moon.',
    startDate: new Date('2026-02-24T18:00:00Z'),
    visibility: 'Global',
    magnitude: -4.5,
    source: 'NASA',
    status: 'approved',
  },
  {
    name: 'Full Moon (Snow Moon)',
    type: 'Moon Phase',
    description: 'The Moon will be fully illuminated as seen from Earth. February\'s full moon is traditionally called the Snow Moon.',
    startDate: new Date('2026-03-07T12:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
    status: 'approved',
  },
  {
    name: 'Lyrid Meteor Shower',
    type: 'Meteor Shower',
    description: 'The Lyrids is an average shower, usually producing about 20 meteors per hour at its peak. The shower runs from April 16-25. Best viewing is after midnight.',
    startDate: new Date('2026-04-16T00:00:00Z'),
    endDate: new Date('2026-04-25T23:59:59Z'),
    peakTime: new Date('2026-04-22T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Best viewed from a dark location away from city lights',
      'Look towards the constellation Lyra',
      'Be patient — allow 20–30 minutes for your eyes to dark-adapt',
    ],
    source: 'International Meteor Organization',
    status: 'approved',
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
      'Southern Hemisphere observers see higher rates',
      'Look towards the constellation Aquarius',
      'Pre-dawn hours offer the best viewing',
    ],
    source: 'International Meteor Organization',
    status: 'approved',
  },
  {
    name: 'Jupiter Opposition',
    type: 'Planet Visibility',
    description: 'Jupiter will be at its closest approach to Earth and fully illuminated by the Sun. Best time to view and photograph Jupiter and its moons.',
    startDate: new Date('2026-06-15T20:00:00Z'),
    visibility: 'Global',
    magnitude: -2.7,
    constellation: 'Sagittarius',
    tips: [
      'Visible all night long',
      'Binoculars reveal the four Galilean moons',
      'Small telescopes show cloud bands',
    ],
    source: 'NASA',
    status: 'approved',
  },
  {
    name: 'Perseid Meteor Shower',
    type: 'Meteor Shower',
    description: 'One of the best meteor showers of the year, producing up to 60 meteors per hour at its peak. Known for bright meteors and comfortable summer viewing.',
    startDate: new Date('2026-07-17T00:00:00Z'),
    endDate: new Date('2026-08-24T23:59:59Z'),
    peakTime: new Date('2026-08-12T22:00:00Z'),
    visibility: 'Northern Hemisphere',
    tips: [
      'Best meteor shower for Northern Hemisphere observers',
      'Look towards the constellation Perseus',
      'Warm summer nights make for comfortable viewing',
    ],
    source: 'International Meteor Organization',
    status: 'approved',
  },
  {
    name: 'Partial Solar Eclipse',
    type: 'Solar Eclipse',
    description: 'A partial solar eclipse will be visible across parts of Europe, Africa, and Asia. NEVER look directly at the sun without certified eclipse glasses.',
    startDate: new Date('2026-08-12T17:00:00Z'),
    endDate: new Date('2026-08-12T21:00:00Z'),
    visibility: 'Specific Regions',
    visibleRegions: ['Europe', 'Africa', 'Western Asia'],
    tips: [
      'NEVER look directly at the Sun without ISO 12312-2 eclipse glasses',
      'Or use indirect viewing methods like pinhole projection',
    ],
    source: 'NASA Eclipse Website',
    status: 'approved',
  },
  {
    name: 'Saturn Opposition',
    type: 'Planet Visibility',
    description: 'Saturn will be at its closest approach to Earth. Best time to view Saturn\'s iconic rings and its moon Titan.',
    startDate: new Date('2026-09-21T22:00:00Z'),
    visibility: 'Global',
    magnitude: 0.2,
    constellation: 'Aquarius',
    tips: [
      'Visible all night long',
      'Any small telescope reveals the rings',
      'Titan appears as a bright "star" near Saturn',
    ],
    source: 'NASA',
    status: 'approved',
  },
  {
    name: 'Orionid Meteor Shower',
    type: 'Meteor Shower',
    description: 'Produced by dust from Halley\'s Comet. About 20 meteors per hour at its peak. Known for fast, bright meteors with fine trains.',
    startDate: new Date('2026-10-02T00:00:00Z'),
    endDate: new Date('2026-11-07T23:59:59Z'),
    peakTime: new Date('2026-10-21T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Look towards the constellation Orion',
      'Best viewing after midnight',
      'Known for bright meteors with persistent trains',
    ],
    source: 'International Meteor Organization',
    status: 'approved',
  },
  {
    name: 'Total Lunar Eclipse (Blood Moon)',
    type: 'Lunar Eclipse',
    description: 'The Moon passes completely through Earth\'s dark shadow, turning a deep red/orange colour — the famous "Blood Moon" effect.',
    startDate: new Date('2026-11-07T20:00:00Z'),
    endDate: new Date('2026-11-08T02:00:00Z'),
    peakTime: new Date('2026-11-07T23:30:00Z'),
    visibility: 'Northern Hemisphere',
    visibleRegions: ['North America', 'Europe', 'Africa'],
    tips: [
      'Safe to view with the naked eye — no filters needed',
      'Moon appears reddish-orange during totality',
      'Great opportunity for photography',
    ],
    source: 'NASA Eclipse Website',
    status: 'approved',
  },
  {
    name: 'Geminid Meteor Shower',
    type: 'Meteor Shower',
    description: 'The king of meteor showers! Can produce up to 120 multi-coloured meteors per hour at its peak. Unlike most showers, Geminids originate from an asteroid (3200 Phaethon).',
    startDate: new Date('2026-12-07T00:00:00Z'),
    endDate: new Date('2026-12-17T23:59:59Z'),
    peakTime: new Date('2026-12-14T02:00:00Z'),
    visibility: 'Global',
    tips: [
      'Best meteor shower of the year',
      'Look towards the constellation Gemini',
      'Active all night, best after midnight',
      'Meteors can be yellow, blue, red, or green',
    ],
    source: 'International Meteor Organization',
    status: 'approved',
  },
  {
    name: 'Winter Solstice',
    type: 'Other',
    description: 'The December solstice marks the shortest day in the Northern Hemisphere and the longest day in the Southern Hemisphere.',
    startDate: new Date('2026-12-21T14:00:00Z'),
    visibility: 'Global',
    source: 'NASA',
    status: 'approved',
  },
];

// ─── Seeder Functions ─────────────────────────────────────────────────────────

async function seedUsers() {
  const created = [];
  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      warn(`User ${u.username} already exists — skipping`);
      created.push(existing);
      continue;
    }
    const user = await User.create(u);
    ok(`User created: ${user.username} (${user.role})`);
    created.push(user);
  }

  // Add some follow relationships
  if (created.length >= 4) {
    const [admin, priya, raj, nina, prakash, meena] = created;
    const followPairs = [
      [priya, raj], [priya, nina], [priya, admin],
      [raj, priya], [raj, nina], [raj, meena],
      [nina, raj], [nina, priya], [nina, admin],
      [prakash, raj], [meena, nina], [meena, priya],
    ];
    for (const [follower, followed] of followPairs) {
      if (!follower || !followed) continue;
      await User.findByIdAndUpdate(follower._id, { $addToSet: { following: followed._id } });
      await User.findByIdAndUpdate(followed._id, { $addToSet: { followers: follower._id } });
    }
    ok(`Follow relationships set up`);
  }

  return created;
}

async function seedCommunities(users) {
  const [admin, priya, raj, nina, , meena] = users;
  const adminOwners = [admin, raj, priya, meena, admin];
  const created = [];

  for (let i = 0; i < COMMUNITY_TEMPLATES.length; i++) {
    const tmpl = COMMUNITY_TEMPLATES[i];
    const existing = await Community.findOne({ name: tmpl.name });
    if (existing) {
      warn(`Community "${tmpl.name}" already exists — skipping`);
      created.push(existing);
      continue;
    }
    const owner = adminOwners[i % adminOwners.length];
    const community = await Community.create({ ...tmpl, admin: owner._id });
    // Add some members
    const extraMembers = users.filter(u => u._id.toString() !== owner._id.toString()).slice(0, 4);
    await Community.findByIdAndUpdate(community._id, {
      $addToSet: { members: { $each: extraMembers.map(u => u._id) } },
    });
    ok(`Community created: ${community.name}`);
    created.push(community);
  }

  return created;
}

async function seedPosts(users, communities) {
  const created = [];
  const authors = [users[1], users[2], users[3], users[4], users[5], users[6] || users[0], users[1], users[5]];

  for (let i = 0; i < POST_TEMPLATES.length; i++) {
    const tmpl = POST_TEMPLATES[i];
    const author = authors[i % authors.length] || users[0];

    // Check if a similar post already exists
    const existing = await Post.findOne({ author: author._id, content: tmpl.content });
    if (existing) {
      warn(`Post by ${author.username} already exists — skipping`);
      created.push(existing);
      continue;
    }

    const community = communities[i % communities.length];
    const post = await Post.create({
      author: author._id,
      content: tmpl.content,
      tags: tmpl.tags,
      astronomyData: tmpl.astronomyData,
      images: [], // No real image uploads in seeder
      community: community._id,
      likes: users.slice(0, Math.floor(Math.random() * 5) + 1).map(u => u._id),
      visibility: 'public',
    });

    // Increment community post count
    await Community.findByIdAndUpdate(community._id, { $inc: { postCount: 1 } });

    ok(`Post created by ${author.username}: "${tmpl.content.substring(0, 50).trim()}..."`);
    created.push(post);
  }

  return created;
}

async function seedComments(users, posts) {
  let count = 0;
  for (const post of posts) {
    // Add 2–4 comments per post
    const numComments = Math.floor(Math.random() * 3) + 2;
    const selectedComments = COMMENT_TEMPLATES
      .sort(() => 0.5 - Math.random())
      .slice(0, numComments);

    for (let i = 0; i < selectedComments.length; i++) {
      const author = users[(i + 1) % users.length];
      const existing = await Comment.findOne({ post: post._id, author: author._id, content: selectedComments[i] });
      if (existing) continue;

      await Comment.create({
        post: post._id,
        author: author._id,
        content: selectedComments[i],
      });
      count++;
    }
  }
  ok(`${count} comments created`);
}

async function seedShopItems(admin) {
  let count = 0;
  for (const item of SHOP_ITEMS) {
    const existing = await ShopItem.findOne({ name: item.name });
    if (existing) {
      warn(`Shop item "${item.name}" already exists — skipping`);
      continue;
    }
    await ShopItem.create({ ...item, createdBy: admin._id });
    count++;
  }
  ok(`${count} shop items created`);
}

async function seedCelestialEvents() {
  let count = 0;
  for (const event of CELESTIAL_EVENTS) {
    const existing = await CelestialEvent.findOne({ name: event.name, startDate: event.startDate });
    if (existing) {
      warn(`Celestial event "${event.name}" already exists — skipping`);
      continue;
    }
    await CelestialEvent.create(event);
    count++;
  }
  ok(`${count} celestial events created`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isFresh = args.includes('--fresh');
  const isDestroy = args.includes('--destroy');

  await connect();

  if (isDestroy) {
    log('\n🗑  Destroying all data...');
    await destroyAll();
    log('✅ Database cleared.\n');
    process.exit(0);
  }

  if (isFresh) {
    log('\n🔄 Fresh mode: wiping existing data first...');
    await destroyAll();
  }

  log('\n🌱 Seeding database...\n');

  log('👤 Users');
  const users = await seedUsers();

  log('\n🏘  Communities');
  const communities = await seedCommunities(users);

  log('\n📝 Posts');
  const posts = await seedPosts(users, communities);

  log('\n💬 Comments');
  await seedComments(users, posts);

  log('\n🛒 Shop Items');
  await seedShopItems(users[0]); // admin

  log('\n🌠 Celestial Events');
  await seedCelestialEvents();

  log('\n' + '━'.repeat(50));
  log('✅ Database seeded successfully!\n');
  log('🔑 Admin credentials:');
  log(`   Email:    ${process.env.ADMIN_EMAIL || 'admin@astronomylover.com'}`);
  log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  log('\n📝 Sample user credentials (all same password):');
  log('   Email:    priya@example.com');
  log('   Password: Password@123');
  log('━'.repeat(50) + '\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seeder error:', err.message);
  process.exit(1);
});
