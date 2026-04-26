const express = require('express');
const router = express.Router();
const { geocode } = require('../controllers/geocodeController');

router.get('/', geocode);

module.exports = router;
