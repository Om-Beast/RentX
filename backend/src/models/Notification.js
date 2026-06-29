import mongoose from "mongoose";
const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_CREATED   : "BOOKING_CREATED",
  PAYMENT_COMPLETED : "PAYMENT_COMPLETED",
  BOOKING_APPROVED  : "BOOKING_APPROVED",
  BOOKING_REJECTED  : "BOOKING_REJECTED",
  BOOKING_CANCELLED : "BOOKING_CANCELLED",
  SYSTEM            : "SYSTEM",
});
const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW    : "LOW",
  MEDIUM : "MEDIUM",
  HIGH   : "HIGH",
});

const notificationSchema = new mongoose.Schema(
  {
    
    user: {
      type     : mongoose.Schema.Types.ObjectId,
      ref      : "User",
      required : [true, "Notification must belong to a user."],
      index    : true,
    },
    
    type: {
      type     : String,
      enum     : {
        values  : Object.values(NOTIFICATION_TYPES),
        message : "'{VALUE}' is not a valid notification type.",
      },
      required : [true, "Notification type is required."],
    },
    
    title: {
      type      : String,
      required  : [true, "Notification title is required."],
      trim      : true,
      maxlength : [100, "Title cannot exceed 100 characters."],
    },
    
    message: {
      type      : String,
      required  : [true, "Notification message is required."],
      trim      : true,
      maxlength : [1000, "Message cannot exceed 1000 characters."],
    },
   
    priority: {
      type    : String,
      enum    : {
        values  : Object.values(NOTIFICATION_PRIORITIES),
        message : "'{VALUE}' is not a valid priority level.",
      },
      default : NOTIFICATION_PRIORITIES.MEDIUM,
    },
    
    isRead: {
      type    : Boolean,
      default : false,
    },
    
    metadata: {
      type    : mongoose.Schema.Types.Mixed,
      default : {},
    },
  },
  {
   
    timestamps : true,  // auto-adds createdAt & updatedAt
    versionKey : false, // disable __v field
    toJSON     : { virtuals: true },
    toObject   : { virtuals: true },
  }
);

notificationSchema.index(
  { user: 1, createdAt: -1 },
  { name: "idx_user_createdAt" }
);

notificationSchema.index(
  { user: 1, isRead: 1 },
  { name: "idx_user_isRead" }
);

notificationSchema.virtual("isUnread").get(function () {
  return !this.isRead;
});

notificationSchema.methods.markAsRead = async function () {
  if (this.isRead) return this; // no-op if already read
  this.isRead = true;
  return this.save();
};

notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

notificationSchema.statics.getPaginated = async function (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {}
) {
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100);
  const safePage  = Math.max(Number(page), 1);
  const skip      = (safePage - 1) * safeLimit;
  const filter = { user: userId };
  if (unreadOnly) filter.isRead = false;
  const [data, total] = await Promise.all([
    this.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    this.countDocuments(filter),
  ]);
  return {
    data,
    total,
    page       : safePage,
    totalPages : Math.ceil(total / safeLimit),
  };
};

notificationSchema.pre("save", function (next) {
  if (this.isModified("metadata") && this.metadata !== null) {
    if (typeof this.metadata !== "object" || Array.isArray(this.metadata)) {
      this.metadata = {};
    }
  }
  next();
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES };
export default Notification;