import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  getMyNotificationsController,
  getUnreadCountController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "./notification.controller.js";

const router = Router();

router.use(protect);

router.get("/my-notifications", getMyNotificationsController);

router.get("/unread-count", getUnreadCountController);

router.patch("/read-all", markAllNotificationsReadController);

router.patch("/:id/read", markNotificationReadController);

export default router;