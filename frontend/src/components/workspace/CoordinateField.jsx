import { useState } from 'react';
import { MapPin, Lock, Pencil, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../app/api';

export default function CoordinateField({ city, landmark, onDetected }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [autoLat, setAutoLat] = useState('');
  const [autoLng, setAutoLng] = useState('');
  const [manual, setManual] = useState(false);

  async function detect() {
    if (!city) return;
    setStatus('loading');
    try {
      const res = await api.get(`/geocode?city=${encodeURIComponent(city)}&landmark=${encodeURIComponent(landmark || '')}`);
      if (res.data.success) {
        setAutoLat(res.data.latitude.toString());
        setAutoLng(res.data.longitude.toString());
        setResolvedAddress(res.data.resolvedAddress);
        setStatus('success');
        setManual(false);
        onDetected?.({ latitude: res.data.latitude, longitude: res.data.longitude, resolvedAddress: res.data.resolvedAddress, source: 'auto' });
      } else {
        setStatus('error');
        setManual(true);
      }
    } catch {
      setStatus('error');
      setManual(true);
    }
  }

  function handleManualChange(field, value) {
    if (field === 'lat') setManualLat(value);
    else setManualLng(value);
    onDetected?.({ latitude: parseFloat(manualLat) || 0, longitude: parseFloat(manualLng) || 0, source: 'manual' });
  }

  const lat = manual ? manualLat : autoLat;
  const lng = manual ? manualLng : autoLng;

  return (
    <div className="space-y-3">
      <button type="button" onClick={detect} disabled={status === 'loading' || !city}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
        {status === 'loading' ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : <MapPin size={15} />}
        Auto-detect Coordinates
      </button>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle size={13} /> Coordinates detected
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-yellow-400 text-xs">
          <AlertTriangle size={13} /> Could not auto-detect. You may enter manually.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {['lat', 'lng'].map((f) => (
          <div key={f}>
            <label className="block text-xs font-medium text-slate-400 mb-1 items-center gap-1">
              {!manual && (lat || lng) ? <Lock size={10} className="text-slate-500" /> : <Pencil size={10} className="text-slate-500" />}
              {f === 'lat' ? 'Latitude' : 'Longitude'}
            </label>
            <input
              value={f === 'lat' ? lat : lng}
              onChange={e => manual ? handleManualChange(f, e.target.value) : undefined}
              readOnly={!manual}
              className={`w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${!manual && (lat || lng) ? 'bg-slate-900 border-slate-700 text-slate-400 cursor-default' : 'bg-navy-900 border-slate-600 focus:border-emerald-500'}`}
              placeholder={f === 'lat' ? '28.6139' : '77.2090'}
            />
          </div>
        ))}
      </div>

      {resolvedAddress && (
        <p className="text-slate-500 text-xs">Resolved: {resolvedAddress}</p>
      )}
    </div>
  );
}
