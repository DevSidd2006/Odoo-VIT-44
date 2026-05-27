import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.utils.js';
import { storeOTP, verifyOTP } from '../utils/otp.utils.js';
import { sendEmail } from '../utils/email.utils.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Returns a 400 response if request validation failed.
 */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  return res.status(400).json({
    success: false,
    message: errors.array()[0].msg,
  });
}

/**
 * Handles user signup and sends signup OTP.
 */
export async function signup(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { fullName, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // 2. Create User (One table, high performance!)
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        fullName,
        role: userRole,
        isVerified: false, // User must verify via OTP
      },
    });

    // 3. Generate and store OTP (DEMO MODE: Static OTP)
    const otp = '000000'; 
    await storeOTP(user.id, otp, 'signup');

    await sendEmail(
      user.email,
      'Verify your account',
      `Your Appointly OTP is: ${otp}`,
      `<h1>Welcome to Appointly</h1><p>Your verification code is: <strong>${otp}</strong></p>`
    );

    return res.status(201).json({
      success: true,
      message: 'OTP sent to email',
      userId: user.id,
    });
  } catch (error) {
    console.error('[Signup Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Verifies a signup or reset OTP.
 */
export async function verifyOtp(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { email, otp, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValid = await verifyOTP(user.id, otp, type);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    if (type === 'signup') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verified successfully',
    });
  } catch (error) {
    console.error('[VerifyOtp Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Authenticates a user and returns JWT token.
 */
export async function login(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Sends reset OTP if the account exists.
 */
export async function forgotPassword(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const otp = '000000'; 
      await storeOTP(user.id, otp, 'reset');

      await sendEmail(
        normalizedEmail,
        'Reset your password',
        `Your Appointly reset OTP is: ${otp}`,
        `<p>You requested a password reset. Your OTP is: <strong>${otp}</strong></p>`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Reset OTP sent if email exists',
    });
  } catch (error) {
    console.error('[ForgotPassword Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Resets user password using reset OTP.
 */
export async function resetPassword(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and special character',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValid = await verifyOTP(user.id, otp, 'reset');
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('[ResetPassword Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Resends OTP for the given email and type.
 */
export async function resendOtp(req, res) {
  if (handleValidationErrors(req, res)) return;

  try {
    const { email, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const formattedPurpose = type.toUpperCase() === 'RESET' ? 'PASSWORD_RESET' : 'SIGNUP';

    // Delete existing unused OTPs
    await prisma.otpVerification.deleteMany({
      where: {
        userId: user.id,
        purpose: formattedPurpose,
        isUsed: false,
      },
    });

    const otp = '000000'; 
    await storeOTP(user.id, otp, type);

    await sendEmail(
      normalizedEmail,
      'Your Appointly OTP',
      `Your new OTP is: ${otp}`,
      `<p>Your new verification code is: <strong>${otp}</strong></p>`
    );

    return res.status(200).json({
      success: true,
      message: 'OTP resent',
    });
  } catch (error) {
    console.error('[ResendOtp Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
