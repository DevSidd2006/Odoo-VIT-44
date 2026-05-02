import nodemailer from 'nodemailer';

/**
 * Transporter configuration using environment variables.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email using the configured transporter.
 * 
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text content.
 * @param {string} html - HTML content.
 */
export async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Appointment App'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // In development, we might not want to throw if SMTP is not configured
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
