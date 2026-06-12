import Vehicle from "../../models/Vehicle.js";
import Booking from "../../models/Booking.js";

export const getDashboardStats = async (
  req,
  res
) => {
  try {
    const totalVehicles =
      await Vehicle.countDocuments();

    const totalBookings =
      await Booking.countDocuments();

    const pendingBookings =
      await Booking.countDocuments({
        bookingStatus: "pending",
      });

    const revenueData =
      await Booking.find({
        bookingStatus: {
          $ne: "cancelled",
        },
      });

    const revenue =
      revenueData.reduce(
        (sum, booking) =>
          sum + booking.totalPrice,
        0
      );

    res.status(200).json({
      success: true,
      totalVehicles,
      totalBookings,
      pendingBookings,
      revenue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRecentBookings = async (
  req,
  res
) => {
  try {
    const bookings =
      await Booking.find()
        .populate("vehicle")
        .populate("user", "name email")
        .sort({
          createdAt: -1,
        })
        .limit(5);

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};