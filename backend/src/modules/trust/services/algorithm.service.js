const BOUNDARIES = { MIN: 0, MAX: 1000 };
const TIERS = {
  HIGH_RISK: 'HIGH_RISK',
  UNVERIFIED: 'UNVERIFIED',
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
};
const RISK_LEVELS = {
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};
const RECOMMENDATIONS = {
  APPROVE: 'Approve Booking',
  REVIEW: 'Manual Review',
  DEPOSIT: 'Increase Deposit',
  REJECT: 'Reject Booking',
  REWARD: 'Reward Customer',
};
// ==========================================
// 2. EVENT STRATEGIES (Open-Closed Principle)
// ==========================================
// To add future rules, simply register a new strategy here without modifying core logic.
const EventStrategies = {
  BOOKING_COMPLETED: () => ({ delta: 15, msg: 'Successful trip completion' }),
  BOOKING_CANCELLED: (meta) => {
    const isLate = meta?.hoursBeforeTrip < 24;
    return { delta: isLate ? -25 : -10, msg: isLate ? 'Late cancellation' : 'Standard cancellation' };
  },
  LATE_RETURN: (meta) => {
    const hours = Math.max(1, meta?.hoursLate || 1);
    return { delta: -20 * hours, msg: `Late return by ${hours} hr(s)` };
  },
  PAYMENT_SUCCESS: () => ({ delta: 5, msg: 'Payment processed' }),
  PAYMENT_FAILED: () => ({ delta: -50, msg: 'Payment failed/chargeback' }),
  DAMAGE_REPORTED: (meta) => {
    const sev = meta?.severity || 'MODERATE';
    const mult = sev === 'SEVERE' ? 2 : sev === 'MINOR' ? 0.5 : 1;
    return { delta: -200 * mult, msg: `Damage reported (${sev})` };
  },
  OWNER_REVIEW: (meta) => calculateReviewStrategy(meta?.rating),
  CUSTOMER_REVIEW: (meta) => calculateReviewStrategy(meta?.rating),
  LICENSE_VERIFIED: () => ({ delta: 150, msg: 'License verified' }),
  IDENTITY_VERIFIED: () => ({ delta: 100, msg: 'Identity verified' }),
  ADMIN_OVERRIDE: (meta) => ({ delta: meta?.customDelta || 0, msg: meta?.reason || 'Admin override' }),
};
function calculateReviewStrategy(rating = 3) {
  if (rating === 5) return { delta: 10, msg: '5-star review' };
  if (rating === 4) return { delta: 5, msg: '4-star review' };
  if (rating === 3) return { delta: 0, msg: '3-star review' };
  if (rating === 2) return { delta: -15, msg: '2-star review' };
  return { delta: -30, msg: '1-star review' };
}
// 3. CORE ENGINES (Single Responsibility)
class TrustEngine {
  static evaluate(currentTrust, event, metadata) {
    const strategy = EventStrategies[event];
    if (!strategy) return { score: currentTrust, delta: 0, msg: `Ignored unknown event: ${event}` };
    const { delta, msg } = strategy(metadata);
    const rawScore = currentTrust + delta;
    const clampedScore = Math.max(BOUNDARIES.MIN, Math.min(BOUNDARIES.MAX, Math.round(rawScore)));
    const actualDelta = clampedScore - currentTrust;
    return { score: clampedScore, delta: actualDelta, msg };
  }
}
class RiskEngine {
  static evaluate(score, event, metadata, previousEvents = []) {
    // 1. Immediate Event-Based Overrides
    if (event === 'DAMAGE_REPORTED' && ['SEVERE', 'MODERATE'].includes(metadata?.severity)) {
      return RISK_LEVELS.CRITICAL;
    }
    if (event === 'PAYMENT_FAILED') {
      return RISK_LEVELS.HIGH;
    }
    // 2. Pattern-Based Overrides
    const recentCancels = previousEvents.filter((e) => e.type === 'BOOKING_CANCELLED').length;
    if (recentCancels >= 3) return RISK_LEVELS.HIGH;
    // 3. Score-Based Baseline
    if (score >= 900) return RISK_LEVELS.VERY_LOW;
    if (score >= 700) return RISK_LEVELS.LOW;
    if (score >= 500) return RISK_LEVELS.MEDIUM;
    if (score >= 300) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.CRITICAL;
  }
}
class TierEngine {
  static evaluate(score, riskLevel) {
    if (riskLevel === RISK_LEVELS.CRITICAL || score < 200) return TIERS.HIGH_RISK;
    if (score < 400) return TIERS.UNVERIFIED;
    if (score < 600) return TIERS.BRONZE;
    if (score < 800) return TIERS.SILVER;
    if (score < 900) return TIERS.GOLD;
    return TIERS.PLATINUM;
  }
}
class RecommendationEngine {
  static evaluate(tier, riskLevel, eventMsg) {
    if (riskLevel === RISK_LEVELS.CRITICAL || tier === TIERS.HIGH_RISK) {
      return {
        recommendation: RECOMMENDATIONS.REJECT,
        explanation: `Rejecting future interactions due to CRITICAL risk or HIGH_RISK tier following: ${eventMsg}.`,
      };
    }
    if (riskLevel === RISK_LEVELS.HIGH) {
      return {
        recommendation: RECOMMENDATIONS.DEPOSIT,
        explanation: `Mandating increased security deposit due to HIGH risk profile following: ${eventMsg}.`,
      };
    }
    if (tier === TIERS.PLATINUM || tier === TIERS.GOLD) {
      return {
        recommendation: RECOMMENDATIONS.REWARD,
        explanation: `Rewarding customer (Tier: ${tier}) with premium perks following: ${eventMsg}.`,
      };
    }
    if (riskLevel === RISK_LEVELS.LOW || riskLevel === RISK_LEVELS.VERY_LOW) {
      return {
        recommendation: RECOMMENDATIONS.APPROVE,
        explanation: `Automatically approving standard interactions based on low risk profile following: ${eventMsg}.`,
      };
    }
    
    // Default fallback
    return {
      recommendation: RECOMMENDATIONS.REVIEW,
      explanation: `Manual review required for intermediate risk profile following: ${eventMsg}.`,
    };
  }
}
// 4. MAIN FACADE
const algorithmService = {
  processEvent: ({ currentTrust, event, metadata = {}, previousEvents = [] }) => {
    // Pipeline Execution
    const trustState = TrustEngine.evaluate(currentTrust, event, metadata);
    const riskLevel = RiskEngine.evaluate(trustState.score, event, metadata, previousEvents);
    const tier = TierEngine.evaluate(trustState.score, riskLevel);
    const recState = RecommendationEngine.evaluate(tier, riskLevel, trustState.msg);
    // Final Output Matrix
    return {
        score: trustState.score,
        tier,
        riskLevel,
        recommendation: recState.recommendation,
        explanation: recState.explanation,
        scoreDelta: trustState.delta,
        };
  },
};
export default algorithmService;