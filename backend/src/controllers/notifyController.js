const supabase = require('../config/db');
const { getCoordinates, sleep } = require('../utils/geocoder');
const { haversineDistance } = require('../utils/haversine');
const { sendAssignmentEmail } = require('./sendAssignmentEmailController');

// ─── Category → Required Skills Map ──────────────────────────────────────────
// Maps each problem category to the skills that are relevant for it.
// A volunteer matches if they have AT LEAST ONE of the listed skills.
const CATEGORY_SKILL_MAP = {
  'Medical Emergency':    ['Medical Aid', 'Counseling'],
  'Natural Disaster':     ['Rescue Operations', 'Food Distribution', 'Construction', 'Driving', 'Medical Aid'],
  'Food Shortage':        ['Food Distribution', 'Driving'],
  'Infrastructure':       ['Construction', 'Driving', 'IT Support'],
  'Education':            ['Teaching', 'Counseling', 'IT Support'],
  'Environmental Hazard': ['Rescue Operations', 'Construction', 'Medical Aid'],
  'Social Issue':         ['Counseling', 'Teaching', 'Food Distribution'],
  'Other':                [], // no skill filter — any volunteer qualifies
};

// ─── Skill Match Check ────────────────────────────────────────────────────────
function hasMatchingSkill(volunteerSkills = [], problemCategory = '') {
  const requiredSkills = CATEGORY_SKILL_MAP[problemCategory];

  // If category is 'Other' or unknown → no skill filter, always matches
  if (!requiredSkills || requiredSkills.length === 0) return true;

  return volunteerSkills.some(skill => requiredSkills.includes(skill));
}

// ─── Geocode all volunteers missing coordinates ───────────────────────────────
async function ensureCoordinates(volunteers) {
  const result = [];

  for (const vol of volunteers) {
    if (vol.latitude && vol.longitude) {
      result.push(vol);
      continue;
    }

    await sleep(1000); // Nominatim rate limit
    const geo = await getCoordinates(vol.city, vol.landmark);

    if (geo) {
      // Persist resolved coordinates back to DB
      await supabase
        .from('volunteers')
        .update({
          latitude: geo.latitude,
          longitude: geo.longitude,
          resolved_address: geo.resolvedAddress,
          coordinates_source: 'auto',
        })
        .eq('id', vol.id);

      result.push({ ...vol, latitude: geo.latitude, longitude: geo.longitude });
    } else {
      result.push(vol); // keep without coordinates — will use text fallback
    }
  }

  return result;
}

// ─── Attach distance to each volunteer ───────────────────────────────────────
function attachDistances(volunteers, problem) {
  return volunteers
    .map(vol => {
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
    })
    .sort((a, b) => a.distanceKm - b.distanceKm); // nearest first
}

// ─── Main Controller ──────────────────────────────────────────────────────────
async function notifyNearestVolunteer(req, res) {
  try {
    const { workspaceId, pid } = req.params;

    // ── Step 1: Fetch problem ─────────────────────────────────────────────────
    let { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', pid)
      .maybeSingle();

    if (problemError || !problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // ── Step 2: Fetch workspace ───────────────────────────────────────────────
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('ngo_name, contact_email')
      .eq('id', workspaceId)
      .maybeSingle();

    if (wsError || !workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // ── Step 3: Auto-geocode problem if missing coordinates ───────────────────
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

    // ── Step 4: Fetch all available volunteers in workspace ───────────────────
    const { data: rawVolunteers, error: volError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'Available');

    if (volError || !rawVolunteers || rawVolunteers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No available volunteers found in this workspace',
      });
    }

    // ── Step 5: Geocode all volunteers missing coordinates ────────────────────
    const geocodedVolunteers = await ensureCoordinates(rawVolunteers);

    // ── Step 6: Attach distance to every volunteer and sort nearest first ─────
    const sortedByDistance = attachDistances(geocodedVolunteers, problem);

    // ── Step 7: Split into skill-matched vs unmatched ─────────────────────────
    const skillMatched = sortedByDistance.filter(vol =>
      hasMatchingSkill(vol.skills, problem.category)
    );
    const unmatched = sortedByDistance.filter(vol =>
      !hasMatchingSkill(vol.skills, problem.category)
    );

    /*
      Selection logic:
      ┌─────────────────────────────────────────────────────────┐
      │ 1. skill-matched volunteers exist?                      │
      │    → pick the NEAREST among them (skillMatched[0])      │
      │                                                         │
      │ 2. no skill-matched volunteers?                         │
      │    → fall back to nearest ANY available volunteer       │
      │      (sortedByDistance[0]) and flag it as a fallback    │
      └─────────────────────────────────────────────────────────┘
    */
    const isFallback = skillMatched.length === 0;
    const nearest = isFallback ? sortedByDistance[0] : skillMatched[0];

    // ── Step 8: Assign volunteer to problem ───────────────────────────────────
    const [assignProblem, assignVolunteer] = await Promise.all([
      supabase.from('problems').update({
        assigned_volunteer_id: nearest.id,
        status: 'Assigned',
        distance_km: nearest.distanceKm,
      }).eq('id', pid),

      supabase.from('volunteers').update({
        current_assignment_id: pid,
        status: 'Busy',
      }).eq('id', nearest.id),
    ]);

    if (assignProblem.error || assignVolunteer.error) {
      console.error('Assignment DB error:', assignProblem.error || assignVolunteer.error);
      return res.status(500).json({ success: false, message: 'Failed to save assignment' });
    }

    // ── Step 9: Send assignment email (non-blocking) ──────────────────────────
    let emailSent = false;
    let emailError = null;

    if (nearest.email) {
      try {
        await sendAssignmentEmail({ volunteer: nearest, problem, workspace });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error('Email notification failed:', err.message);
      }
    } else {
      emailError = 'Volunteer has no email address on record';
    }

    // ── Step 10: Return detailed response ─────────────────────────────────────
    return res.json({
      success: true,
      message: isFallback
        ? `No skill-matched volunteer found for "${problem.category}". Assigned to nearest available volunteer instead.`
        : `Assigned to nearest skill-matched volunteer for "${problem.category}".`,

      // tells the frontend exactly how the selection was made
      selectionInfo: {
        method: isFallback ? 'nearest_fallback' : 'skill_matched',
        skillMatchedCount: skillMatched.length,
        totalAvailable: sortedByDistance.length,
        requiredSkills: CATEGORY_SKILL_MAP[problem.category] || [],
        volunteerSkills: nearest.skills || [],
      },

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
        skillMatched: !isFallback,
      },

      problem: {
        id: problem.id,
        title: problem.title,
        category: problem.category,
        city: problem.city,
        priority: problem.priority,
      },
    });

  } catch (err) {
    console.error('notifyNearestVolunteer error:', err);
    return res.status(500).json({ success: false, message: 'Notification failed' });
  }
}

module.exports = { notifyNearestVolunteer };