const CustomerActivityLog = require('../models/customerActivityLog.model');

/**
 * Middleware to log customer activities
 * Should be used after authentication middleware
 */
const logActivity = (action, options = {}) => {
  return async (req, res, next) => {
    // Only log for authenticated customers (not admins unless specified)
    if (!req.user || !req.user._id) {
      return next();
    }

    // Skip logging for admin/superadmin unless explicitly enabled
    const userRole = req.user.role?.name || req.user.role || '';
    const isAdmin = ['admin', 'superadmin'].includes(userRole.toLowerCase());
    
    if (isAdmin && !options.logAdminActions) {
      return next();
    }

    try {
      // Extract metadata from request
      const metadata = {
        method: req.method,
        path: req.path,
        ...options.metadata,
      };

      // Extract resource info if available
      let resourceId = null;
      let resourceType = null;
      
      if (req.params.id) {
        resourceId = req.params.id;
      } else if (req.params.productId) {
        resourceId = req.params.productId;
        resourceType = 'product';
      } else if (req.params.orderId) {
        resourceId = req.params.orderId;
        resourceType = 'order';
      }

      // Get description from options or generate from action
      let description = options.description;
      if (!description) {
        description = `${action.replace(/_/g, ' ')}`;
        if (resourceId) {
          description += ` (${resourceType || 'resource'}: ${resourceId})`;
        }
      }

      // Double-check user ID exists before creating log
      const userId = req.user._id || req.user.id;
      if (!userId) {
        return next();
      }

      // Create activity log (don't await to avoid blocking request)
      CustomerActivityLog.create({
        user: userId,
        action,
        description,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata,
        resourceId,
        resourceType,
      }).catch((err) => {
        // Log error but don't block the request
        console.error('Failed to log customer activity:', err);
      });
    } catch (error) {
      // Don't block the request if logging fails
      console.error('Error in activity logger middleware:', error);
    }

    next();
  };
};

/**
 * Helper function to log custom activities
 */
const logCustomActivity = async (userId, action, data = {}) => {
  // Validate userId before attempting to log
  if (!userId) {
    console.warn('Cannot log activity: userId is required');
    return;
  }

  try {
    await CustomerActivityLog.create({
      user: userId,
      action,
      description: data.description || action.replace(/_/g, ' '),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata || {},
      resourceId: data.resourceId,
      resourceType: data.resourceType,
    });
  } catch (error) {
    console.error('Failed to log custom activity:', error);
  }
};

module.exports = {
  logActivity,
  logCustomActivity,
};

