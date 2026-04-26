const axios = require('axios');

const cache = new Map();
const CACHE_TTL = parseInt(process.env.GEOCODING_CACHE_TTL_MS) || 86400000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCoordinates(city, landmark = '') {
  const cacheKey = `${city}|${landmark}`.toLowerCase();

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  const query = landmark ? `${landmark}, ${city}` : city;

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 1, addressdetails: 1 },
      headers: { 'User-Agent': 'SmartResourceAllocationSystem/1.0' },
      timeout: 10000,
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      const result = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        resolvedAddress: display_name,
        source: 'nominatim',
      };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }

    if (landmark) {
      await sleep(1000);
      return getCoordinates(city);
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

module.exports = { getCoordinates, sleep };
