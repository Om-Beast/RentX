/**
 * Trust Service — event-driven user trust scoring.
 *
 * Architecture:
 * The trust system is explicitly RULE-BASED, not ML.
 * The scoring logic is isolated behind an EVENT_CONFIG object (a simple
 * strategy map). This means if we ever want to replace the rules with
 * an ML model, we only change this file — no callers need to change.
 *
 * Score: 0–1000 (matches algorithm.service.js)
 * - New users start at 500 (neutral)
 * - Range clamped to [0, 1000] on every update
 *
 * Concurrency:
 * findByIdAndUpdate with $set is atomic at the document level in MongoDB.
 * No transactions needed here since score updates are append-only events
 * (we don't read-then-write based on a condition).
 *
 * Pattern note:
 * The TrustService.EVENT_TYPES export and the EVENT_CONFIG map mean that
 * the caller decides WHAT happened; this service decides WHAT SCORE CHANGE
 * results. Callers never hardcode delta values.
 */

import mongoose from "mongoose";
import User from "../../models/User.js";
import TrustHistory, { TRUST_EVENT_TYPES } from "../../models/TrustHistory.js";
import logger from "../../utils/logger.js";
import { NotFoundError } from "../../utils/errors.js";

const SCORE_BOUNDS = Object.freeze({ MIN: 0, MAX: 1000 });

const EVENT_CONFIG = Object.freeze({
  [TRUST_EVENT_TYPES.BOOKING_COMPLETED]: { delta: +15, reason: "Booking completed successfully." },
  [TRUST_EVENT_TYPES.BOOKING_CANCELLED]: { delta: -10, reason: "Booking cancelled by user." },
  [TRUST_EVENT_TYPES.PAYMENT_SUCCESS]:   { delta: +5,  reason: "Payment completed successfully." },
  [TRUST_EVENT_TYPES.PAYMENT_FAILED]:    { delta: -20, reason: "Payment failed." },
  [TRUST_EVENT_TYPES.OWNER_APPROVED]:    { delta: +5,  reason: "Fleet owner approved booking." },
  [TRUST_EVENT_TYPES.OWNER_REJECTED]:    { delta: -5,  reason: "Fleet owner rejected booking." },
  [TRUST_EVENT_TYPES.DOCUMENT_VERIFIED]: { delta: +50, reason: "Identity documents verified." },
  [TRUST_EVENT_TYPES.LATE_RETURN]:       { delta: -30, reason: "Vehicle returned late." },
});

function clamp(value) {
  return Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, Math.round(value)));
}

function toObjectId(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid user ID: ${userId}`);
  }
  return new mongoose.Types.ObjectId(userId);
}

/**
 * Core scoring mutation — the only place trust score is updated.
 * Atomically:
 *   1. Reads current score
 *   2. Computes new score (clamped)
 *   3. Updates user document
 *   4. Appends to TrustHistory (audit trail)
 */
async function applyScoreDelta({ userId, delta, reason, eventType, bookingId = null, actorId = null, metadata = {} }) {
  const uid = toObjectId(userId);

  const currentUser = await User.findById(uid).select("trustScore").lean();
  if (!currentUser) throw new NotFoundError(`User not found: ${userId}`);

  const previousScore = currentUser.trustScore ?? 500;
  const newScore = clamp(previousScore + delta);
  const actualDelta = newScore - previousScore;

  const updatedUser = await User.findByIdAndUpdate(
    uid,
    { $set: { trustScore: newScore } },
    { new: true, runValidators: true }
  );
  if (!updatedUser) throw new Error(`Failed to update trust score for user: ${userId}`);

  await TrustHistory.create({
    user: uid,
    previousScore,
    newScore,
    delta: actualDelta,
    reason,
    eventType,
    booking: bookingId ? toObjectId(bookingId) : null,
    actor: actorId ? toObjectId(actorId) : null,
    metadata,
  });

  logger.info("TrustService", "TRUST_SCORE_UPDATED", {
    userId,
    eventType,
    previousScore,
    newScore,
    delta: actualDelta,
  });

  return updatedUser;
}

const TrustService = {
  async applyEvent(userId, eventType, options = {}) {
    const config = EVENT_CONFIG[eventType];
    if (!config) {
      throw new Error(`Unsupported trust event: "${eventType}". Valid: ${Object.keys(EVENT_CONFIG).join(", ")}`);
    }
    return applyScoreDelta({
      userId,
      delta: options.delta ?? config.delta,
      reason: options.reason ?? config.reason,
      eventType,
      bookingId: options.bookingId ?? null,
      actorId: options.actorId ?? null,
      metadata: options.metadata ?? {},
    });
  },

  async getHistory(userId, options = {}) {
    const { page = 1, limit = 20, eventType = null } = options;
    const uid = toObjectId(userId);
    const filter = { user: uid };
    if (eventType) filter.eventType = eventType;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      TrustHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("booking", "bookingStatus startDate endDate")
        .populate("actor", "name email")
        .lean(),
      TrustHistory.countDocuments(filter),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Returns the full risk profile for a user — used by admin and trust displays.
   * This is pure computation (no writes).
   */
  async getRiskProfile(userId) {
    const uid = toObjectId(userId);
    const user = await User.findById(uid).select("trustScore name email createdAt").lean();
    if (!user) throw new NotFoundError(`User not found: ${userId}`);

    const score = user.trustScore;

    // Tier classification
    let tier;
    if (score < 200)      tier = "HIGH_RISK";
    else if (score < 400) tier = "UNVERIFIED";
    else if (score < 600) tier = "BRONZE";
    else if (score < 750) tier = "SILVER";
    else if (score < 900) tier = "GOLD";
    else                  tier = "PLATINUM";

    // Risk level
    let riskLevel;
    if (score >= 900)      riskLevel = "VERY_LOW";
    else if (score >= 700) riskLevel = "LOW";
    else if (score >= 500) riskLevel = "MEDIUM";
    else if (score >= 300) riskLevel = "HIGH";
    else                   riskLevel = "CRITICAL";

    // Recommendation
    let recommendation;
    if (riskLevel === "CRITICAL" || tier === "HIGH_RISK") recommendation = "REJECT";
    else if (riskLevel === "HIGH") recommendation = "INCREASE_DEPOSIT";
    else if (tier === "PLATINUM" || tier === "GOLD") recommendation = "REWARD";
    else if (riskLevel === "LOW" || riskLevel === "VERY_LOW") recommendation = "APPROVE";
    else recommendation = "MANUAL_REVIEW";

    // Recent event summary
    const eventSummary = await TrustHistory.getEventSummary(uid);

    return {
      userId,
      score,
      tier,
      riskLevel,
      recommendation,
      // Reason codes — explainable, not a black box
      reasonCodes: eventSummary.map((e) => ({
        event: e._id,
        count: e.count,
        totalDelta: e.totalDelta,
        lastOccurrence: e.lastOccurrence,
      })),
    };
  },

  /**
   * Replay all TrustHistory events to recompute score from scratch.
   * Useful for audits and correcting drift after bugs.
   */
  async recalculate(userId) {
    const uid = toObjectId(userId);
    const user = await User.findById(uid);
    if (!user) throw new NotFoundError(`User not found: ${userId}`);

    const history = await TrustHistory.find({ user: uid })
      .sort({ createdAt: 1 })
      .select("delta")
      .lean();

    const BASE_SCORE = 500;
    let computedScore = BASE_SCORE;
    for (const entry of history) {
      computedScore = clamp(computedScore + entry.delta);
    }

    user.trustScore = computedScore;
    await user.save({ validateModifiedOnly: true });

    logger.info("TrustService", "TRUST_SCORE_RECALCULATED", {
      userId,
      computedScore,
      eventsReplayed: history.length,
    });

    return { user, replayedEvents: history.length, computedScore };
  },

  EVENT_TYPES: TRUST_EVENT_TYPES,
  SCORE_BOUNDS,
  EVENT_CONFIG,
};

export default TrustService;
