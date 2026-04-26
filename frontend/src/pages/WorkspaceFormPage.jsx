import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import api from '../app/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  ngoName: yup.string().min(3, 'Min 3 characters').required('NGO name is required'),
  description: yup.string().min(20, 'Min 20 characters').required('Description is required'),
  ngoType: yup.string().required('NGO type is required'),
  city: yup.string().required('City is required'),
  contactEmail: yup.string().email('Invalid email').required('Contact email is required'),
  contactPhone: yup.string().matches(/^\d{10}$/, 'Must be 10 digits').required('Phone is required'),
  password: yup.string().min(4, 'Min 4 characters').required('Workspace password is required'),
});

const NGO_TYPES = ['Education', 'Health', 'Environment', 'Disaster Relief', 'Poverty Alleviation', 'Women Empowerment', 'Other'];

export default function WorkspaceFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(data) {
    setLoading(true);
    try {
      await api.post('/workspaces', data);
      toast.success('Workspace created!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";
  const errorCls = "text-red-400 text-xs mt-1";

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-900/50 rounded-xl flex items-center justify-center">
          <Building2 size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Create NGO Workspace</h1>
          <p className="text-slate-400 text-sm">Set up a new workspace for your NGO</p>
        </div>
      </div>

      <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>NGO Name *</label>
              <input {...register('ngoName')} className={inputCls} placeholder="Hope Foundation" />
              {errors.ngoName && <p className={errorCls}>{errors.ngoName.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description *</label>
              <textarea {...register('description')} rows={3} className={inputCls} placeholder="Describe your NGO's mission..." />
              {errors.description && <p className={errorCls}>{errors.description.message}</p>}
            </div>
            <div>
              <label className={labelCls}>NGO Type *</label>
              <select {...register('ngoType')} className={inputCls}>
                <option value="">Select type...</option>
                {NGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.ngoType && <p className={errorCls}>{errors.ngoType.message}</p>}
            </div>
            <div>
              <label className={labelCls}>City / Region *</label>
              <input {...register('city')} className={inputCls} placeholder="Mumbai" />
              {errors.city && <p className={errorCls}>{errors.city.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Full Address</label>
              <textarea {...register('address')} rows={2} className={inputCls} placeholder="Street address..." />
            </div>
            <div>
              <label className={labelCls}>Contact Email *</label>
              <input {...register('contactEmail')} type="email" className={inputCls} placeholder="contact@ngo.org" />
              {errors.contactEmail && <p className={errorCls}>{errors.contactEmail.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Contact Phone *</label>
              <input {...register('contactPhone')} className={inputCls} placeholder="9876543210" maxLength={10} />
              {errors.contactPhone && <p className={errorCls}>{errors.contactPhone.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Workspace Password *</label>
              <input {...register('password')} type="password" className={inputCls} placeholder="Members need this to join" />
              {errors.password && <p className={errorCls}>{errors.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Website URL</label>
              <input {...register('websiteUrl')} className={inputCls} placeholder="https://ngo.org" />
            </div>
            <div>
              <label className={labelCls}>Founded Year</label>
              <input {...register('foundedYear')} type="number" className={inputCls} placeholder="2020" min="1900" max={new Date().getFullYear()} />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => navigate('/home')}
              className="flex-1 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white py-3 rounded-xl font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
