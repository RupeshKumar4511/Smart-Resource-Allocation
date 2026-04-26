const supabase = require('../config/db');
const { getCoordinates, sleep } = require('../utils/geocoder');
const { haversineDistance } = require('../utils/haversine');
const { sendAssignmentEmail } = require('./sendAssignmentEmailController');

async function notifyNearestVolunteer(req, res) {
  try {
    const { workspaceId, pid } = req.params;

    // Step 1: Fetch problem
    let { data: problem } = await supabase
      .from('problems')
      .select('*')
      .eq('id', pid)
      .maybeSingle();

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Step 2: Fetch workspace details (needed for email)
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('ngo_name, contact_email')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Step 3: Auto-geocode problem if missing coordinates
    if (!problem.latitude || !problem.longitude) {
      const geo = await getCoordinates(problem.city, problem.landmark);
      if (geo) {
        await supabase.from('problems').update({
          latitude: geo.latitude,
          longitude: geo.longitude,
          resolved_address: geo.resolvedAddress,
          coordinates_source: 'auto',
        }).eq('id', pid);
        problem.latitude = geo.latitude;
        problem.longitude = geo.longitude;
      }
    }

    // Step 4: Get available volunteers in this workspace
    const { data: volunteers } = await supabase
      .from('volunteers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'Available');

    if (!volunteers || volunteers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No available volunteers found',
      });
    }

    // Step 5: Ensure all volunteers have coordinates
    const geocodedVolunteers = [];
    for (const vol of volunteers) {
      if (!vol.latitude || !vol.longitude) {
        await sleep(1000);
        const geo = await getCoordinates(vol.city, vol.landmark);
        if (geo) {
          await supabase.from('volunteers').update({
            latitude: geo.latitude,
            longitude: geo.longitude,
            resolved_address: geo.resolvedAddress,
            coordinates_source: 'auto',
          }).eq('id', vol.id);
          geocodedVolunteers.push({
            ...vol,
            latitude: geo.latitude,
            longitude: geo.longitude,
          });
        } else {
          geocodedVolunteers.push(vol);
        }
      } else {
        geocodedVolunteers.push(vol);
      }
    }

    // Step 6: Calculate distances using Haversine
    const withDistance = geocodedVolunteers.map((vol) => {
      let distanceKm;
      if (problem.latitude && problem.longitude && vol.latitude && vol.longitude) {
        distanceKm = haversineDistance(
          problem.latitude,
          problem.longitude,
          vol.latitude,
          vol.longitude
        );
      } else {
        // Text-based fallback
        distanceKm =
          vol.city?.toLowerCase() === problem.city?.toLowerCase() ? 5 : 50;
      }
      return { ...vol, distanceKm: parseFloat(distanceKm.toFixed(2)) };
    });

    // Step 7: Sort by distance and pick nearest
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    const nearest = withDistance[0];

    // Step 8: Assign volunteer to problem
    await supabase.from('problems').update({
      assigned_volunteer_id: nearest.id,
      status: 'Assigned',
      distance_km: nearest.distanceKm,
    }).eq('id', pid);

    await supabase.from('volunteers').update({
      current_assignment_id: pid,
      status: 'Busy',
    }).eq('id', nearest.id);

    // Step 9: Send assignment email to volunteer
    let emailSent = false;
    let emailError = null;

    if (nearest.email) {
      try {
        await sendAssignmentEmail({
          volunteer: nearest,
          problem,
          workspace,
        });
        emailSent = true;
      } catch (err) {
        // Non-blocking — assignment succeeded even if email fails
        emailError = err.message;
        console.error('Email notification failed:', err.message);
      }
    } else {
      emailError = 'Volunteer has no email address on record';
    }

    // Step 10: Return response
    res.json({
      success: true,
      message: 'Problem assigned successfully',
      emailNotification: {
        sent: emailSent,
        recipient: nearest.email ?? null,
        ...(emailError && { error: emailError }),
      },
      volunteer: {
        id: nearest.id,
        name: nearest.full_name,
        email: nearest.email,
        phone: nearest.phone,
        city: nearest.city,
        landmark: nearest.landmark,
        skills: nearest.skills,
        distanceKm: nearest.distanceKm,
      },
      problem: {
        id: problem.id,
        title: problem.title,
        city: problem.city,
        priority: problem.priority,
      },
    });
  } catch (err) {
    console.error('notifyNearestVolunteer error:', err);
    res.status(500).json({ success: false, message: 'Notification failed' });
  }
}

module.exports = { notifyNearestVolunteer };
