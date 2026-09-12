/**
 * admin.controller.js — Admin-only operations.
 *
 * All routes here require: protect + authorize("ADMIN")
 * These checks are enforced at the route level (admin.routes.js).
 *
 * Admin can:
 * - View all users, suspend/restore accounts
 * - View all vehicles, moderate listings (activate/deactivate)
 * - View all bookings, inspect individual bookings
 * - View all payments
 * - View platform-wide analytics
 *
 * IDOR NOTE: Admin has cross-user access by design.
 * Non-admin requests must NEVER reach these handlers (enforced by middleware).
 */

import User from "../../models/User.js";
import Vehicle from "../../models/Vehicle.js";
import Booking, { BOOKING_STATUSES } from "../../models/Booking.js";
import Payment from "../../models/Payment.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Paginated list of all users.
 * Query: ?page=1&limit=20&role=CUSTOMER&search=email
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: "i" } },
        { name: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:id
 * Full user profile + booking history summary.
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) throw new NotFoundError("User not found");

    const [bookingCount, activeBookings] = await Promise.all([
      Booking.countDocuments({ user: user._id }),
      Booking.countDocuments({ user: user._id, bookingStatus: { $in: ["confirmed", "active"] } }),
    ]);

    res.json({ success: true, user: { ...user, bookingCount, activeBookings } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspend or restore a user account.
 * Body: { suspend: true/false, reason: string }
 */
export const toggleUserSuspension = async (req, res, next) => {
  try {
    const { suspend, reason } = req.body;
    if (typeof suspend !== "boolean") throw new ValidationError("'suspend' must be a boolean");

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isSuspended: suspend } },
      { new: true }
    ).select("-password");

    if (!user) throw new NotFoundError("User not found");

    logger.info("AdminController", "USER_SUSPENSION_TOGGLED", {
      targetUserId: req.params.id,
      adminId: req.user._id,
      suspended: suspend,
      reason: reason || "No reason provided",
    });

    res.json({
      success: true,
      message: suspend ? "User account suspended" : "User account restored",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// VEHICLES / LISTINGS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/vehicles
 * All vehicles with owner info. Paginated.
 * Query: ?page=1&limit=20&listingStatus=active&city=Mumbai
 */
export const getAllVehiclesAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.listingStatus) filter.listingStatus = req.query.listingStatus;
    if (req.query.city) filter.city = { $regex: req.query.city, $options: "i" };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate("owner", "name email isSuspended")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter),
    ]);

    res.json({
      success: true,
      vehicles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/vehicles/:id/moderate
 * Change a vehicle's listing status (activate, deactivate, draft).
 * Body: { listingStatus: "active" | "paused" | "deactivated" }
 */
export const moderateVehicle = async (req, res, next) => {
  try {
    const VALID_STATUSES = ["active", "paused", "deactivated", "draft"];
    const { listingStatus, reason } = req.body;

    if (!VALID_STATUSES.includes(listingStatus)) {
      throw new ValidationError(`listingStatus must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: { listingStatus } },
      { new: true }
    ).populate("owner", "name email");

    if (!vehicle) throw new NotFoundError("Vehicle not found");

    logger.info("AdminController", "VEHICLE_MODERATED", {
      vehicleId: req.params.id,
      adminId: req.user._id,
      newStatus: listingStatus,
      reason: reason || "No reason provided",
    });

    res.json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/bookings
 * All bookings. Paginated. Filterable by status.
 */
export const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.bookingStatus) filter.bookingStatus = req.query.bookingStatus;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "name email trustScore")
        .populate("vehicle", "name brand type city pricePerDay images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/payments
 * All payments. Paginated.
 */
export const getAllPaymentsAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("booking", "bookingStatus totalAmount startDate endDate")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PLATFORM ANALYTICS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 * Platform-wide metrics using server-side aggregation.
 * All numbers computed by MongoDB — never client-side.
 */
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      totalVehicles,
      activeListings,
      totalBookings,
      bookings30d,
      revenueResult,
      bookingStatusBreakdown,
      topCities,
      userRoleBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ listingStatus: "active", isAvailable: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Total platform revenue (paid bookings only)
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      // Booking status distribution
      Booking.aggregate([
        { $group: { _id: "$bookingStatus", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Top booking cities
      Vehicle.aggregate([
        { $group: { _id: "$city", vehicles: { $sum: 1 } } },
        { $sort: { vehicles: -1 } },
        { $limit: 5 },
      ]),
      // User role distribution
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          newLast30Days: newUsers30d,
          byRole: userRoleBreakdown.reduce((acc, r) => {
            acc[r._id] = r.count;
            return acc;
          }, {}),
        },
        vehicles: {
          total: totalVehicles,
          activeListings,
          topCities,
        },
        bookings: {
          total: totalBookings,
          last30Days: bookings30d,
          byStatus: bookingStatusBreakdown.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
          }, {}),
        },
        revenue: {
          total: revenueResult[0]?.total ?? 0,
          currency: "INR",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
