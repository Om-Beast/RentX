import bookingRiskRepository from "../repositories/bookingRisk.repository.js";
import riskCalculator from "../utils/riskCalculator.js";
import geminiService from "../../ai/gemini.service.js";
import { buildBookingRiskPrompt } from "../prompts/bookingRisk.prompt.js";
import logger from "../../../utils/logger.js";

class BookingRiskService {
  async analyze(data) {
    const startedAt = Date.now();

    // 1. Calculate deterministic risk
    const result = riskCalculator.calculate(data);

    // 2. Build Gemini Prompt
    const prompt = buildBookingRiskPrompt({
      signals: data,
      result,
    });

    let aiResponse = null;

    // 3. Generate AI explanation
    try {
      aiResponse =
        await geminiService.generateStructuredResponse(
          prompt
        );
    } catch (error) {
      logger.error("BookingRisk", "GEMINI_AI_FAILED", { error: error.message });
    }

    // 4. Prepare Mongo document
    const document = {
      bookingId: data.bookingId,
      userId: data.userId,
      vehicleId: data.vehicleId,
      fleetOwnerId: data.fleetOwnerId,

      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidenceScore: result.confidenceScore,
      recommendation: result.recommendation,
      riskFactors: result.riskFactors,

      inputSignals: data,

      explanation:
        aiResponse?.summary ??
        `Customer Trust Score: ${data.trustScore}.
Risk Score: ${result.riskScore}.
Risk Level: ${result.riskLevel}.
Recommendation: ${result.recommendation}.`,

      explanationSource:
        aiResponse
          ? "GEMINI"
          : "TEMPLATE_FALLBACK",

      processingTimeMs:
        Date.now() - startedAt,

      createdBy: "BOOKING_ENGINE",

      engineVersion:
        "FleetFlow Risk Engine v1",
    };

    // 5. Save
    await bookingRiskRepository.create(
      document
    );

    // 6. Return API response
    return {
      ...result,
      explanation:
        document.explanation,
      explanationSource:
        document.explanationSource,
      processingTimeMs:
        document.processingTimeMs,
    };
  }

  async getByBooking(bookingId) {
    return bookingRiskRepository.findByBookingId(
      bookingId
    );
  }
}

export default new BookingRiskService();