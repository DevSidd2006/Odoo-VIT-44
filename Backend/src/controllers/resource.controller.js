import { v4 as uuidv4 } from 'uuid';
import { store } from '../store/index.js';

/**
 * Builds today's date at midnight for date-only comparisons.
 *
 * @returns {Date} Today at 00:00:00.000
 */
function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Returns whether user can access a resource.
 *
 * @param {object} user - Authenticated user token payload.
 * @param {object} resource - Resource entity.
 * @returns {boolean} Access result.
 */
function canAccessResource(user, resource) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'organiser') {
    return resource.organiserId === user.userId;
  }

  return false;
}

/**
 * Returns whether all linked resource ids exist.
 *
 * @param {string[]} linkedResourceIds - Linked resource IDs.
 * @returns {boolean} Validation result.
 */
function areLinkedResourceIdsValid(linkedResourceIds) {
  return linkedResourceIds.every((resourceId) =>
    store.resources.some((resource) => resource.id === resourceId),
  );
}

/**
 * Creates a new resource.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function createResource(req, res) {
  try {
    const { name, capacity, linkedResourceIds } = req.body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'name is required',
      });
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'capacity must be a positive integer',
      });
    }

    if (linkedResourceIds !== undefined && !Array.isArray(linkedResourceIds)) {
      return res.status(400).json({
        success: false,
        message: 'linkedResourceIds must be an array',
      });
    }

    const safeLinkedResourceIds = linkedResourceIds ?? [];

    if (!areLinkedResourceIdsValid(safeLinkedResourceIds)) {
      return res.status(400).json({
        success: false,
        message: 'linkedResourceIds must contain valid resource IDs',
      });
    }

    const resource = {
      id: uuidv4(),
      organiserId: req.user.userId,
      name: name.trim(),
      capacity,
      linkedResourceIds: safeLinkedResourceIds,
      createdAt: new Date(),
    };

    store.resources.push(resource);

    return res.status(201).json({
      success: true,
      resource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns resources by requester role.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function listResources(req, res) {
  try {
    if (!['organiser', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    const { search } = req.query;

    let resources;
    if (req.user.role === 'admin') {
      resources = [...store.resources];
    } else {
      resources = store.resources.filter((resource) => resource.organiserId === req.user.userId);
    }

    if (search !== undefined && String(search).trim().length > 0) {
      const keyword = String(search).trim().toLowerCase();
      resources = resources.filter((resource) => resource.name.toLowerCase().includes(keyword));
    }

    return res.status(200).json({
      success: true,
      total: resources.length,
      resources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns one resource by id.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getResourceById(req, res) {
  try {
    const resource = store.resources.find((item) => item.id === req.params.id);

    if (!resource || !canAccessResource(req.user, resource)) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    return res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates a resource by id.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function updateResource(req, res) {
  try {
    const resource = store.resources.find((item) => item.id === req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (!canAccessResource(req.user, resource)) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const { name, capacity, linkedResourceIds } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'name must be a non-empty string',
        });
      }
      resource.name = name.trim();
    }

    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'capacity must be a positive integer',
        });
      }
      resource.capacity = capacity;
    }

    if (linkedResourceIds !== undefined) {
      if (!Array.isArray(linkedResourceIds)) {
        return res.status(400).json({
          success: false,
          message: 'linkedResourceIds must be an array',
        });
      }

      if (!areLinkedResourceIdsValid(linkedResourceIds)) {
        return res.status(400).json({
          success: false,
          message: 'linkedResourceIds must contain valid resource IDs',
        });
      }

      resource.linkedResourceIds = linkedResourceIds;
    }

    return res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Deletes a resource after active booking checks and reference cleanup.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function deleteResource(req, res) {
  try {
    const resource = store.resources.find((item) => item.id === req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (!canAccessResource(req.user, resource)) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const today = startOfToday();
    const inUse = store.bookings.some((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        booking.resourceId === resource.id && bookingDate >= today && booking.status !== 'cancelled'
      );
    });

    if (inUse) {
      return res.status(409).json({
        success: false,
        message: 'Resource in use by active bookings',
      });
    }

    store.resources = store.resources.filter((item) => item.id !== resource.id);

    // Remove this resource from linked resource relationships.
    store.resources = store.resources.map((item) => ({
      ...item,
      linkedResourceIds: Array.isArray(item.linkedResourceIds)
        ? item.linkedResourceIds.filter((linkedId) => linkedId !== resource.id)
        : [],
    }));

    // Clean up any appointment type fields that may reference this resource.
    store.appointmentTypes = store.appointmentTypes.map((appointmentType) => {
      const nextValue = { ...appointmentType };

      if (Array.isArray(nextValue.resourceIds)) {
        nextValue.resourceIds = nextValue.resourceIds.filter((linkedId) => linkedId !== resource.id);
      }

      if (Array.isArray(nextValue.linkedResourceIds)) {
        nextValue.linkedResourceIds = nextValue.linkedResourceIds.filter(
          (linkedId) => linkedId !== resource.id,
        );
      }

      if (nextValue.resourceId === resource.id) {
        nextValue.resourceId = null;
      }

      return nextValue;
    });

    return res.status(200).json({
      success: true,
      message: 'Resource deleted',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
