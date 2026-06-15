import api from "./api";

export const getMyVehicles = async () => {
  const response = await api.get(
    "/vehicles/my-vehicles"
  );

  return response.data;
};