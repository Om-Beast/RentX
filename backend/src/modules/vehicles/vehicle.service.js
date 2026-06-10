import {
  createVehicle,
  getAllVehicles,
} from "./vehicle.repository.js";

export const addVehicleService = async (
  vehicleData,
  ownerId
) => {
  return await createVehicle({
    ...vehicleData,
    owner: ownerId,
  });
};

export const getAllVehiclesService =
  async () => {
    return await getAllVehicles();
  };