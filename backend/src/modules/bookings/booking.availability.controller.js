import { isVehicleAvailable, getBookedDateRanges } from "./availability.service.js";
import { ValidationError } from "../../utils/errors.js";

export const getBookedDates = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const ranges = await getBookedDateRanges(vehicleId);
    res.status(200).json({ success: true, bookedRanges: ranges });
  } catch (error) {
    next(error);
  }
};

export const checkAvailability = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    if (!vehicleId || !startDate || !endDate) {
      throw new ValidationError("vehicleId, startDate, and endDate are required");
    }
    const available = await isVehicleAvailable(vehicleId, startDate, endDate);
    res.status(200).json({ success: true, available });
  } catch (error) {
    next(error);
  }
};
