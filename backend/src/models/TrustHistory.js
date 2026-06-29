import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

export const TRUST_EVENT_TYPES = Object.freeze({
  BOOKING_COMPLETED:  'BOOKING_COMPLETED',
  BOOKING_CANCELLED:  'BOOKING_CANCELLED',
  PAYMENT_SUCCESS:    'PAYMENT_SUCCESS',
  PAYMENT_FAILED:     'PAYMENT_FAILED',
  OWNER_APPROVED:     'OWNER_APPROVED',
  OWNER_REJECTED:     'OWNER_REJECTED',
  DOCUMENT_VERIFIED:  'DOCUMENT_VERIFIED',
  LATE_RETURN:        'LATE_RETURN',
});
const VALID_EVENT_TYPES = Object.values(TRUST_EVENT_TYPES);
const trustHistorySchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Trust history entry must belong to a user.'],
      index: true,
    },
   
    previousScore: {
      type: Number,
      required: [true, 'Previous score is required.'],
      min: [0, 'Previous score cannot be negative.'],
      max: [100, 'Previous score cannot exceed 100.'],
    },
   
    newScore: {
      type: Number,
      required: [true, 'New score is required.'],
      min: [0, 'New score cannot be negative.'],
      max: [100, 'New score cannot exceed 100.'],
    },
    
    delta: {
      type: Number,
      required: [true, 'Delta is required.'],
    },
 
    reason: {
      type: String,
      required: [true, 'A reason must be provided for every score change.'],
      trim: true,
      maxlength: [500, 'Reason must be 500 characters or fewer.'],
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required.'],
      enum: {
        values: VALID_EVENT_TYPES,
        message: '{VALUE} is not a supported trust event type.',
      },
      index: true,
    },
    booking: {
      type: Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    actor: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
trustHistorySchema.index({ user: 1, createdAt: -1 });
trustHistorySchema.index({ eventType: 1, createdAt: -1 });
trustHistorySchema.index(
  { booking: 1 },
  { sparse: true }, 
);

trustHistorySchema.statics.getLatestForUser = function (userId) {
  return this.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};
trustHistorySchema.statics.getEventSummary = function (userId) {
  return this.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        totalDelta: { $sum: '$delta' },
        lastOccurrence: { $max: '$createdAt' },
      },
    },
    { $sort: { lastOccurrence: -1 } },
  ]).exec();
};
const TrustHistory = model('TrustHistory', trustHistorySchema);
export default TrustHistory;