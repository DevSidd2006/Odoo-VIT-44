import { Router } from 'express';
import { body } from 'express-validator';
import {
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from '../controllers/auth.controller.js';

const router = Router();

const passwordRule = body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[a-z]/)
  .withMessage('Password must include at least one lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password must include at least one uppercase letter')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must include at least one special character');

const newPasswordRule = body('newPassword')
  .trim()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[a-z]/)
  .withMessage('Password must include at least one lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password must include at least one uppercase letter')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must include at least one special character');

router.post(
  '/signup',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    passwordRule,
  ],
  signup,
);

router.post(
  '/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
    body('type')
      .trim()
      .isIn(['signup', 'reset'])
      .withMessage('Type must be signup or reset'),
  ],
  verifyOtp,
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
  ],
  login,
);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  forgotPassword,
);

router.post(
  '/reset-password',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
    newPasswordRule,
  ],
  resetPassword,
);

router.post(
  '/resend-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('type')
      .trim()
      .isIn(['signup', 'reset'])
      .withMessage('Type must be signup or reset'),
  ],
  resendOtp,
);

export default router;
