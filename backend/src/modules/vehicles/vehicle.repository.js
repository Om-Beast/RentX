import Vehicle from "../../models/Vehicle.js";

export const createVehicle = async (vehicleData) => {
  return await Vehicle.create(vehicleData);
};

export const getAllVehicles = async () => {
  return await Vehicle.find();
};