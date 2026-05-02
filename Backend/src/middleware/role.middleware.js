/**
 * Creates a role-based authorization middleware.
 *
 * @param {...string} roles - Allowed user roles.
 * @returns {import('express').RequestHandler} Authorization middleware.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    return next();
  };
}
