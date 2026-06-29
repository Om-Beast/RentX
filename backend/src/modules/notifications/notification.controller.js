
import NotificationService, { ServiceError } from "./notification.service.js";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json({
        success : false,
        error   : error.code,
        message : error.message,
      });
    }

   
    console.error("[NotificationController] Unhandled error:", error);

    return res.status(500).json({
      success : false,
      error   : "INTERNAL_ERROR",
      message : "An unexpected error occurred. Please try again later.",
    });
  });
};


const getMyNotificationsController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page       = parseInt(req.query.page, 10)  || undefined;
  const limit      = parseInt(req.query.limit, 10) || undefined;
  const unreadOnly = req.query.unreadOnly === "true";

  const result = await NotificationService.getMyNotifications(userId, {
    page,
    limit,
    unreadOnly,
  });

  return res.status(200).json({
    success       : true,
    notifications : result.data,
    pagination    : {
      total      : result.total,
      page       : result.page,
      totalPages : result.totalPages,
    },
  });
});


const getUnreadCountController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await NotificationService.getUnreadCount(userId);

  return res.status(200).json({
    success : true,
    count,
  });
});


const markAllNotificationsReadController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await NotificationService.markAllNotificationsRead(userId);

  return res.status(200).json({
    success : true,
    message : "All notifications marked as read",
  });
});


const markNotificationReadController = asyncHandler(async (req, res) => {
  const userId         = req.user._id;
  const notificationId = req.params.notificationId;

  const notification = await NotificationService.markNotificationRead(
    userId,
    notificationId
  );

  return res.status(200).json({
    success : true,
    notification,
  });
});


export {
  getMyNotificationsController,
  getUnreadCountController,
  markAllNotificationsReadController,
  markNotificationReadController,
};