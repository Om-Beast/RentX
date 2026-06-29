import Vehicle from "../../models/Vehicle.js";
import promptBuilder from "./prompt.service.js";
import geminiService from "./gemini.service.js";

const aiService = {
  async generateTripPlan({
    source,
    destination,
    days,
    budget,
    passengers,
    purpose,
  }) {
    try {
      const availableVehicles = await Vehicle.find({
        isAvailable: true,
        seats: {
          $gte: Number(passengers),
        },
      }).lean();

      const prompt =
        promptBuilder.buildTripPlanPrompt({
          source,
          destination,
          days,
          budget,
          passengers,
          purpose,
          vehicles: availableVehicles,
        });

      const response =
        await geminiService.generateStructuredResponse(
          prompt
        );

      return response;
    } catch (error) {
      console.error(
        "[AI Service]",
        error.message
      );

      throw new Error(error.message);
    }
  },
};

export default aiService;