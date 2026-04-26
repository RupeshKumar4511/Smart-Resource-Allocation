const { getCoordinates } = require('../utils/geocoder');

async function geocode(req, res) {
  try {
    const { city, landmark } = req.query;
    if (!city) return res.status(400).json({ success: false, message: 'City is required' });

    const result = await getCoordinates(city, landmark || '');
    if (!result) {
      return res.json({ success: false, message: 'Could not resolve coordinates for this location' });
    }

    res.json({
      success: true,
      latitude: result.latitude,
      longitude: result.longitude,
      resolvedAddress: result.resolvedAddress,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Geocoding service error' });
  }
}

module.exports = { geocode };
