import { addVehicleService } from "./vehicle.service.js";

export const addVehicle = async (req, res) => {
  try {
    const vehicle = await addVehicleService(
      req.body,
      req.user._id
    );

    res.status(201).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};