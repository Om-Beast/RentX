import mongoose from "mongoose";
import Notification, {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from "../../models/Notification.js";

class ServiceError extends Error {
 
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name       = "ServiceError";
    this.code       = code;
    this.statusCode = statusCode;
  }
}
const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR : "VALIDATION_ERROR",
  NOT_FOUND        : "NOT_FOUND",
  FORBIDDEN        : "FORBIDDEN",
  INTERNAL_ERROR   : "INTERNAL_ERROR",
});

const VALID_TYPES      = new Set(Object.values(NOTIFICATION_TYPES));
const VALID_PRIORITIES = new Set(Object.values(NOTIFICATION_PRIORITIES));

const _isValidObjectId = (id) =>
  Boolean(id) && mongoose.Types.ObjectId.isValid(String(id));

const _assertUserId = (userId) => {
  if (!_isValidObjectId(userId)) {
    throw new ServiceError(
      "A valid user ID is required.",
      ERROR_CODES.VALIDATION_ERROR,
      400
    );
  }
};

const _validateCreatePayload = (payload) => {
  const errors = [];
  if (!_isValidObjectId(payload.user)) {
    errors.push("'user' must be a valid ObjectId.");
  }
  if (!payload.type || !VALID_TYPES.has(payload.type)) {
    errors.push(
      `'type' must be one of: ${[...VALID_TYPES].join(", ")}.`
    );
  }
  if (!payload.title || typeof payload.title !== "string" || !payload.title.trim()) {
    errors.push("'title' is required and must be a non-empty string.");
  }
  if (!payload.message || typeof payload.message !== "string" || !payload.message.trim()) {
    errors.push("'message' is required and must be a non-empty string.");
  }
  if (
    payload.priority !== undefined &&
    !VALID_PRIORITIES.has(payload.priority)
  ) {
    errors.push(
      `'priority' must be one of: ${[...VALID_PRIORITIES].join(", ")}.`
    );
  }
  if (
    payload.metadata !== undefined &&
    (typeof payload.metadata !== "object" ||
      Array.isArray(payload.metadata) ||
      payload.metadata === null)
  ) {
    errors.push("'metadata' must be a plain object.");
  }
  if (errors.length > 0) {
    throw new ServiceError(
      errors.join(" "),
      ERROR_CODES.VALIDATION_ERROR,
      400
    );
  }
};

class NotificationService {

  static async createNotification({ user, type, title, message, priority, metadata } = {}) {
    _validateCreatePayload({ user, type, title, message, priority, metadata });
    try {
      const notification = await Notification.create({
        user,
        type,
        title,
        message,
        ...(priority !== undefined && { priority }),
        ...(metadata !== undefined && { metadata }),
      });
  
      return notification.toObject();
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        `Failed to create notification: ${error.message}`,
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  }

  static async getMyNotifications(userId, { page, limit, unreadOnly } = {}) {
    _assertUserId(userId);
    try {
      const result = await Notification.getPaginated(userId, {
        page,
        limit,
        unreadOnly,
      });
      return result;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        `Failed to fetch notifications: ${error.message}`,
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  }
  
  static async getUnreadCount(userId) {
    _assertUserId(userId);
    try {
     
      const count = await Notification.getUnreadCount(userId);
      return count;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        `Failed to fetch unread count: ${error.message}`,
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  }

  static async markAllNotificationsRead(userId) {
    _assertUserId(userId);
    try {
      const result = await Notification.markAllAsRead(userId);
      
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        `Failed to mark all notifications as read: ${error.message}`,
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  }
 
  static async markNotificationRead(userId, notificationId) {
    _assertUserId(userId);
    if (!_isValidObjectId(notificationId)) {
      throw new ServiceError(
        "A valid notification ID is required.",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new ServiceError(
          "Notification not found.",
          ERROR_CODES.NOT_FOUND,
          404
        );
      }
      if (notification.user.toString() !== userId.toString()) {
        throw new ServiceError(
          "You do not have permission to modify this notification.",
          ERROR_CODES.FORBIDDEN,
          403
        );
      }
      if (notification.isRead) {
        return notification.toObject();
      }
      await notification.markAsRead();
      return notification.toObject();
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        `Failed to mark notification as read: ${error.message}`,
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  }
}
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, ERROR_CODES, ServiceError };
export default NotificationService;