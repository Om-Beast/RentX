import { GoogleGenerativeAI } from '@google/generative-ai';
console.log("Gemini Key Loaded:", process.env.GEMINI_API_KEY);
// 1. Environment validation
if (!process.env.GEMINI_API_KEY) {
  console.warn('[GeminiService] WARNING: GEMINI_API_KEY environment variable is missing.');
}
// 2. Create a singleton Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Define the model - Flash is optimal for speed and JSON structure tasks
const MODEL_NAME = "gemini-2.5-flash";
const geminiService = {
  /**
   * Sends a prompt to the Gemini API and parses the response as structured JSON.
   * Ensures high reliability using specific generation constraints.
   *
   * @param {string} prompt - The fully constructed prompt string.
   * @returns {Promise<Object>} The parsed JSON response.
   * @throws {Error} If the API call fails or JSON parsing fails.
   */
  generateStructuredResponse: async (prompt) => {
    try {
      // Initialize the model with configuration enforcing JSON output
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for deterministic, structured output
        },
      });
      // Execute the request
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // Parse and return the structured data
      try {
  return JSON.parse(responseText);
} catch {
  return {
    rawResponse: responseText,
  };
}
    } catch (error) {
      // Log the internal error for debugging and monitoring
      console.error('[GeminiService.generateStructuredResponse] Error:', error.message);
      
      // Throw a clean, sanitized error upstream
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
};
export default geminiService;
