import {
  RISK_WEIGHTS,
  VEHICLE_RISK_TIERS,
  DURATION_RISK_TIERS,
  AMOUNT_RISK_TIERS,
  RISK_LEVELS,
  RECOMMENDATIONS,
} from "../config/riskWeights.js";

class RiskCalculatorService {
  
  calculate(signals) {
    const factorScores = this._computeFactorScores(signals);
    const riskScore = this._computeWeightedRiskScore(factorScores);
    const riskLevel = this._classifyRiskLevel(riskScore);
    const confidenceScore = this._computeConfidence(signals);
    const recommendation = this._determineRecommendation(riskLevel, confidenceScore);
    const riskFactors = this._buildRiskFactorArray(factorScores);
    return {
      riskScore: Math.round(riskScore),
      riskLevel,
      confidenceScore: Math.round(confidenceScore),
      recommendation,
      riskFactors,
    };
  }
  // ══════════════════════════════════════════════════════
  // CORE SCORING PIPELINE
  // ══════════════════════════════════════════════════════
  /**
   * Compute raw risk score for each factor.
   * Each score is 0.0 (no risk) to 1.0 (maximum risk).
   */
  _computeFactorScores(signals) {
    return {
      trustScore: {
        raw: this._invertNormalized(signals.trustScore, 100),
        weight: RISK_WEIGHTS.trustScore,
        description: this._describeTrustScore(signals.trustScore),
      },
      cancellationRate: {
        raw: Math.min(signals.cancellationRate, 1),
        weight: RISK_WEIGHTS.cancellationRate,
        description: this._describeCancellationRate(signals.cancellationRate),
      },
      lateReturnRate: {
        raw: Math.min(signals.lateReturnRate, 1),
        weight: RISK_WEIGHTS.lateReturnRate,
        description: this._describeLateReturnRate(signals),
      },
      paymentReliability: {
        raw: this._invertNormalized(signals.paymentReliabilityScore, 100),
        weight: RISK_WEIGHTS.paymentReliability,
        description: this._describePaymentReliability(signals.paymentReliabilityScore),
      },
      bookingHistory: {
        raw: this._scoreBookingHistory(signals),
        weight: RISK_WEIGHTS.bookingHistory,
        description: this._describeBookingHistory(signals),
      },
      vehicleCategory: {
        raw: this._scoreVehicleCategory(signals.vehicleCategory),
        weight: RISK_WEIGHTS.vehicleCategory,
        description: this._describeVehicleCategory(signals.vehicleCategory),
      },
      bookingDuration: {
        raw: this._scoreDuration(signals.bookingDurationDays),
        weight: RISK_WEIGHTS.bookingDuration,
        description: this._describeDuration(signals.bookingDurationDays),
      },
      rentalAmount: {
        raw: this._scoreAmount(signals.rentalAmount),
        weight: RISK_WEIGHTS.rentalAmount,
        description: this._describeAmount(signals.rentalAmount),
      },
      reviewScore: {
        raw: this._scoreReviews(signals),
        weight: RISK_WEIGHTS.reviewScore,
        description: this._describeReviews(signals),
      },
      contextualFlags: {
        raw: this._scoreContextualFlags(signals),
        weight: RISK_WEIGHTS.contextualFlags,
        description: this._describeContextualFlags(signals),
      },
    };
  }
  /**
   * Compute overall weighted risk score (0-100).
   * Sum of (raw_score × weight × 100) for all factors.
   */
  _computeWeightedRiskScore(factorScores) {
    return Object.values(factorScores).reduce((total, factor) => {
      return total + factor.raw * factor.weight * 100;
    }, 0);
  }
 
_classifyRiskLevel(score) {
  if (score <= 25) return RISK_LEVELS.LOW;
  if (score <= 50) return RISK_LEVELS.MEDIUM;
  if (score <= 75) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}

  _computeConfidence(signals) {
    let confidence = 50; // Base confidence
    // Booking history depth
    if (signals.totalBookings >= 10) confidence += 20;
    else if (signals.totalBookings >= 5) confidence += 15;
    else if (signals.totalBookings >= 1) confidence += 8;
    // 0 bookings → no addition (new customer)
    // Review data availability
    if (signals.totalReviews >= 5) confidence += 10;
    else if (signals.totalReviews >= 1) confidence += 5;
    // Trust score availability (non-default)
    if (signals.trustScore !== 50) confidence += 10;
    // Payment history (non-default)
    if (signals.paymentReliabilityScore !== 50) confidence += 10;
    return Math.min(confidence, 100);
  }
  /**
   * Map risk level to actionable recommendation.
   * Low confidence can escalate a MEDIUM to MANUAL_REVIEW.
   */
  _determineRecommendation(riskLevel, confidenceScore) {
  if (
    confidenceScore < 60 &&
    riskLevel === RISK_LEVELS.MEDIUM
  ) {
    return RECOMMENDATIONS.MANUAL_REVIEW;
  }

  switch (riskLevel) {
    case RISK_LEVELS.LOW:
      return RECOMMENDATIONS.APPROVE;

    case RISK_LEVELS.MEDIUM:
      return RECOMMENDATIONS.MANUAL_REVIEW;

    case RISK_LEVELS.HIGH:
      return RECOMMENDATIONS.INCREASE_DEPOSIT;

    default:
      return RECOMMENDATIONS.REJECT;
  }
}
 
  _buildRiskFactorArray(factorScores) {
    return Object.entries(factorScores).map(([factor, data]) => ({
      factor,
      score: Math.round(data.raw * 100),
      weight: data.weight,
      weightedScore: parseFloat((data.raw * data.weight * 100).toFixed(2)),
      description: data.description,
    }));
  }
  
  _invertNormalized(value, maxVal) {
    return Math.max(0, Math.min(1, 1 - value / maxVal));
  }
 
  _scoreBookingHistory(signals) {
    if (signals.isNewCustomer) return 0.70;
    if (signals.totalBookings <= 2) return 0.50;
    if (signals.totalBookings <= 5) return 0.30;
    if (signals.totalBookings <= 15) return 0.15;
    return 0.05;
  }
 
  _scoreVehicleCategory(category) {
    return VEHICLE_RISK_TIERS[category] || VEHICLE_RISK_TIERS.SEDAN;
  }
  
  _scoreDuration(days) {
    for (const tier of DURATION_RISK_TIERS) {
      if (days <= tier.maxDays) return tier.riskScore;
    }
    return 0.90;
  }
  
  _scoreAmount(amount) {
    for (const tier of AMOUNT_RISK_TIERS) {
      if (amount <= tier.maxAmount) return tier.riskScore;
    }
    return 0.85;
  }
  
  _scoreReviews(signals) {
    if (!signals.totalReviews || signals.totalReviews === 0) return 0.50;
    if (signals.averageReviewScore >= 4.5) return 0.05;
    if (signals.averageReviewScore >= 4.0) return 0.15;
    if (signals.averageReviewScore >= 3.5) return 0.25;
    if (signals.averageReviewScore >= 3.0) return 0.40;
    return 0.70;
  }
  
  _scoreContextualFlags(signals) {
    let score = 0;
    if (signals.isPeakSeason) score += 0.25;
    if (signals.isWeekendBooking) score += 0.20;
    if (signals.isNewCustomer && signals.rentalAmount > 15000) score += 0.35;
    return Math.min(score, 1);
  }

  _describeTrustScore(score) {
    if (score >= 80) return 'High trust score indicates reliable user';
    if (score >= 60) return 'Moderate trust score within acceptable range';
    if (score >= 40) return 'Below-average trust score requires attention';
    return 'Low trust score indicates significant risk';
  }
  _describeCancellationRate(rate) {
    const pct = (rate * 100).toFixed(1);
    if (rate <= 0.05) return `Excellent cancellation rate (${pct}%)`;
    if (rate <= 0.15) return `Acceptable cancellation rate (${pct}%)`;
    if (rate <= 0.30) return `Elevated cancellation rate (${pct}%)`;
    return `High cancellation rate (${pct}%) raises concern`;
  }
  _describeLateReturnRate(signals) {
    const pct = (signals.lateReturnRate * 100).toFixed(1);
    if (signals.lateReturnRate === 0) return 'No history of late returns';
    if (signals.lateReturnRate <= 0.10) return `Minimal late returns (${pct}%)`;
    if (signals.lateReturnRate <= 0.25) return `Moderate late return rate (${pct}%)`;
    return `Frequent late returns (${pct}%) — ${signals.lateReturns} incidents`;
  }
  _describePaymentReliability(score) {
    if (score >= 90) return 'Excellent payment track record';
    if (score >= 70) return 'Good payment reliability';
    if (score >= 50) return 'Mixed payment history';
    return 'Poor payment reliability — previous defaults detected';
  }
  _describeBookingHistory(signals) {
    if (signals.isNewCustomer) return 'New customer — no prior booking history';
    return `${signals.totalBookings} total bookings (${signals.completedBookings} completed)`;
  }
  _describeVehicleCategory(category) {
    const tierLabels = {
      ECONOMY: 'low-risk',
      COMPACT: 'low-risk',
      SEDAN: 'standard-risk',
      SUV: 'elevated-risk',
      PREMIUM_SUV: 'high-risk',
      LUXURY: 'high-risk',
      SUPERCAR: 'premium-risk',
    };
    return `${category} vehicle — ${tierLabels[category] || 'standard-risk'} tier`;
  }
  _describeDuration(days) {
    if (days <= 3) return `Short-term rental (${days} days)`;
    if (days <= 7) return `Standard duration (${days} days)`;
    if (days <= 14) return `Extended rental (${days} days) — increased exposure`;
    if (days <= 30) return `Long-term rental (${days} days) — significant fleet commitment`;
    return `Extended long-term rental (${days} days) — maximum exposure window`;
  }
  _describeAmount(amount) {
    return `Rental value ₹${amount.toLocaleString('en-IN')}`;
  }
  _describeReviews(signals) {
    if (!signals.totalReviews || signals.totalReviews === 0) return 'No reviews available';
    return `Average rating ${signals.averageReviewScore.toFixed(1)}/5 across ${signals.totalReviews} reviews`;
  }
  _describeContextualFlags(signals) {
    const flags = [];
    if (signals.isPeakSeason) flags.push('peak season');
    if (signals.isWeekendBooking) flags.push('weekend booking');
    if (signals.isNewCustomer) flags.push('first-time customer');
    return flags.length > 0
      ? `Contextual factors: ${flags.join(', ')}`
      : 'No elevated contextual factors';
  }
}
export default new RiskCalculatorService();