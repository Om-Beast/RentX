import mongoose from 'mongoose';
const trustScoreSchema = new mongoose.Schema(
  {
    // The user associated with this trust profile
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Strictly enforce one trust profile per user
    },
    // The primary aggregated AI trust score (scale of 0 to 1000)
    score: {
      type: Number,
      required: true,
      default: 300, // Baseline starting score
      min: [0, 'Trust score cannot drop below 0'],
      max: [1000, 'Trust score cannot exceed 1000'],
    },
    // Categorical classification for quick access control and perks
    tier: {
      type: String,
      enum: ['UNVERIFIED', 'HIGH_RISK', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'UNVERIFIED',
      required: true,
    },
    // --- Behavioral Metrics ---
    
    // Number of successfully completed trips without incident
    bookingCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Number of times the user returned a vehicle past the grace period
    lateReturns: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Lifetime cancellation rate percentage (0-100)
    cancelRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Number of confirmed damage incidents attributed to this user
    damageReports: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Percentage of successful, non-chargeback payments (0-100)
    paymentSuccess: {
      type: Number,
      default: 100, 
      min: 0,
      max: 100,
    },
    // --- Qualitative Feedback Metrics ---
    
    // Average rating received from vehicle owners (0-5 scale)
    ownerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    // Average rating received from renters when this user acts as a host
    customerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    // --- Identity & Verification Metrics ---
    
    // True if a valid government driving license is verified via API
    licenseVerified: {
      type: Boolean,
      default: false,
    },
    
    // True if core identity (Aadhaar/Passport + Liveness check) is verified
    identityVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically manages createdAt and updatedAt timestamps
    timestamps: true,
  }
);
// ==========================================
//                 INDEXES
// ==========================================
// Primary lookup index for attaching trust score data to user profiles quickly
trustScoreSchema.index({ user: 1 });
// Index for batch jobs or risk-engine queries (e.g., finding all HIGH_RISK users)
trustScoreSchema.index({ tier: 1 });
// Index for analytics and leaderboards (sorting by highest/lowest scores)
trustScoreSchema.index({ score: -1 });
const TrustScore = mongoose.models.TrustScore || mongoose.model('TrustScore', trustScoreSchema);
export default TrustScore;
