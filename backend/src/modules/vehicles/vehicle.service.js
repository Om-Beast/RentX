import {
  createVehicle,
  getAllVehicles,
  getVehiclesByOwner,
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

export const getOwnerVehiclesService =
  async (ownerId) => {
    return await getVehiclesByOwner(
      ownerId
    );
  };