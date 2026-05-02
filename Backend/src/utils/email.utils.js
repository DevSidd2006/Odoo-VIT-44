import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email using the configured SMTP transporter.
 *
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text body.
 * @param {string} html - HTML body.
 * @returns {Promise<void>}
 */
export async function sendEmail(to, subject, text, html) {
  // Guard: Don't attempt to send if credentials are still placeholders
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) {
    console.log('[Email Skipped]: SMTP credentials not configured.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Appointly'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('[Email Sent]: %s', info.messageId);
  } catch (error) {
    console.error('[Email Error]:', error);
    // Note: In local development, we don't throw to avoid crashing the flow if SMTP is not configured
  }
}
