import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Users, CheckCircle } from 'lucide-react';
import api from '../../app/api';
import toast from 'react-hot-toast';
import CoordinateField from './CoordinateField';

const SKILLS = ['Medical Aid', 'Rescue Operations', 'Food Distribution', 'Counseling', 'Teaching', 'Construction', 'Driving', 'IT Support', 'Other'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AVAILABILITY = ['Full-Time', 'Part-Time', 'Weekends Only', 'On-Call'];

const schema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^\d{10}$/, 'Must be 10 digits').required('Phone is required'),
  age: yup.number().min(18, 'Must be 18+').max(65, 'Must be under 65').required('Age is required'),
  city: yup.string().required('City is required'),
  landmark: yup.string().required('Landmark is required'),
  skills: yup.array().min(1, 'Select at least one skill').required(),
  availability: yup.string().required('Availability is required'),
});

export default function VolunteerTab({ workspaceId }) {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { skills: [], hasVehicle: false }
  });

  const city = watch('city');
  const landmark = watch('landmark');

  async function onSubmit(data) {
    setLoading(true);
    try {
      await api.post(`/workspaces/${workspaceId}/volunteers`, { ...data, ...coords });
      toast.success('Volunteer registered!');
      setSubmitted(true);
      reset();
      setCoords({ latitude: null, longitude: null });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register volunteer');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";
  const errorCls = "text-red-400 text-xs mt-1";

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center">
          <Users size={20} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Register Volunteer</h2>
          <p className="text-slate-400 text-sm">Add a new volunteer to this workspace</p>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-emerald-300 font-medium">Volunteer registered successfully!</span>
          </div>
          {/* ✅ New: dismiss manually instead of only auto-dismissing after 4s */}
          <button onClick={() => setSubmitted(false)} className="text-slate-400 hover:text-white text-sm">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input {...register('fullName')} className={inputCls} placeholder="Priya Sharma" />
              {errors.fullName && <p className={errorCls}>{errors.fullName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input {...register('email')} type="email" className={inputCls} placeholder="priya@email.com" />
              {errors.email && <p className={errorCls}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input {...register('phone')} className={inputCls} placeholder="9876543210" maxLength={10} />
              {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Age *</label>
              <input {...register('age')} type="number" className={inputCls} placeholder="25" min={18} max={65} />
              {errors.age && <p className={errorCls}>{errors.age.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select {...register('gender')} className={inputCls}>
                <option value="">Select...</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Availability *</label>
              <select {...register('availability')} className={inputCls}>
                <option value="">Select...</option>
                {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.availability && <p className={errorCls}>{errors.availability.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>City *</label>
              <input {...register('city')} className={inputCls} placeholder="Delhi" />
              {errors.city && <p className={errorCls}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Landmark / Area *</label>
              <input {...register('landmark')} className={inputCls} placeholder="Sector 15" />
              {errors.landmark && <p className={errorCls}>{errors.landmark.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Address</label>
            <textarea {...register('address')} rows={2} className={inputCls} placeholder="Street address..." />
          </div>

          <CoordinateField city={city} landmark={landmark} onDetected={(c) => setCoords(c)} />

          <div>
            <label className={labelCls}>Skills * (select all that apply)</label>
            <div className="grid grid-cols-3 gap-2">
              {SKILLS.map(skill => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" value={skill} {...register('skills')} className="accent-emerald-500 w-4 h-4" />
                  <span className="text-slate-300 text-sm">{skill}</span>
                </label>
              ))}
            </div>
            {errors.skills && <p className={errorCls}>{errors.skills.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Experience (Years)</label>
              <input {...register('experienceYears')} type="number" className={inputCls} placeholder="0" min={0} max={40} />
            </div>
            <div>
              <label className={labelCls}>Has Own Vehicle?</label>
              <div className="flex items-center gap-4 mt-2.5">
                {['Yes', 'No'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={v === 'Yes'} {...register('hasVehicle')} className="accent-emerald-500" />
                    <span className="text-slate-300 text-sm">{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Emergency Contact Name</label>
              <input {...register('emergencyContactName')} className={inputCls} placeholder="Contact name" />
            </div>
            <div>
              <label className={labelCls}>Emergency Contact Phone</label>
              <input {...register('emergencyContactPhone')} className={inputCls} placeholder="9876543210" maxLength={10} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Additional Notes</label>
            <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Any relevant info about the volunteer..." />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register Volunteer'}
          </button>
        </form>
      </div>
    </div>
  );
}
