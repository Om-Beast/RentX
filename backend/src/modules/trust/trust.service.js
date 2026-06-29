import mongoose from "mongoose";
import User from "../../models/User.js";
import TrustHistory, {
  TRUST_EVENT_TYPES,
} from "../../models/TrustHistory.js";

const SCORE_BOUNDS = Object.freeze({
  MIN: 0,
  MAX: 1000,
});

const EVENT_CONFIG = Object.freeze({
  [TRUST_EVENT_TYPES.BOOKING_COMPLETED]: {
    delta: +5,
    reason: "Booking completed successfully.",
  },

  [TRUST_EVENT_TYPES.BOOKING_CANCELLED]: {
    delta: -5,
    reason: "Booking cancelled by user.",
  },

  [TRUST_EVENT_TYPES.PAYMENT_SUCCESS]: {
    delta: +2,
    reason: "Payment completed successfully.",
  },

  [TRUST_EVENT_TYPES.PAYMENT_FAILED]: {
    delta: -8,
    reason: "Payment failed.",
  },

  [TRUST_EVENT_TYPES.OWNER_APPROVED]: {
    delta: +2,
    reason: "Fleet owner approved booking.",
  },

  [TRUST_EVENT_TYPES.OWNER_REJECTED]: {
    delta: -2,
    reason: "Fleet owner rejected booking.",
  },

  [TRUST_EVENT_TYPES.DOCUMENT_VERIFIED]: {
    delta: +10,
    reason: "Identity documents verified.",
  },

  [TRUST_EVENT_TYPES.LATE_RETURN]: {
    delta: -10,
    reason: "Vehicle returned late.",
  },
});

const afterScoreChangeHooks = [];
async function runAfterScoreChangeHooks(ctx) {
  for (const hook of afterScoreChangeHooks) {
    try {
      await hook(ctx);
    } catch (error) {
      console.error(
        `[TrustService] afterScoreChange hook failed:`,
        error.message,
      );
    }
  }
}

function clampScore(value) {
  return Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, value));
}

function toObjectId(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error(`Invalid user ID: ${userId}`);
  }
  return new mongoose.Types.ObjectId(userId);
}

async function applyScoreDelta({
  userId,
  delta,
  reason,
  eventType,
  bookingId = null,
  actorId = null,
  metadata = {},
}) {
  const uid = toObjectId(userId);
  const currentUser = await User.findById(uid).select('trustScore').lean();
  if (!currentUser) {
    throw new Error(`User not found: ${userId}`);
  }
  const previousScore =currentUser.trustScore ?? 100; 
  const newScore = clampScore(previousScore + delta);
  const actualDelta = newScore - previousScore;
  const updatedUser = await User.findByIdAndUpdate(
    uid,
    { $set: { trustScore: newScore } },
    { new: true, runValidators: true },
  );
  if (!updatedUser) {
    throw new Error(`Failed to update trust score for user: ${userId}`);
  }
  const historyEntry = await TrustHistory.create({
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
  const ctx = {
    user: updatedUser,
    previousScore,
    newScore,
    delta: actualDelta,
    eventType,
    reason,
    bookingId,
    actorId,
    metadata,
    historyEntry,
  };
  runAfterScoreChangeHooks(ctx).catch((err) => {
    console.error('[TrustService] Hook execution error:', err.message);
  });
  return updatedUser;
}



const TrustService = {
  async applyEvent(userId, eventType, options = {}) {
    const config = EVENT_CONFIG[eventType];
    if (!config) {
      throw new Error(
        `Unsupported trust event type: "${eventType}". ` +
        `Valid types: ${Object.keys(EVENT_CONFIG).join(', ')}`,
      );
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
  async increase(userId, points, reason, options = {}) {
    if (typeof points !== 'number' || points <= 0) {
      throw new Error(
        `Points must be a positive number. Received: ${points}`,
      );
    }
    return applyScoreDelta({
      userId,
      delta: +points,
      reason,
      eventType: options.eventType ?? TRUST_EVENT_TYPES.BOOKING_COMPLETED,
      bookingId: options.bookingId ?? null,
      actorId: options.actorId ?? null,
      metadata: { ...options.metadata, adjustmentType: 'manual_increase' },
    });
  },
  async decrease(userId, points, reason, options = {}) {
    if (typeof points !== 'number' || points <= 0) {
      throw new Error(
        `Points must be a positive number. Received: ${points}`,
      );
    }
    return applyScoreDelta({
      userId,
      delta: -points,
      reason,
      eventType: options.eventType ?? TRUST_EVENT_TYPES.BOOKING_CANCELLED,
      bookingId: options.bookingId ?? null,
      actorId: options.actorId ?? null,
      metadata: { ...options.metadata, adjustmentType: 'manual_decrease' },
    });
  },
  async getHistory(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      eventType = null,
      startDate = null,
      endDate = null,
    } = options;
    const uid = toObjectId(userId);
    const filter = { user: uid };
    if (eventType) {
      if (!EVENT_CONFIG[eventType]) {
        throw new Error(`Invalid event type filter: "${eventType}"`);
      }
      filter.eventType = eventType;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      TrustHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('booking', 'bookingId status')
        .populate('actor', 'name email')
        .lean()
        .exec(),
      TrustHistory.countDocuments(filter).exec(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  async recalculate(userId) {
  const updatedUser = await User.findById(uid);
    const uid = toObjectId(userId);
    const user = await User.findById(uid);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    const history = await TrustHistory.find({ user: uid })
      .sort({ createdAt: 1 })
      .select('delta')
      .lean()
      .exec();
    const BASE_SCORE = 100;
    let computedScore = BASE_SCORE;
    for (const entry of history) {
      computedScore = clampScore(computedScore + entry.delta);
    }
    updatedUser.trustScore= computedScore;
    await user.save({ validateModifiedOnly: true });
    return {
      user: updatedUser,
      replayedEvents: history.length,
      computedScore,
    };
  },
  onAfterScoreChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('afterScoreChange hook must be a function.');
    }
    afterScoreChangeHooks.push(callback);
  },
  EVENT_TYPES: TRUST_EVENT_TYPES,
  SCORE_BOUNDS,
  EVENT_CONFIG,
};
export default TrustService;
