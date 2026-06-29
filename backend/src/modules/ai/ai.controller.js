import aiService from "./ai.service.js";
const aiController = {
  /**
   * Check AI module health
   */
  checkHealth: (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'AI module is healthy'
    });
  },
  /**
   * Generate a trip plan
   */
  generateTripPlan: async (req, res) => {
    try {
      const { source, destination, days, budget, passengers, purpose } = req.body;
      // Validate required fields
      if (!source || !destination || !days || !budget || !passengers || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: missing required fields. Please provide source, destination, days, budget, passengers, and purpose.'
        });
      }
      // Delegate to service
      const response = await aiService.generateTripPlan({
        source,
        destination,
        days,
        budget,
        passengers,
        purpose
      });
      // Return successful response
      return res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      // Basic error handling - can be expanded using a global error handler
      console.error('[aiController.generateTripPlan] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};
export default aiController;
