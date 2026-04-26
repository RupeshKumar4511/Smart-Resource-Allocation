// DashboardTab.jsx
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Users, CheckCircle, Clock, Bell, Trash2, Pencil } from 'lucide-react';
import api from '../../app/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  Low: 'text-slate-400 bg-slate-800',
  Medium: 'text-yellow-400 bg-yellow-900/30',
  High: 'text-orange-400 bg-orange-900/30',
  Critical: 'text-red-400 bg-red-900/30'
};
const STATUS_COLORS = {
  Open: 'text-blue-400 bg-blue-900/30',
  Assigned: 'text-purple-400 bg-purple-900/30',
  'In Progress': 'text-yellow-400 bg-yellow-900/30',
  Resolved: 'text-emerald-400 bg-emerald-900/30'
};
const VOLUNTEER_STATUS_COLORS = {
  Available: 'text-emerald-400 bg-emerald-900/30',
  Busy: 'text-yellow-400 bg-yellow-900/30',
  Inactive: 'text-slate-400 bg-slate-800',
};

const CATEGORIES = ['Medical Emergency','Natural Disaster','Food Shortage','Infrastructure','Education','Environmental Hazard','Social Issue','Other'];
const PRIORITIES = ['Low','Medium','High','Critical'];
const STATUSES = ['Open','Assigned','In Progress','Resolved'];
const SKILLS = ['Medical Aid','Rescue Operations','Food Distribution','Counseling','Teaching','Construction','Driving','IT Support','Other'];
const AVAILABILITY = ['Full-Time','Part-Time','Weekends Only','On-Call'];

// ─── Reusable Input ───────────────────────────────────────────────────────────
const inputCls = "w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";

// ─── Edit Problem Modal ───────────────────────────────────────────────────────
function EditProblemModal({ problem, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: problem.title || '',
    description: problem.description || '',
    category: problem.category || '',
    priority: problem.priority || 'Medium',
    status: problem.status || 'Open',
    city: problem.city || '',
    landmark: problem.landmark || '',
    address: problem.address || '',
    contact_person_name: problem.contact_person_name || '',
    contact_person_phone: problem.contact_person_phone || '',
    estimated_people_affected: problem.estimated_people_affected || 0,
    notes: problem.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/workspaces/${problem.workspace_id}/problems/${problem.id}`, form);
      toast.success('Problem updated!');
      onSaved(res.data.problem);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update problem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Edit Problem</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={form.title} onChange={set('title')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={set('description')} rows={3} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={set('category')} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={set('priority')} className={inputCls}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estimated People Affected</label>
              <input type="number" value={form.estimated_people_affected} onChange={set('estimated_people_affected')} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={set('city')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Landmark</label>
              <input value={form.landmark} onChange={set('landmark')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Name</label>
              <input value={form.contact_person_name} onChange={set('contact_person_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Phone</label>
              <input value={form.contact_person_phone} onChange={set('contact_person_phone')} maxLength={10} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <textarea value={form.address} onChange={set('address')} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="border border-slate-600 text-slate-300 px-5 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Volunteer Modal ─────────────────────────────────────────────────────
function EditVolunteerModal({ volunteer, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: volunteer.full_name || '',
    email: volunteer.email || '',
    phone: volunteer.phone || '',
    age: volunteer.age || '',
    gender: volunteer.gender || '',
    city: volunteer.city || '',
    landmark: volunteer.landmark || '',
    address: volunteer.address || '',
    skills: volunteer.skills || [],
    availability: volunteer.availability || '',
    experience_years: volunteer.experience_years || 0,
    has_vehicle: volunteer.has_vehicle || false,
    emergency_contact_name: volunteer.emergency_contact_name || '',
    emergency_contact_phone: volunteer.emergency_contact_phone || '',
    status: volunteer.status || 'Available',
    notes: volunteer.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function toggleSkill(skill) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill],
    }));
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/workspaces/${volunteer.workspace_id}/volunteers/${volunteer.id}`, form);
      toast.success('Volunteer updated!');
      onSaved(res.data.volunteer);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update volunteer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Edit Volunteer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input value={form.full_name} onChange={set('full_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email} onChange={set('email')} type="email" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={set('phone')} maxLength={10} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input value={form.age} onChange={set('age')} type="number" min={18} max={65} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select value={form.gender} onChange={set('gender')} className={inputCls}>
                <option value="">Select...</option>
                {['Male','Female','Non-binary','Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {['Available','Busy','Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={set('city')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Landmark</label>
              <input value={form.landmark} onChange={set('landmark')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Availability</label>
              <select value={form.availability} onChange={set('availability')} className={inputCls}>
                <option value="">Select...</option>
                {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Experience (Years)</label>
              <input value={form.experience_years} onChange={set('experience_years')} type="number" min={0} max={40} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Emergency Contact Name</label>
              <input value={form.emergency_contact_name} onChange={set('emergency_contact_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Emergency Contact Phone</label>
              <input value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} maxLength={10} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <textarea value={form.address} onChange={set('address')} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Has Own Vehicle?</label>
            <div className="flex gap-4 mt-1">
              {[true, false].map(v => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={form.has_vehicle === v}
                    onChange={() => setForm(f => ({ ...f, has_vehicle: v }))}
                    className="accent-emerald-500" />
                  <span className="text-slate-300 text-sm">{v ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Skills</label>
            <div className="grid grid-cols-3 gap-2">
              {SKILLS.map(skill => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.skills.includes(skill)}
                    onChange={() => toggleSkill(skill)} className="accent-emerald-500 w-4 h-4" />
                  <span className="text-slate-300 text-sm">{skill}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="border border-slate-600 text-slate-300 px-5 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardTab({ workspaceId }) {
  const [data, setData] = useState({ stats: {}, problems: [], volunteers: [] });
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type: 'problem'|'volunteer' }
  const [editProblem, setEditProblem] = useState(null);
  const [editVolunteer, setEditVolunteer] = useState(null);
  const [activeTab, setActiveTab] = useState('problems'); // 'problems' | 'volunteers'

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get(`/workspaces/${workspaceId}/dashboard`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function notifyVolunteer(problem) {
    setNotifying(problem.id);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/problems/${problem.id}/notify`);
      const v = res.data.volunteer;
      toast.success(`Assigned to ${v.name} — ${v.distanceKm} km away`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Notification failed');
    } finally {
      setNotifying(null);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    const url = type === 'problem'
      ? `/workspaces/${workspaceId}/problems/${id}`
      : `/workspaces/${workspaceId}/volunteers/${id}`;
    try {
      await api.delete(url);
      toast.success(`${type === 'problem' ? 'Problem' : 'Volunteer'} deleted`);
      setDeleteConfirm(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  }

  function handleProblemSaved(updated) {
    setData(d => ({ ...d, problems: d.problems.map(p => p.id === updated.id ? updated : p) }));
  }

  function handleVolunteerSaved(updated) {
    setData(d => ({ ...d, volunteers: d.volunteers.map(v => v.id === updated.id ? updated : v) }));
  }

  const stats = [
    { label: 'Total Problems',    value: data.stats.totalProblems    || 0, icon: AlertCircle, color: 'text-blue-400' },
    { label: 'Total Volunteers',  value: data.stats.totalVolunteers  || 0, icon: Users,        color: 'text-emerald-400' },
    { label: 'Assigned',          value: data.stats.assignedProblems || 0, icon: CheckCircle,  color: 'text-purple-400' },
    { label: 'Unassigned',        value: data.stats.unassignedProblems || 0, icon: Clock,      color: 'text-yellow-400' },
  ];

  if (loading) return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-navy-800 rounded-xl" />)}</div>
      <div className="h-64 bg-navy-800 rounded-xl" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-navy-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs font-medium">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-navy-900 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'problems',   label: `Problems (${data.problems.length})` },
          { key: 'volunteers', label: `Volunteers (${data.volunteers.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Problems Table ── */}
      {activeTab === 'problems' && (
        <div className="bg-navy-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">All Problems</h2>
          </div>
          {data.problems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No problems registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    {['Title','Category','Location','Priority','Status','Volunteer','Distance','Date','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.problems.map(p => {
                    const vol = data.volunteers.find(v => v.id === p.assigned_volunteer_id);
                    return (
                      <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-white font-medium max-w-[150px] truncate">{p.title}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.category}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.city}{p.landmark ? `, ${p.landmark}` : ''}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[p.priority]}`}>{p.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {vol ? <span className="text-white">{vol.full_name}</span> : <span className="text-slate-600">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {p.distance_km ? `${p.distance_km} km` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {p.status === 'Open' && (
                              <button onClick={() => notifyVolunteer(p)} disabled={notifying === p.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 rounded-lg text-xs font-medium transition-all whitespace-nowrap">
                                {notifying === p.id
                                  ? <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                  : <Bell size={11} />}
                                Notify
                              </button>
                            )}
                            {/* ✅ Edit button */}
                            <button onClick={() => setEditProblem(p)}
                              className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-all"
                              title="Edit problem">
                              <Pencil size={13} />
                            </button>
                            {/* ✅ Delete button */}
                            <button onClick={() => setDeleteConfirm({ id: p.id, type: 'problem' })}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                              title="Delete problem">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Volunteers Table ── */}
      {activeTab === 'volunteers' && (
        <div className="bg-navy-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">All Volunteers</h2>
          </div>
          {data.volunteers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No volunteers registered yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    {['Name','Email','Phone','City','Skills','Availability','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.volunteers.map(v => (
                    <tr key={v.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{v.full_name}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.email}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.phone}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.city}{v.landmark ? `, ${v.landmark}` : ''}</td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {(v.skills || []).slice(0, 2).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{s}</span>
                          ))}
                          {(v.skills || []).length > 2 && (
                            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">+{v.skills.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.availability || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VOLUNTEER_STATUS_COLORS[v.status] || ''}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* ✅ Edit button */}
                          <button onClick={() => setEditVolunteer(v)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-all"
                            title="Edit volunteer">
                            <Pencil size={13} />
                          </button>
                          {/* ✅ Delete button */}
                          <button onClick={() => setDeleteConfirm({ id: v.id, type: 'volunteer' })}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete volunteer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modals ── */}
      {editProblem   && <EditProblemModal   problem={editProblem}     onClose={() => setEditProblem(null)}   onSaved={handleProblemSaved}   />}
      {editVolunteer && <EditVolunteerModal volunteer={editVolunteer} onClose={() => setEditVolunteer(null)} onSaved={handleVolunteerSaved} />}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">
              Delete {deleteConfirm.type === 'problem' ? 'Problem' : 'Volunteer'}?
            </h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm hover:bg-slate-700 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}