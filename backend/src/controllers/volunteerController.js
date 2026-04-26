const supabase = require('../config/db');
const { getCoordinates } = require('../utils/geocoder');

async function createVolunteer(req, res) {
  try {
    const workspaceId = req.workspaceId || req.params.workspaceId;
    const {
      fullName, email, phone, age, gender, city, landmark, address,
      latitude, longitude, skills, availability, experienceYears,
      hasVehicle, emergencyContactName, emergencyContactPhone, notes
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

    const { data: volunteer, error } = await supabase.from('volunteers').insert({
      workspace_id: workspaceId,
      full_name: fullName, email, phone,
      age: age || null, gender: gender || '',
      city, landmark: landmark || '', address: address || '',
      latitude: lat, longitude: lng,
      resolved_address: resolvedAddress,
      coordinates_source: coordinatesSource,
      skills: Array.isArray(skills) ? skills : [],
      availability: availability || '',
      experience_years: experienceYears || 0,
      has_vehicle: hasVehicle || false,
      emergency_contact_name: emergencyContactName || '',
      emergency_contact_phone: emergencyContactPhone || '',
      status: 'Available',
      notes: notes || '',
    }).select().maybeSingle();

    if (error) throw error;
    res.status(201).json({ success: true, volunteer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to register volunteer' });
  }
}

async function getVolunteers(req, res) {
  try {
    const workspaceId = req.workspaceId || req.params.workspaceId;
    const { data: volunteers, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, volunteers: volunteers || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch volunteers' });
  }
}

async function getVolunteer(req, res) {
  try {
    const { vid } = req.params;
    const { data: volunteer } = await supabase.from('volunteers').select('*').eq('id', vid).maybeSingle();
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer not found' });
    res.json({ success: true, volunteer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch volunteer' });
  }
}

async function updateVolunteer(req, res) {
  try {
    const { vid } = req.params;
    const body = req.body;
    const updates = {};
    const fieldMap = {
      fullName: 'full_name', email: 'email', phone: 'phone', age: 'age',
      gender: 'gender', city: 'city', landmark: 'landmark', address: 'address',
      skills: 'skills', availability: 'availability',
      experienceYears: 'experience_years', hasVehicle: 'has_vehicle',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      status: 'status', notes: 'notes'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) updates[col] = body[key];
    }

    if (body.city || body.landmark) {
      const { data: existing } = await supabase.from('volunteers').select('city, landmark').eq('id', vid).maybeSingle();
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

    const { data: volunteer } = await supabase.from('volunteers').update(updates).eq('id', vid).select().maybeSingle();
    res.json({ success: true, volunteer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update volunteer' });
  }
}

async function deleteVolunteer(req, res) {
  try {
    const { vid } = req.params;
    await supabase.from('volunteers').delete().eq('id', vid);
    res.json({ success: true, message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete volunteer' });
  }
}

module.exports = { createVolunteer, getVolunteers, getVolunteer, updateVolunteer, deleteVolunteer };
