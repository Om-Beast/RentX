/**
 * Background Jobs — scheduled tasks using node-cron.
 *
 * Why background jobs?
 * Some work cannot happen in a request-response cycle:
 * - Expiring stale bookings requires knowing about ALL bookings, not just the current request
 * - Reminders need to fire at a specific time regardless of user activity
 *
 * Why node-cron (not BullMQ/Redis)?
 * At portfolio scale, in-process cron jobs are sufficient and simpler.
 * For true production (multiple app instances), you'd add a distributed
 * lock (e.g. via Redis) to prevent multiple instances running the same job.
 * That architectural extension is documented in SYSTEM_DESIGN.md.
 *
 * Jobs:
 * 1. expireStaleHolds   — Every 5 min: expire pending_payment bookings > 30 min old
 * 2. pickupReminders    — Daily 8am: notify customers of tomorrow's pickup
 * 3. returnReminders    — Daily 8am: notify customers of tomorrow's return
 */

import cron from "node-cron";
import Booking, { BOOKING_STATUSES } from "../models/Booking.js";
import NotificationService from "../modules/notifications/notification.service.js";
import logger from "../utils/logger.js";

/**
 * Job 1: Expire stale booking holds.
 *
 * When a customer creates a booking but doesn't pay within 30 minutes,
 * the hold should be released so other customers can book the vehicle.
 *
 * Runs every 5 minutes.
 */
const expireStaleHolds = async () => {
  try {
    const cutoff = new Date(); // expiresAt has already passed

    const result = await Booking.updateMany(
      {
        bookingStatus: BOOKING_STATUSES.PENDING_PAYMENT,
        expiresAt: { $lte: cutoff },
      },
      {
        $set: { bookingStatus: BOOKING_STATUSES.EXPIRED },
        $push: {
          timeline: {
            eventType: "BOOKING_EXPIRED",
            note: "Booking expired — payment not received within 30 minutes",
            createdAt: new Date(),
          },
        },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info("ExpireHoldsJob", "HOLDS_EXPIRED", {
        expiredCount: result.modifiedCount,
      });
    }
  } catch (err) {
    logger.error("ExpireHoldsJob", "JOB_FAILED", {}, err);
  }
};

/**
 * Job 2 & 3: Send pickup and return reminders.
 *
 * Finds bookings for tomorrow and sends notifications.
 * Runs once daily at 8am.
 */
const sendReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const dayEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Pickup reminders — bookings starting tomorrow
    const pickupBookings = await Booking.find({
      bookingStatus: BOOKING_STATUSES.CONFIRMED,
      startDate: { $gte: dayStart, $lte: dayEnd },
    }).populate("vehicle", "name brand city").lean();

    for (const booking of pickupBookings) {
      try {
        await NotificationService.createNotification({
          user: booking.user,
          type: "SYSTEM",
          title: "🚗 Pickup Reminder",
          message: `Your ${booking.vehicle.brand} ${booking.vehicle.name} pickup is tomorrow! Location: ${booking.vehicle.city}`,
          priority: "HIGH",
          metadata: { bookingId: booking._id, type: "PICKUP_REMINDER" },
        });
      } catch (e) { /* continue even if one notification fails */ }
    }

    // Return reminders — bookings ending tomorrow
    const returnBookings = await Booking.find({
      bookingStatus: BOOKING_STATUSES.ACTIVE,
      endDate: { $gte: dayStart, $lte: dayEnd },
    }).populate("vehicle", "name brand").lean();

    for (const booking of returnBookings) {
      try {
        await NotificationService.createNotification({
          user: booking.user,
          type: "SYSTEM",
          title: "🔑 Return Reminder",
          message: `Please return your ${booking.vehicle.brand} ${booking.vehicle.name} tomorrow. Thank you for using RentX!`,
          priority: "MEDIUM",
          metadata: { bookingId: booking._id, type: "RETURN_REMINDER" },
        });
      } catch (e) { /* continue */ }
    }

    logger.info("ReminderJob", "REMINDERS_SENT", {
      pickupReminders: pickupBookings.length,
      returnReminders: returnBookings.length,
    });
  } catch (err) {
    logger.error("ReminderJob", "JOB_FAILED", {}, err);
  }
};

/**
 * Start all background jobs.
 * Called once from server.js after DB connection is established.
 */
export const startJobs = () => {
  // Expire stale holds every 5 minutes
  cron.schedule("*/5 * * * *", expireStaleHolds);

  // Send reminders every day at 8:00 AM
  cron.schedule("0 8 * * *", sendReminders);

  logger.info("Jobs", "JOBS_STARTED", {
    jobs: ["expireStaleHolds (every 5min)", "sendReminders (daily 8am)"],
  });
};
