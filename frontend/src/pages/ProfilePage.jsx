import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../features/auth/authSlice';

// ✅ Fix 1: correct icon import — no alias
import { User, Mail, MapPin, Calendar, Edit2, Check, X } from 'lucide-react';
import api from '../app/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', city: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ fullName: user.full_name || '', city: user.city || '' });
  }, [user]);

  // ✅ Fix 2: safe initials — guard against undefined/empty name
  const initials = user?.full_name
    ? user.full_name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  async function handleSave() {
    if (!form.fullName.trim()) {
      toast.error('Full name cannot be empty');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);

      // ✅ Fix 3: merge full user from response — don't cherry-pick fields
      // This preserves created_at, email, id, and any other fields
      dispatch(setUser({
        ...user,           // keep everything already in Redux
        ...res.data.user,  // overwrite with whatever backend returned
      }));

      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  // ✅ Fix 4: guard against user being null during loading
  if (!user) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8 animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-slate-700 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-700 rounded" />
              <div className="h-4 w-56 bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    { icon: User,     label: 'Full Name',    value: user.full_name || 'Not set' },
    { icon: Mail,     label: 'Email',        value: user.email },
    { icon: MapPin,   label: 'City',         value: user.city || 'Not set' },
    {
      icon: Calendar,
      label: 'Member Since',
      value: user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        : 'N/A',
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8">
        {/* Avatar + name header */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            {/* ✅ Fix 5: fallback text so blank name is obvious, not invisible */}
            <h2 className="text-xl font-bold text-white">
              {user.full_name || <span className="text-slate-500 italic">No name set</span>}
            </h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            {user.city && <p className="text-emerald-400 text-sm mt-1">{user.city}</p>}
          </div>
        </div>

        <div className="space-y-5">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all"
                >
                  <Check size={15} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    // ✅ Reset form to current user values on cancel
                    setForm({ fullName: user.full_name || '', city: user.city || '' });
                  }}
                  className="flex items-center gap-2 border border-slate-600 text-slate-300 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-700 transition-all"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{label}</p>
                    <p className="text-white text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 border border-slate-600 hover:border-emerald-600 text-slate-300 hover:text-emerald-400 px-5 py-2.5 rounded-lg font-medium text-sm transition-all mt-4"
              >
                <Edit2 size={15} /> Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}