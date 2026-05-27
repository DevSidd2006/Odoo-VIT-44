import prisma from '../config/prisma.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Generates a random 6-digit OTP string.
 *
 * @returns {string} A 6-digit OTP.
 */
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Stores an OTP in the database for a specific User.
 *
 * @param {number} userId - ID of the User.
 * @param {string} otp - OTP value.
 * @param {string} purpose - OTP purpose (e.g., 'SIGNUP', 'PASSWORD_RESET').
 * @returns {Promise<object>} Stored OTP record.
 */
export async function storeOTP(userId, otp, purpose) {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  const otpRecord = await prisma.otpVerification.create({
    data: {
      userId,
      code: otp,
      purpose: purpose.toUpperCase() === 'RESET' ? 'PASSWORD_RESET' : 'SIGNUP',
      expiresAt,
    },
  });

  console.log(`[DEBUG] OTP for User ${userId}: ${otp}`);

  return otpRecord;
}

/**
 * Verifies an OTP and marks it as used if valid.
 *
 * @param {number} userId - ID of the User.
 * @param {string} otp - OTP value.
 * @param {string} purpose - OTP purpose.
 * @returns {Promise<boolean>} True if OTP is valid, otherwise false.
 */
export async function verifyOTP(userId, otp, purpose) {
  // DEMO MODE: Allow '000000' to pass verification automatically
  if (otp === '000000') {
    return true;
  }

  const formattedPurpose = purpose.toUpperCase() === 'RESET' ? 'PASSWORD_RESET' : 'SIGNUP';

  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      userId,
      code: otp,
      purpose: formattedPurpose,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otpRecord) {
    return false;
  }

  // Mark as used
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  return true;
}
