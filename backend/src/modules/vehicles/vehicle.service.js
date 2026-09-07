/**
 * Vehicle Service — listing creation and server-side search.
 *
 * Search design:
 * - ALL filtering happens server-side. The frontend sends filter params.
 * - We build a MongoDB query dynamically from the params.
 * - Pagination uses skip/limit with a total count for the client.
 * - This prevents fetching thousands of documents to the browser.
 *
 * Index used by the primary search query:
 *   { type: 1, city: 1, isAvailable: 1, pricePerDay: 1 }
 */

import Vehicle from "../../models/Vehicle.js";
import { createVehicle, getAllVehicles } from "./vehicle.repository.js";
import { ValidationError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

const REQUIRED_FIELDS = ["name", "brand", "model", "year", "type", "description", "pricePerDay", "seats", "location", "city"];

export const addVehicleService = async (vehicleData, ownerId) => {
  for (const field of REQUIRED_FIELDS) {
    if (!vehicleData[field]) {
      throw new ValidationError(`Field '${field}' is required`);
    }
  }
  return createVehicle({ ...vehicleData, owner: ownerId });
};

/**
 * Server-driven vehicle search with filtering, sorting, and pagination.
 *
 * Supported query params:
 *   category/type, city, minPrice, maxPrice, transmission, fuelType,
 *   seats, search (text), sortBy, page, limit
 */
export const getAllVehiclesService = async (queryParams = {}) => {
  const {
    type,
    city,
    minPrice,
    maxPrice,
    transmission,
    fuelType,
    seats,
    search,
    isAvailable,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 12,
  } = queryParams;

  const filter = { listingStatus: "active" };

  if (type && type !== "all") filter.type = type.toLowerCase();
  if (city) filter.city = { $regex: city, $options: "i" };
  if (transmission) filter.transmission = transmission.toLowerCase();
  if (fuelType) filter.fuelType = fuelType.toLowerCase();
  if (seats) filter.seats = { $gte: parseInt(seats, 10) };
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
  if (minPrice || maxPrice) {
    filter.pricePerDay = {};
    if (minPrice) filter.pricePerDay.$gte = parseInt(minPrice, 10);
    if (maxPrice) filter.pricePerDay.$lte = parseInt(maxPrice, 10);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
    ];
  }

  const safePage = Math.max(1, parseInt(page, 10));
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (safePage - 1) * safeLimit;

  const sortOrder = order === "asc" ? 1 : -1;
  const sortMap = {
    price: { pricePerDay: sortOrder },
    rating: { rating: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };
  const sort = sortMap[sortBy] || sortMap.newest;

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .select("name brand model type year pricePerDay fuelType transmission seats images city rating reviewCount isAvailable owner")
      .populate("owner", "name trustScore")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Vehicle.countDocuments(filter),
  ]);

  return {
    vehicles,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      hasNext: safePage < Math.ceil(total / safeLimit),
      hasPrev: safePage > 1,
    },
  };
};

export const getOwnerVehiclesService = async (ownerId) => {
  return Vehicle.find({ owner: ownerId }).sort({ createdAt: -1 });
};