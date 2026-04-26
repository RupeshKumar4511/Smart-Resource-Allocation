const { Resend } = require('resend');
require('dotenv').config()

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOtpEmail(toEmail, otp, fullName) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@smartresource.app',
      to: toEmail,
      subject: 'Verify your Smart Resource account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Smart Resource Allocation</h2>
          <p>Hello ${fullName},</p>
          <p>Your verification code is:</p>
          <div style="background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #059669;">${otp}</span>
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log("email sent successfully")
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

module.exports = { sendOtpEmail };
