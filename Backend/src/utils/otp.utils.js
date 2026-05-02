import { v4 as uuidv4 } from 'uuid';
import { store } from '../store/index.js';

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
 * Stores an OTP for a specific email and type with 10-minute expiry.
 *
 * @param {string} email - Email associated with the OTP.
 * @param {string} otp - OTP value.
 * @param {string} type - OTP purpose/type.
 * @returns {object} Stored OTP record.
 */
export function storeOTP(email, otp, type) {
  const otpRecord = {
    id: uuidv4(),
    email,
    otp,
    type,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };

  store.otps.push(otpRecord);
  console.log(`OTP for ${email}: ${otp}`);

  return otpRecord;
}

/**
 * Verifies an OTP and removes it from the store if valid.
 *
 * @param {string} email - Email associated with the OTP.
 * @param {string} otp - OTP value.
 * @param {string} type - OTP purpose/type.
 * @returns {boolean} True if OTP is valid, otherwise false.
 */
export function verifyOTP(email, otp, type) {
  const index = store.otps.findIndex(
    (item) =>
      item.email === email &&
      item.otp === otp &&
      item.type === type &&
      item.expiresAt > Date.now(),
  );

  if (index === -1) {
    return false;
  }

  store.otps.splice(index, 1);
  return true;
}
