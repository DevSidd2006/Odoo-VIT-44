import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.utils.js';
import { generateOTP, storeOTP, verifyOTP } from '../utils/otp.utils.js';

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
 */
export async function signup(req, res) {
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { fullName, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // 1. Check if user already exists
    const existingUser = await prisma.authIdentity.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // 2. Ensure 'CUSTOMER' role exists
    let role = await prisma.role.findUnique({
      where: { roleName: 'CUSTOMER' },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          roleName: 'CUSTOMER',
          description: 'Standard customer user',
        },
      });
    }

    // 3. Create AuthIdentity and UserProfile in a transaction
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.authIdentity.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        roleId: role.id,
        userProfile: {
          create: {
            fullName,
          },
        },
      },
    });

    // 4. Generate and store OTP
    const otp = generateOTP();
    await storeOTP(user.id, otp, 'signup');

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
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, otp, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.authIdentity.findUnique({
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
      await prisma.authIdentity.update({
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
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.authIdentity.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: true,
        userProfile: true,
      },
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

    // Update last login
    await prisma.authIdentity.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.roleName,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.userProfile?.fullName,
        email: user.email,
        role: user.role.roleName,
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
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.authIdentity.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const otp = generateOTP();
      await storeOTP(user.id, otp, 'reset');
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
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and special character',
      });
    }

    const user = await prisma.authIdentity.findUnique({
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
    await prisma.authIdentity.update({
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
  if (handleValidationErrors(req, res)) {
    return;
  }

  try {
    const { email, type } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.authIdentity.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const formattedPurpose = type.toUpperCase() === 'RESET' ? 'PASSWORD_RESET' : 'SIGNUP';

    // Delete existing unused OTPs of this type for the user
    await prisma.otpVerification.deleteMany({
      where: {
        authIdentityId: user.id,
        purpose: formattedPurpose,
        isUsed: false,
      },
    });

    const otp = generateOTP();
    await storeOTP(user.id, otp, type);

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
