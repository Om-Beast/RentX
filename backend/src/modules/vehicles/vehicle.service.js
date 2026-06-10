import { createVehicle } from "./vehicle.repository.js";

export const addVehicleService = async (
  vehicleData,
  ownerId
) => {
  return await createVehicle({
    ...vehicleData,
    owner: ownerId,
  });
};