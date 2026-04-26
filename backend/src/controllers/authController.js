const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otpGenerator');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies, verifyRefreshToken } = require('../utils/tokenUtils');
const { sendOtpEmail } = require('../config/email');

async function signup(req, res) {
  try {
    const { fullName, email, password, city } = req.body;

    // Check if user exists and is verified
    const { data: existing } = await supabase.from('users').select('id, is_verified').eq('email', email).maybeSingle();
    if (existing && existing.is_verified) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (existing) {
      // Update existing unverified user
      await supabase.from('users').update({
        full_name: fullName,
        password_hash: passwordHash,
        city,
        otp_hash: otpHash,
        otp_expiry: otpExpiry,
      }).eq('id', existing.id);
    } else {
      await supabase.from('users').insert({
        full_name: fullName,
        email,
        password_hash: passwordHash,
        city,
        otp_hash: otpHash,
        otp_expiry: otpExpiry,
        is_verified: false,
      });
    }

    await sendOtpEmail(email, otp, fullName);

    res.json({ success: true, message: 'OTP sent to your email', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
}

async function verifyOtpHandler(req, res) {
  try {
    const { email, otp } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const isValid = await verifyOtp(otp, user.otp_hash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await supabase.from('users').update({
      is_verified: true,
      otp_hash: null,
      otp_expiry: null,
      refresh_token: refreshTokenHash,
    }).eq('id', user.id);

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: { id: user.id, fullName: user.full_name, email: user.email, city: user.city },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Already verified' });

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('users').update({ otp_hash: otpHash, otp_expiry: otpExpiry }).eq('id', user.id);
    await sendOtpEmail(email, otp, user.full_name);

    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    if (!user.is_verified) return res.status(403).json({ success: false, message: 'Please verify your email first' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await supabase.from('users').update({ refresh_token: refreshTokenHash }).eq('id', user.id);

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, fullName: user.full_name, email: user.email, city: user.city },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function logout(req, res) {
  try {
    if (req.user) {
      await supabase.from('users').update({ refresh_token: null }).eq('id', req.user.id);
    }
    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = verifyRefreshToken(token);
    const { data: user } = await supabase.from('users').select('*').eq('id', decoded.userId).maybeSingle();
    if (!user || !user.refresh_token) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const isValid = await bcrypt.compare(token, user.refresh_token);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);

    await supabase.from('users').update({ refresh_token: newRefreshHash }).eq('id', user.id);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, message: 'Token refreshed' });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token refresh failed' });
  }
}

async function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

async function updateProfile(req, res) {
  try {
    const { fullName, city } = req.body;
    const { data: user } = await supabase
      .from('users')
      .update({ full_name: fullName, city })
      .eq('id', req.user.id)
      .select('id, full_name, email, city, created_at')
      .maybeSingle();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
}

module.exports = { signup, verifyOtpHandler, resendOtp, login, logout, refreshToken, getMe, updateProfile };
