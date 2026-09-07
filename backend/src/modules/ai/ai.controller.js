import aiService from "./ai.service.js";

export const discoverVehicles = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || query.trim().length < 5) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Query must be at least 5 characters" } });
    }
    const result = await aiService.discoverByNaturalLanguage(query.trim());
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const generateDescription = async (req, res, next) => {
  try {
    const result = await aiService.generateListingDescription(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const { preferredType, preferredCity, maxBudget, preferredTransmission } = req.query;
    const result = await aiService.getRecommendations(
      { preferredType, preferredCity, maxBudget: maxBudget ? parseInt(maxBudget) : null, preferredTransmission },
      req.user._id
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
