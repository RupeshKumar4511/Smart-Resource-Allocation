const supabase = require('../config/db');
const { getCoordinates } = require('../utils/geocoder');

async function createProblem(req, res) {
  try {
    const workspaceId = req.workspaceId || req.params.workspaceId;
    const {
      title, description, category, priority, city, landmark, address,
      latitude, longitude, estimatedPeopleAffected, contactPersonName,
      contactPersonPhone, notes
    } = req.body;

    let lat = latitude ? parseFloat(latitude) : null;
    let lng = longitude ? parseFloat(longitude) : null;
    let resolvedAddress = '';
    let coordinatesSource = 'manual';

    if (!lat || !lng) {
      const geo = await getCoordinates(city, landmark);
      if (geo) {
        lat = geo.latitude;
        lng = geo.longitude;
        resolvedAddress = geo.resolvedAddress;
        coordinatesSource = 'auto';
      }
    }

    const { data: problem, error } = await supabase.from('problems').insert({
      workspace_id: workspaceId,
      title, description, category,
      priority: priority || 'Medium',
      status: 'Open',
      city, landmark: landmark || '',
      address: address || '',
      latitude: lat, longitude: lng,
      resolved_address: resolvedAddress,
      coordinates_source: coordinatesSource,
      estimated_people_affected: estimatedPeopleAffected || 0,
      contact_person_name: contactPersonName || '',
      contact_person_phone: contactPersonPhone || '',
      notes: notes || '',
    }).select().maybeSingle();

    if (error) throw error;
    res.status(201).json({ success: true, problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create problem' });
  }
}

async function getProblems(req, res) {
  try {
    const workspaceId = req.workspaceId || req.params.workspaceId;
    const { data: problems, error } = await supabase
      .from('problems')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, problems: problems || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch problems' });
  }
}

async function getProblem(req, res) {
  try {
    const { pid } = req.params;
    const { data: problem } = await supabase.from('problems').select('*').eq('id', pid).maybeSingle();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch problem' });
  }
}

async function updateProblem(req, res) {
  try {
    const { pid } = req.params;
    const body = req.body;
    const updates = {};
    const fieldMap = {
      title: 'title', description: 'description', category: 'category',
      priority: 'priority', status: 'status', city: 'city', landmark: 'landmark',
      address: 'address', latitude: 'latitude', longitude: 'longitude',
      estimatedPeopleAffected: 'estimated_people_affected',
      contactPersonName: 'contact_person_name', contactPersonPhone: 'contact_person_phone',
      notes: 'notes'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) updates[col] = body[key];
    }

    // Re-geocode if location changed
    if (body.city || body.landmark) {
      const { data: existing } = await supabase.from('problems').select('city, landmark').eq('id', pid).maybeSingle();
      const city = body.city || existing?.city;
      const landmark = body.landmark || existing?.landmark;
      const geo = await getCoordinates(city, landmark);
      if (geo) {
        updates.latitude = geo.latitude;
        updates.longitude = geo.longitude;
        updates.resolved_address = geo.resolvedAddress;
        updates.coordinates_source = 'auto';
      }
    }

    const { data: problem } = await supabase.from('problems').update(updates).eq('id', pid).select().maybeSingle();
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update problem' });
  }
}

async function deleteProblem(req, res) {
  try {
    const { pid } = req.params;
    await supabase.from('problems').delete().eq('id', pid);
    res.json({ success: true, message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete problem' });
  }
}

module.exports = { createProblem, getProblems, getProblem, updateProblem, deleteProblem };
