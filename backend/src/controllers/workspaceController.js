const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

async function createWorkspace(req, res) {
  try {
    const { ngoName, description, ngoType, city, address, contactEmail, contactPhone, password, websiteUrl, foundedYear } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: workspace, error } = await supabase.from('workspaces').insert({
      ngo_name: ngoName,
      description,
      ngo_type: ngoType,
      city,
      address: address || '',
      contact_email: contactEmail,
      contact_phone: contactPhone,
      password_hash: passwordHash,
      website_url: websiteUrl || '',
      founded_year: foundedYear || null,
      created_by: req.user.id,
    }).select().maybeSingle();

    if (error) throw error;
    res.status(201).json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create workspace' });
  }
}

async function getWorkspaces(req, res) {
  try {
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add counts
    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (ws) => {
        const [{ count: problemCount }, { count: volunteerCount }] = await Promise.all([
          supabase.from('problems').select('id', { count: 'exact', head: true }).eq('workspace_id', ws.id),
          supabase.from('volunteers').select('id', { count: 'exact', head: true }).eq('workspace_id', ws.id),
        ]);
        return { ...ws, problemCount: problemCount || 0, volunteerCount: volunteerCount || 0 };
      })
    );

    res.json({ success: true, workspaces: workspacesWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch workspaces' });
  }
}

async function getWorkspace(req, res) {
  try {
    const { id } = req.params;
    const { data: workspace, error } = await supabase.from('workspaces').select('*').eq('id', id).eq('created_by', req.user.id).maybeSingle();
    if (error || !workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    res.json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch workspace' });
  }
}

async function updateWorkspace(req, res) {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['ngoName', 'description', 'ngoType', 'city', 'address', 'contactEmail', 'contactPhone', 'websiteUrl', 'foundedYear'];
    const fieldMap = { ngoName: 'ngo_name', ngoType: 'ngo_type', contactEmail: 'contact_email', contactPhone: 'contact_phone', websiteUrl: 'website_url', foundedYear: 'founded_year' };

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[fieldMap[key] || key] = req.body[key];
      }
    }

    const { data: workspace } = await supabase.from('workspaces').update(updates).eq('id', id).eq('created_by', req.user.id).select().maybeSingle();
    res.json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update workspace' });
  }
}

async function deleteWorkspace(req, res) {
  try {
    const { id } = req.params;
    await supabase.from('workspaces').delete().eq('id', id).eq('created_by', req.user.id);
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete workspace' });
  }
}

async function getDashboard(req, res) {
  try {
    const { id } = req.params;

    // ✅ Fix 1: separate plain queries — no FK join that silently fails
    const [problemsResult, volunteersResult] = await Promise.all([
      supabase
        .from('problems')
        .select('*')
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('volunteers')
        .select('*')
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
    ]);

    // ✅ Fix 2: check for supabase-level errors explicitly
    if (problemsResult.error) {
      console.error('Problems fetch error:', problemsResult.error);
      return res.status(500).json({ success: false, message: 'Failed to fetch problems', detail: problemsResult.error.message });
    }

    if (volunteersResult.error) {
      console.error('Volunteers fetch error:', volunteersResult.error);
      return res.status(500).json({ success: false, message: 'Failed to fetch volunteers', detail: volunteersResult.error.message });
    }

    const problems = problemsResult.data || [];
    const volunteers = volunteersResult.data || [];

    // ✅ Fix 3: build a volunteer lookup map for O(1) enrichment
    const volunteerMap = {};
    for (const v of volunteers) {
      volunteerMap[v.id] = v;
    }

    // ✅ Fix 4: enrich each problem with its assigned volunteer's details
    const enrichedProblems = problems.map(p => ({
      ...p,
      volunteer: p.assigned_volunteer_id
        ? volunteerMap[p.assigned_volunteer_id] || null
        : null,
    }));

    // ✅ Fix 5: correct status checks — covers all non-open statuses
    const stats = {
      totalProblems: problems.length,
      totalVolunteers: volunteers.length,
      assignedProblems: problems.filter(p =>
        p.status === 'Assigned' || p.status === 'In Progress'
      ).length,
      unassignedProblems: problems.filter(p => p.status === 'Open').length,
      resolvedProblems: problems.filter(p => p.status === 'Resolved').length,
    };

    res.json({
      success: true,
      stats,
      problems: enrichedProblems,
      volunteers,
    });

  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
}

module.exports = { createWorkspace, getWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace, getDashboard };
