import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../../utils/logger.js";
import { ExternalServiceError } from "../../utils/errors.js";

if (!process.env.GEMINI_API_KEY) {
  logger.warn("GeminiService", "MISSING_API_KEY", {
    message: "GEMINI_API_KEY not set — AI features will be unavailable",
  });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";
const TIMEOUT_MS = 10000;

/**
 * Base function for all Gemini calls.
 * - 10 second timeout
 * - Graceful fallback on failure
 * - JSON output enforced
 */
const callGemini = async (prompt, fallback = null) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("AI request timed out")), TIMEOUT_MS)
  );

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);

    const text = result.response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { rawResponse: text };
    }
  } catch (err) {
    logger.warn("GeminiService", "AI_CALL_FAILED", { error: err.message });
    if (fallback !== null) return fallback;
    throw new ExternalServiceError("AI service temporarily unavailable", "GEMINI");
  }
};

export default { callGemini };
