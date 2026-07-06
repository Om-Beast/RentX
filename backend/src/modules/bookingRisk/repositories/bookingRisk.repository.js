import BookingRisk from "../models/BookingRisk.js";

class BookingRiskRepository {
  async create(data) {
    return BookingRisk.create(data);
  }

  async findByBookingId(bookingId) {
    return BookingRisk.findOne({ bookingId });
  }

  async findByUser(userId) {
    return BookingRisk.find({ userId });
  }
}

export default new BookingRiskRepository();