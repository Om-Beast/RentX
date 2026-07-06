export const RISK_LEVELS = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

export const RECOMMENDATIONS = Object.freeze({
  APPROVE: "APPROVE",
  MANUAL_REVIEW: "MANUAL_REVIEW",
  INCREASE_DEPOSIT: "INCREASE_DEPOSIT",
  REJECT: "REJECT",
});

export const RISK_WEIGHTS = Object.freeze({
  trustScore: 0.20,
  cancellationRate: 0.12,
  lateReturnRate: 0.12,
  paymentReliability: 0.15,
  bookingHistory: 0.10,
  vehicleCategory: 0.08,
  bookingDuration: 0.08,
  rentalAmount: 0.05,
  reviewScore: 0.05,
  contextualFlags: 0.05,
});

export const VEHICLE_RISK_TIERS = Object.freeze({
  ECONOMY: 0.10,
  COMPACT: 0.15,
  SEDAN: 0.20,
  SUV: 0.40,
  PREMIUM_SUV: 0.60,
  LUXURY: 0.75,
  SUPERCAR: 0.90,
});

export const DURATION_RISK_TIERS = Object.freeze([
  { label: "SHORT", maxDays: 3, riskScore: 0.10 },
  { label: "STANDARD", maxDays: 7, riskScore: 0.25 },
  { label: "EXTENDED", maxDays: 14, riskScore: 0.50 },
  { label: "LONG_TERM", maxDays: 30, riskScore: 0.70 },
  { label: "EXTREME", maxDays: Infinity, riskScore: 0.90 },
]);

export const AMOUNT_RISK_TIERS = Object.freeze([
  { label: "LOW", maxAmount: 5000, riskScore: 0.10 },
  { label: "MODERATE", maxAmount: 15000, riskScore: 0.30 },
  { label: "HIGH", maxAmount: 50000, riskScore: 0.60 },
  { label: "PREMIUM", maxAmount: Infinity, riskScore: 0.85 },
]);