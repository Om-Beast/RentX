import Vehicle from "../../models/Vehicle.js";
import {
  addVehicleService,
  getAllVehiclesService,
} from "./vehicle.service.js";

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

export const getAllVehicles = async (
  req,
  res
) => {
  try {
    const vehicles =
      await getAllVehiclesService();

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVehicleById = async (
  req,
  res
) => {
  try {
    const vehicle =
      await Vehicle.findById(
        req.params.id
      );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyVehicles = async (
  req,
  res
) => {
  try {
    const vehicles =
      await Vehicle.find({
        owner: req.user._id,
      });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};