const bcrypt = require('bcryptjs');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

module.exports = { generateOtp, hashOtp, verifyOtp };
