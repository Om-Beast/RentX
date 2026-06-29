const promptBuilder = {
  buildTripPlanPrompt({
    source,
    destination,
    days,
    budget,
    passengers,
    purpose,
    vehicles,
  }) {
    const vehicleContext =
      vehicles?.length > 0
        ? vehicles
            .map(
              (v) =>
                `ID:${v._id} | Brand:${v.brand} | Name:${v.name} | Type:${v.type} | Year:${v.year} | Seats:${v.seats} | Rent:₹${v.rentPerDay}/day | Fuel:${v.fuelType} | Transmission:${v.transmission} | Rating:${v.rating} | Location:${v.location} | Description:${v.description}`
            )
            .join("\n")
        : "No vehicles available.";

    return `
You are RentX AI, an expert Indian travel planner and vehicle recommendation assistant.

USER DETAILS

Source: ${source}
Destination: ${destination}
Duration: ${days} days
Budget: ₹${budget}
Passengers: ${passengers}
Purpose: ${purpose}

AVAILABLE VEHICLES

${vehicleContext}

YOUR TASK

1. Recommend the best vehicle.
2. The vehicleId MUST come from the inventory above.
3. Calculate rental cost.
4. Estimate fuel cost.
5. Calculate total trip cost.
6. Check whether the trip is within budget.
7. Create a day-wise itinerary.
8. Give useful travel tips.

IMPORTANT

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT return explanation.

Return EXACTLY this structure:

{
  "recommendedVehicle": {
    "vehicleId": "",
    "vehicleName": "",
    "reason": ""
  },
  "costAnalysis": {
    "estimatedRentalCost": 0,
    "estimatedFuelCost": 0,
    "totalEstimatedCost": 0,
    "withinBudget": true
  },
  "tripPlan": [
    {
      "day": 1,
      "title": "",
      "activities": []
    }
  ],
  "travelTips": []
}
`.trim();
  },
};

export default promptBuilder;