const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendWelcomeEmail(to, name) {
  const mailOptions = {
    from: `"VolunteerHub" <${process.env.MAIL_USER}>`,
    to,
    subject: '🎉 Welcome to VolunteerHub – Registration Successful!',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">VolunteerHub</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Making a difference, together.</p>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1e293b;">Welcome, ${name}! 🙌</h2>
          <p style="color: #64748b; line-height: 1.6;">
            Thank you for registering as a volunteer. Your application has been received and is currently under review.
          </p>
          <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="color: #1e293b; margin: 0; font-weight: 600;">What happens next?</p>
            <ul style="color: #64748b; margin-top: 8px; padding-left: 20px;">
              <li>Our admin team will review your profile</li>
              <li>You'll receive an email once your status is updated</li>
              <li>Once approved, you can start joining events!</li>
            </ul>
          </div>
          <p style="color: #64748b;">Questions? Reply to this email and we'll help you out.</p>
          <p style="color: #1e293b; font-weight: 600;">— The VolunteerHub Team</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f9fafb;">
          <p style="color: #94a3b8; font-size: 12px;">© 2024 VolunteerHub. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

async function sendStatusEmail(to, name, status) {
  const statusMap = {
    approved: { emoji: '✅', color: '#16a34a', message: 'Your volunteer application has been approved! You can now join events and start making a difference.' },
    rejected: { emoji: '❌', color: '#dc2626', message: 'After careful review, we were unable to approve your application at this time. You may re-apply in the future.' }
  };

  const { emoji, color, message } = statusMap[status] || {};

  const mailOptions = {
    from: `"VolunteerHub" <${process.env.MAIL_USER}>`,
    to,
    subject: `${emoji} Your VolunteerHub Application Status Update`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">VolunteerHub</h1>
        </div>
        <div style="padding: 40px; background: white;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #64748b; line-height: 1.6;">${message}</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: ${color}; color: white; padding: 10px 24px; border-radius: 999px; font-weight: 600; font-size: 16px;">
              Status: ${status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Status email error:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendStatusEmail };