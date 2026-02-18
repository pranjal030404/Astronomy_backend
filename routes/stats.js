const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');

router.get('/', getStats);

module.exports = router;
