import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { store } from '../store/index.js';
import { generateToken } from '../utils/jwt.utils.js';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp.utils.js';
import { sendEmail } from '../utils/email.utils.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Returns a 400 response if request validation failed.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {boolean} True when validation failed, otherwise false.
 */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return false;
  }

  return res.status(400).json({
    success: false,
    message: errors.array()[0].msg,
  });
}

/**
 * Handles user signup and sends signup OTP.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response | void>} HTTP response.
 */
export async function signup(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { fullName, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = store.users.find((user) => user.email === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
    };

    store.users.push(user);

    const otp = generateOTP();
    storeOTP(user.email, otp, 'signup');

    await sendEmail(
      user.email,
      'Verify your account',
      `Your OTP is: ${otp}`,
      `<h1>Welcome to ${process.env.APP_NAME || 'MediBook'}</h1><p>Your verification code is: <strong>${otp}</strong></p>`
    );

    return res.status(201).json({
      success: true,
      message: 'OTP sent to email',
      userId: user.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Verifies a signup or reset OTP.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response | void} HTTP response.
 */
export function verifyOtp(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, otp, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = store.users.find((item) => item.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValid = verifyOTP(normalizedEmail, otp, type);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    if (type === 'signup') {
      user.isVerified = true;
    }

    return res.status(200).json({
      success: true,
      message: 'Verified successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Authenticates a user and returns JWT token.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response | void>} HTTP response.
 */
export async function login(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = store.users.find((item) => item.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Sends reset OTP if the account exists.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response | void} HTTP response.
 */
export async function forgotPassword(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = store.users.find((item) => item.email === normalizedEmail);
    if (user) {
      const otp = generateOTP();
      storeOTP(normalizedEmail, otp, 'reset');

      await sendEmail(
        normalizedEmail,
        'Reset your password',
        `Your reset OTP is: ${otp}`,
        `<p>You requested a password reset. Your OTP is: <strong>${otp}</strong></p>`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Reset OTP sent if email exists',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Resets user password using reset OTP.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response | void>} HTTP response.
 */
export async function resetPassword(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, and special character',
      });
    }

    const user = store.users.find((item) => item.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValid = verifyOTP(normalizedEmail, otp, 'reset');
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Resends OTP for the given email and type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response | void} HTTP response.
 */
export async function resendOtp(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    store.otps = store.otps.filter(
      (item) => !(item.email === normalizedEmail && item.type === type),
    );

    const otp = generateOTP();
    storeOTP(normalizedEmail, otp, type);

    await sendEmail(
      normalizedEmail,
      'Your new OTP',
      `Your new OTP is: ${otp}`,
      `<p>Your new verification code is: <strong>${otp}</strong></p>`
    );

    return res.status(200).json({
      success: true,
      message: 'OTP resent',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
