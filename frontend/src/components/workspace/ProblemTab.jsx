import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, AlertCircle, Bell, CheckCircle } from 'lucide-react';
import api from '../../app/api';
import toast from 'react-hot-toast';
import CoordinateField from './CoordinateField';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().min(30, 'Min 30 characters').required('Description is required'),
  category: yup.string().required('Category is required'),
  priority: yup.string().required('Priority is required'),
  city: yup.string().required('City is required'),
  landmark: yup.string().required('Landmark is required'),
  contactPersonName: yup.string().required('Contact name is required'),
  contactPersonPhone: yup.string().matches(/^\d{10}$/, 'Must be 10 digits').required('Contact phone is required'),
});

const CATEGORIES = ['Medical Emergency', 'Natural Disaster', 'Food Shortage', 'Infrastructure', 'Education', 'Environmental Hazard', 'Social Issue', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_COLORS = { Low: 'border-slate-600 text-slate-300', Medium: 'border-yellow-600 text-yellow-300', High: 'border-orange-600 text-orange-300', Critical: 'border-red-600 text-red-300' };

export default function ProblemTab({ workspaceId }) {
  const [coords, setCoords] = useState({ latitude: null, longitude: null, resolvedAddress: '' });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema), defaultValues: { priority: 'Medium' } });
  const city = watch('city');
  const landmark = watch('landmark');

  async function onSubmit(data) {
    setLoading(true);
    try {
      const payload = { ...data, ...coords };
      const res = await api.post(`/workspaces/${workspaceId}/problems`, payload);
      toast.success('Problem registered!');
      setSubmitted(res.data.problem);
      reset();
      setCoords({ latitude: null, longitude: null, resolvedAddress: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register problem');
    } finally {
      setLoading(false);
    }
  }

  async function notifyNow() {
    if (!submitted) return;
    setNotifying(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/problems/${submitted.id}/notify`);
      const v = res.data.volunteer;
      toast.success(`Assigned to ${v.name} — ${v.distanceKm} km away`);
      setSubmitted(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No volunteers available');
    } finally {
      setNotifying(false);
    }
  }

  const inputCls = "w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";
  const errorCls = "text-red-400 text-xs mt-1";

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center">
          <AlertCircle size={20} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Register Problem</h2>
          <p className="text-slate-400 text-sm">Document a new crisis or issue</p>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <CheckCircle size={18} />
            <span className="font-semibold">Problem registered successfully!</span>
          </div>
          <p className="text-slate-300 text-sm mb-4">"{submitted.title}" has been added to the system.</p>
          <div className="flex gap-3">
            <button onClick={notifyNow} disabled={notifying}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              {notifying
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Bell size={16} />}
              Notify Nearest Volunteer
            </button>
            {/* ✅ New: dismiss banner */}
            <button onClick={() => setSubmitted(null)}
              className="border border-slate-600 text-slate-300 px-5 py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-all">
              Register Another
            </button>
          </div>
        </div>
      )}

      <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className={labelCls}>Problem Title *</label>
            <input {...register('title')} className={inputCls} placeholder="Flood affecting 200 families in Sector 4" />
            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Description *</label>
            <textarea {...register('description')} rows={4} className={inputCls} placeholder="Detailed description (min 30 characters)..." />
            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Category *</label>
              <select {...register('category')} className={inputCls}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className={errorCls}>{errors.category.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Priority *</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map(p => (
                  <label key={p} className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-all ${PRIORITY_COLORS[p]}`}>
                    <input type="radio" value={p} {...register('priority')} className="accent-emerald-500" />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>City *</label>
              <input {...register('city')} className={inputCls} placeholder="Mumbai" />
              {errors.city && <p className={errorCls}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Landmark *</label>
              <input {...register('landmark')} className={inputCls} placeholder="Near City Hospital" />
              {errors.landmark && <p className={errorCls}>{errors.landmark.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Address</label>
            <textarea {...register('address')} rows={2} className={inputCls} placeholder="Street address..." />
          </div>

          <CoordinateField city={city} landmark={landmark} onDetected={(c) => setCoords(c)} />

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Contact Person Name *</label>
              <input {...register('contactPersonName')} className={inputCls} placeholder="Rahul Kumar" />
              {errors.contactPersonName && <p className={errorCls}>{errors.contactPersonName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Contact Person Phone *</label>
              <input {...register('contactPersonPhone')} className={inputCls} placeholder="9876543210" maxLength={10} />
              {errors.contactPersonPhone && <p className={errorCls}>{errors.contactPersonPhone.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Estimated People Affected</label>
            <input {...register('estimatedPeopleAffected')} type="number" className={inputCls} placeholder="0" min={0} />
          </div>

          <div>
            <label className={labelCls}>Additional Notes</label>
            <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Any additional context..." />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register Problem'}
          </button>
        </form>
      </div>
    </div>
  );
}
