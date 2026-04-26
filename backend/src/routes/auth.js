const express = require('express');
const router = express.Router();
const { signup, verifyOtpHandler, resendOtp, login, logout, refreshToken, getMe, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/verify-otp', verifyOtpHandler);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
