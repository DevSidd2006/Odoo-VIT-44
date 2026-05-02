import { store } from '../store/index.js';

const ALLOWED_ROLES = ['customer', 'organiser', 'admin'];

/**
 * Removes sensitive fields from user object.
 *
 * @param {object} user - User object from in-memory store.
 * @returns {object} Safe user payload.
 */
function toSafeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * Returns all users with optional filters.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getAllUsers(req, res) {
  try {
    const { role, isActive, search } = req.query;

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be one of: customer, organiser, admin',
      });
    }

    if (isActive !== undefined && !['true', 'false'].includes(String(isActive))) {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false',
      });
    }

    let users = [...store.users];

    if (role !== undefined) {
      users = users.filter((user) => user.role === role);
    }

    if (isActive !== undefined) {
      const isActiveBool = String(isActive) === 'true';
      users = users.filter((user) => user.isActive === isActiveBool);
    }

    if (search !== undefined && String(search).trim().length > 0) {
      const keyword = String(search).trim().toLowerCase();
      users = users.filter((user) => {
        const fullName = String(user.fullName || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        return fullName.includes(keyword) || email.includes(keyword);
      });
    }

    const safeUsers = users.map((user) => toSafeUser(user));

    return res.status(200).json({
      success: true,
      total: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates a user's account active status.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
      });
    }

    const user = store.users.find((item) => item.id === id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.id === req.user.userId && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    user.isActive = isActive;

    return res.status(200).json({
      success: true,
      message: 'Account status updated',
      user: toSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates a user's role.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be one of: customer, organiser, admin',
      });
    }

    const user = store.users.find((item) => item.id === id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    user.role = role;

    return res.status(200).json({
      success: true,
      message: 'Role updated',
      user: toSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
