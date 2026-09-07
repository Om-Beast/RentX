import Vehicle from "../../models/Vehicle.js";
import geminiService from "./gemini.service.js";
import logger from "../../utils/logger.js";

const aiService = {
  /**
   * A. Natural Language Vehicle Discovery
   *
   * Input: "I need an automatic SUV under ₹2500/day in Delhi for 3 days"
   *
   * The AI extracts STRUCTURED FILTERS from natural language.
   * The backend then applies those filters via the actual database query.
   *
   * AI's role: extract intent
   * Backend's role: apply real filters and return real results
   * AI does NOT decide availability — the database does.
   */
  async discoverByNaturalLanguage(query) {
    const extractionPrompt = `
You are a vehicle rental filter extractor. Extract structured filters from this user query.
Query: "${query}"

Return ONLY valid JSON matching this schema:
{
  "type": "car|bike|scooter|suv|sedan|hatchback|luxury|ev|other|null",
  "city": "string or null",
  "maxPrice": "number or null",
  "transmission": "manual|automatic|null",
  "fuelType": "petrol|diesel|electric|hybrid|null",
  "seats": "number or null",
  "days": "number or null",
  "understood": "brief explanation of what you understood"
}

Only extract what is clearly stated. Return null for anything not mentioned.`;

    const extracted = await geminiService.callGemini(extractionPrompt, {
      type: null, city: null, maxPrice: null, transmission: null,
      fuelType: null, seats: null, days: null, understood: "Could not parse query",
    });

    logger.info("AIService", "NL_DISCOVERY_PARSED", { query: query.substring(0, 100), extracted });

    // Build actual MongoDB query from AI-extracted filters
    const filter = { listingStatus: "active", isAvailable: true };
    if (extracted.type) filter.type = extracted.type;
    if (extracted.city) filter.city = { $regex: extracted.city, $options: "i" };
    if (extracted.maxPrice) filter.pricePerDay = { $lte: extracted.maxPrice };
    if (extracted.transmission) filter.transmission = extracted.transmission;
    if (extracted.fuelType) filter.fuelType = extracted.fuelType;
    if (extracted.seats) filter.seats = { $gte: extracted.seats };

    const vehicles = await Vehicle.find(filter)
      .select("name brand model type pricePerDay fuelType transmission seats images city rating reviewCount")
      .limit(8)
      .lean();

    return {
      understood: extracted.understood,
      filters: extracted,
      vehicles,
      count: vehicles.length,
    };
  },

  /**
   * B. Listing Description Generator
   *
   * Fleet owners provide structured vehicle data.
   * AI generates a professional, compelling listing description.
   * Owner reviews and edits before publishing.
   */
  async generateListingDescription(vehicleData) {
    const { brand, model, year, type, fuelType, transmission, seats, city, features } = vehicleData;

    const prompt = `
You are writing a professional vehicle rental listing description for RentX marketplace.

Vehicle Details:
- Brand: ${brand}
- Model: ${model}
- Year: ${year}
- Type: ${type}
- Fuel: ${fuelType}
- Transmission: ${transmission}
- Seats: ${seats}
- City: ${city}
- Features: ${(features || []).join(", ")}

Write a compelling, professional rental description (120-200 words). 
Focus on practical benefits for renters. No exaggeration.

Return JSON: { "description": "the description text", "highlights": ["up to 3 key selling points"] }`;

    return geminiService.callGemini(prompt, {
      description: `${brand} ${model} (${year}) — a reliable ${type} available for rent in ${city}. ${transmission} transmission with ${seats} seats. Contact for details.`,
      highlights: ["Well-maintained vehicle", "Convenient pickup location"],
    });
  },

  /**
   * C. Explainable Recommendations
   *
   * Uses user's booking history to suggest vehicles they'd likely enjoy.
   * AI generates the human-readable explanation; filtering is deterministic.
   *
   * NOT: "Recommended for you" (black box)
   * YES: "Recommended because it's an automatic SUV under ₹2000/day in Delhi,
   *       matching your 3 previous rentals"
   */
  async getRecommendations(userPreferences, userId) {
    const { preferredType, preferredCity, maxBudget, preferredTransmission } = userPreferences;

    // Deterministic filter — AI only generates the explanation text
    const filter = { listingStatus: "active", isAvailable: true };
    if (preferredType) filter.type = preferredType;
    if (preferredCity) filter.city = { $regex: preferredCity, $options: "i" };
    if (maxBudget) filter.pricePerDay = { $lte: maxBudget };
    if (preferredTransmission) filter.transmission = preferredTransmission;

    const vehicles = await Vehicle.find(filter)
      .sort({ rating: -1 })
      .limit(4)
      .lean();

    if (vehicles.length === 0) return { recommendations: [], message: "No matching vehicles found" };

    // AI generates the explanation text only — not the recommendations themselves
    const explanationPrompt = `
A user is looking for a rental vehicle with these preferences:
- Type: ${preferredType || "any"}
- City: ${preferredCity || "any"}
- Max budget: ₹${maxBudget || "any"}/day
- Transmission: ${preferredTransmission || "any"}

Write a short (1-2 sentence) explanation for why these vehicles are recommended.
Be specific about which preference(s) they match.
Return JSON: { "explanation": "the explanation text" }`;

    const explainer = await geminiService.callGemini(explanationPrompt, {
      explanation: `Recommended based on your preferences for ${preferredType || "vehicles"} in ${preferredCity || "your city"}.`,
    });

    return {
      recommendations: vehicles,
      explanation: explainer.explanation,
    };
  },
};

export default aiService;