/**
 * TRUST ENGINE & CANCELLATION POLICY TESTS
 *
 * These are pure unit tests — no HTTP, no DB needed.
 * Tests the deterministic rule-based scoring system.
 */

import algorithmService from "../src/modules/trust/services/algorithm.service.js";
import { determineRefund } from "../src/modules/bookings/cancellation.service.js";

// ─── Trust Algorithm ──────────────────────────────────────────────────────────

describe("Trust Algorithm — Score Bounds", () => {
  test("Score never exceeds 1000 (upper bound clamp)", () => {
    const result = algorithmService.processEvent({ currentTrust: 995, event: "BOOKING_COMPLETED", metadata: {} });
    expect(result.score).toBe(1000);
    expect(result.score).toBeLessThanOrEqual(1000);
  });

  test("Score never goes below 0 (lower bound clamp)", () => {
    const result = algorithmService.processEvent({ currentTrust: 5, event: "PAYMENT_FAILED", metadata: {} });
    expect(result.score).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("Trust Algorithm — Event Deltas", () => {
  test("BOOKING_COMPLETED adds 15 points", () => {
    const result = algorithmService.processEvent({ currentTrust: 500, event: "BOOKING_COMPLETED", metadata: {} });
    expect(result.score).toBe(515);
    expect(result.scoreDelta).toBe(15);
  });

  test("PAYMENT_FAILED subtracts 50 points", () => {
    const result = algorithmService.processEvent({ currentTrust: 500, event: "PAYMENT_FAILED", metadata: {} });
    expect(result.score).toBe(450);
    expect(result.scoreDelta).toBe(-50);
  });

  test("DAMAGE_REPORTED SEVERE has larger penalty than MINOR", () => {
    const severe = algorithmService.processEvent({ currentTrust: 500, event: "DAMAGE_REPORTED", metadata: { severity: "SEVERE" } });
    const minor  = algorithmService.processEvent({ currentTrust: 500, event: "DAMAGE_REPORTED", metadata: { severity: "MINOR" } });
    expect(severe.score).toBeLessThan(minor.score);
  });

  test("LATE_RETURN penalty scales with hours late", () => {
    const oneHour    = algorithmService.processEvent({ currentTrust: 500, event: "LATE_RETURN", metadata: { hoursLate: 1 } });
    const threeHours = algorithmService.processEvent({ currentTrust: 500, event: "LATE_RETURN", metadata: { hoursLate: 3 } });
    expect(threeHours.score).toBeLessThan(oneHour.score);
  });

  test("Unknown event returns unchanged score with delta 0", () => {
    const result = algorithmService.processEvent({ currentTrust: 600, event: "NONEXISTENT_EVENT_XYZ", metadata: {} });
    expect(result.score).toBe(600);
    expect(result.scoreDelta).toBe(0);
  });
});

describe("Trust Algorithm — Tier Classification", () => {
  test("Score >= 900 → PLATINUM tier", () => {
    const result = algorithmService.processEvent({ currentTrust: 950, event: "BOOKING_COMPLETED", metadata: {} });
    expect(result.tier).toBe("PLATINUM");
  });

  test("Score < 200 or CRITICAL risk → HIGH_RISK tier with REJECT recommendation", () => {
    const result = algorithmService.processEvent({ currentTrust: 50, event: "DAMAGE_REPORTED", metadata: { severity: "SEVERE" } });
    expect(result.tier).toBe("HIGH_RISK");
    expect(result.recommendation).toBe("Reject Booking");
    expect(result.riskLevel).toBe("CRITICAL");
  });

  test("PAYMENT_FAILED triggers HIGH risk level", () => {
    const result = algorithmService.processEvent({ currentTrust: 600, event: "PAYMENT_FAILED", metadata: {} });
    expect(result.riskLevel).toBe("HIGH");
  });

  test("PLATINUM + GOLD tier gets REWARD recommendation", () => {
    const gold     = algorithmService.processEvent({ currentTrust: 850, event: "BOOKING_COMPLETED", metadata: {} });
    const platinum = algorithmService.processEvent({ currentTrust: 950, event: "BOOKING_COMPLETED", metadata: {} });
    expect(gold.recommendation).toBe("Reward Customer");
    expect(platinum.recommendation).toBe("Reward Customer");
  });
});

// ─── Cancellation Refund Policy ───────────────────────────────────────────────

describe("Cancellation Refund Policy", () => {
  function makeBooking(hoursFromNow, totalAmount = 4639) {
    const start = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    return {
      startDate: start,
      totalAmount,
      baseAmount: 3000,
      gstAmount: 540,
      platformFee: 99,
      securityDeposit: 1000,
    };
  }

  test("48h+ before pickup → FULL_REFUND_48H_PLUS policy (100%)", () => {
    const booking = makeBooking(72);
    const result = determineRefund(booking, "CUSTOMER");
    expect(result.refundPercent).toBe(100);
    expect(result.policy).toBe("FULL_REFUND_48H_PLUS");
    // Refund = base + gst + deposit (not platform fee)
    expect(result.refundAmount).toBe(3000 + 540 + 1000);
  });

  test("24-48h before pickup → PARTIAL_REFUND_24_48H policy (50%)", () => {
    const booking = makeBooking(36);
    const result = determineRefund(booking, "CUSTOMER");
    expect(result.refundPercent).toBe(50);
    expect(result.policy).toBe("PARTIAL_REFUND_24_48H");
  });

  test("<24h before pickup → NO_REFUND_UNDER_24H policy (deposit only)", () => {
    const booking = makeBooking(10);
    const result = determineRefund(booking, "CUSTOMER");
    expect(result.refundPercent).toBe(0);
    expect(result.refundAmount).toBe(1000); // Security deposit returned
    expect(result.policy).toBe("NO_REFUND_UNDER_24H");
  });

  test("Owner cancel → always full refund regardless of timing", () => {
    const booking = makeBooking(2); // < 24h
    const result = determineRefund(booking, "FLEET_OWNER");
    expect(result.refundPercent).toBe(100);
    expect(result.policy).toBe("OWNER_ADMIN_CANCELLATION_FULL_REFUND");
  });

  test("Admin cancel → always full refund", () => {
    const booking = makeBooking(1); // 1 hour away
    const result = determineRefund(booking, "ADMIN");
    expect(result.refundPercent).toBe(100);
    expect(result.policy).toBe("OWNER_ADMIN_CANCELLATION_FULL_REFUND");
  });
});
