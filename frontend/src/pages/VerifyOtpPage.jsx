import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../features/auth/authSlice';
import { Mail, RefreshCw } from 'lucide-react';
import api from '../app/api';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/signup');
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      dispatch(setUser(res.data.user));
      toast.success('Email verified!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('OTP resent!');
      setCanResend(false);
      setResendCountdown(30);
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-navy-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm mb-2">We sent a 6-digit code to</p>
          <p className="text-emerald-400 font-medium mb-8">{email}</p>

          <div className="flex gap-3 justify-center mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-navy-900 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            ))}
          </div>

          <button onClick={handleVerify} disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mb-4">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify Email'}
          </button>

          <button onClick={handleResend} disabled={!canResend}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-slate-400 hover:text-emerald-400 disabled:opacity-50 transition-colors">
            <RefreshCw size={14} />
            {canResend ? 'Resend OTP' : `Resend in ${resendCountdown}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
