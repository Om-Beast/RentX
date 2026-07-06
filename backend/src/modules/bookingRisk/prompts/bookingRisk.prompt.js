export function buildBookingRiskPrompt({
  signals,
  result,
}) {
  return `
You are an enterprise booking risk analyst for a vehicle rental platform.

Analyze the booking and generate a professional risk assessment.

Customer Information

Trust Score: ${signals.trustScore}

Total Bookings: ${signals.totalBookings}

Completed Bookings: ${signals.completedBookings}

Cancelled Bookings: ${signals.cancelledBookings}

Late Returns: ${signals.lateReturns}

Average Review: ${signals.averageReviewScore}

Vehicle Category: ${signals.vehicleCategory}

Rental Amount: ₹${signals.rentalAmount}

Booking Duration:
${signals.bookingDurationDays} days

Risk Engine Output

Risk Score:
${result.riskScore}

Risk Level:
${result.riskLevel}

Recommendation:
${result.recommendation}

Return ONLY JSON.

{
 "summary":"",
 "reasoning":[
   "",
   "",
   ""
 ],
 "recommendation":"",
 "confidence":0
}
`;
}