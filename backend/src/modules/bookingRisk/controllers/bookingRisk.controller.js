import bookingRiskService from "../services/bookingRisk.service.js";

class BookingRiskController {
  async analyze(req, res, next) {
    try {
      const result = await bookingRiskService.analyze(req.body);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BookingRiskController();