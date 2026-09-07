import Vehicle from "../../models/Vehicle.js";
import Booking from "../../models/Booking.js";
import Payment from "../../models/Payment.js";
import { BOOKING_STATUSES } from "../../models/Booking.js";

/**
 * Owner-scoped dashboard stats.
 * Only returns data for vehicles owned by the authenticated user.
 * Uses aggregation pipelines — no downloading all bookings to Node.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";

    // Get vehicles owned by this owner (or all for admin)
    const vehicleFilter = isAdmin ? {} : { owner: ownerId };
    const vehicles = await Vehicle.find(vehicleFilter).select("_id").lean();
    const vehicleIds = vehicles.map((v) => v._id);

    const bookingFilter = isAdmin
      ? {}
      : { vehicle: { $in: vehicleIds } };

    const [
      totalVehicles,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      revenueResult,
    ] = await Promise.all([
      Vehicle.countDocuments(vehicleFilter),
      Booking.countDocuments(bookingFilter),
      Booking.countDocuments({ ...bookingFilter, bookingStatus: BOOKING_STATUSES.PENDING_APPROVAL }),
      Booking.countDocuments({ ...bookingFilter, bookingStatus: BOOKING_STATUSES.ACTIVE }),
      Booking.countDocuments({ ...bookingFilter, bookingStatus: BOOKING_STATUSES.COMPLETED }),
      // Aggregation pipeline for revenue (server-side sum, not JS reduce on all documents)
      Booking.aggregate([
        { $match: { ...bookingFilter, paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const revenue = revenueResult[0]?.totalRevenue ?? 0;

    res.status(200).json({
      success: true,
      totalVehicles,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      revenue,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentBookings = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";

    let bookingFilter = {};
    if (!isAdmin) {
      const vehicles = await Vehicle.find({ owner: ownerId }).select("_id").lean();
      bookingFilter = { vehicle: { $in: vehicles.map((v) => v._id) } };
    }

    const bookings = await Booking.find(bookingFilter)
      .populate("vehicle", "name brand model type pricePerDay images")
      .populate("user", "name email trustScore")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * Revenue trend for the last 30 days — used for the analytics chart.
 * Uses MongoDB aggregation to compute daily sums server-side.
 */
export const getOwnerAnalytics = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";

    let vehicleIds = [];
    if (!isAdmin) {
      const vehicles = await Vehicle.find({ owner: ownerId }).select("_id").lean();
      vehicleIds = vehicles.map((v) => v._id);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingFilter = isAdmin
      ? { paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } }
      : { vehicle: { $in: vehicleIds }, paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } };

    const revenueByDay = await Booking.aggregate([
      { $match: bookingFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const statusBreakdown = await Booking.aggregate([
      { $match: isAdmin ? {} : { vehicle: { $in: vehicleIds } } },
      { $group: { _id: "$bookingStatus", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      revenueByDay,
      statusBreakdown,
    });
  } catch (error) {
    next(error);
  }
};