import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token.
 *
 * @param {object} payload - Data to encode in the token.
 * @returns {string} Signed JWT token.
 */
export function generateToken(payload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token - JWT token to verify.
 * @returns {object | string} Decoded token payload.
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, secret);
}
