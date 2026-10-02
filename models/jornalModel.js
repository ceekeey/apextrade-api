import mongoose from "mongoose";

const jornalSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // TRADING PLAN
    // =====================================================

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: false,
      default: null,
    },

    // =====================================================
    // MARKET
    // =====================================================

    asset: {
      type: String,
      required: [true, "Please provide the asset symbol."],
      trim: true,
      uppercase: true,
    },

    // =====================================================
    // TRADE DIRECTION
    // =====================================================

    type: {
      type: String,
      enum: ["LONG", "SHORT", "BUY", "SELL"],
      required: [true, "Please specify trade direction."],
      uppercase: true,
    },

    // =====================================================
    // TRADE PRICES
    // =====================================================

    entryPrice: {
      type: Number,
      required: [true, "Please specify the entry price."],
      min: 0,
    },

    stopLoss: {
      type: Number,
      default: 0,
      min: 0,
    },

    takeProfit: {
      type: Number,
      default: 0,
      min: 0,
    },

    exitPrice: {
      type: Number,
      required: [true, "Please specify the exit price."],
      min: 0,
    },

    // =====================================================
    // POSITION / RISK
    // =====================================================

    lotSize: {
      type: Number,
      required: [true, "Please specify the position size/lots."],
      min: 0,
    },

    risk: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // PERFORMANCE
    // =====================================================

    pnl: {
      type: Number,
      required: [true, "Please provide the Profit or Loss amount."],
    },

    result: {
      type: String,
      enum: ["Win", "Loss", "Break Even"],
      default: "Break Even",
    },

    // =====================================================
    // TRADE SETUP
    // =====================================================

    setup: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // EMOTIONS
    // =====================================================

    emotion: {
      type: String,
      enum: [
        "FOCUSED",
        "CONFIDENT",
        "DISCIPLINED",
        "CALM",
        "ANXIOUS",
        "UNCERTAIN",
        "FEARFUL",
        "GREEDY",
        "FRUSTRATED",
        "IMPULSIVE",
        "FOMO",
        "REVENGE",
      ],
      default: "CALM",
    },

    afterEmotion: {
      type: String,
      enum: [
        "FOCUSED",
        "CONFIDENT",
        "DISCIPLINED",
        "CALM",
        "ANXIOUS",
        "UNCERTAIN",
        "FEARFUL",
        "GREEDY",
        "FRUSTRATED",
        "IMPULSIVE",
        "FOMO",
        "REVENGE",
        "",
      ],
      default: "",
    },

    // =====================================================
    // NOTES
    // =====================================================

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // MULTI-TIMEFRAME CHART IMAGES
    // =====================================================

    highTimeFrameImage: {
      type: String,
      default: null,
    },

    mediumTimeFrameImage: {
      type: String,
      default: null,
    },

    lowTimeFrameImage: {
      type: String,
      default: null,
    },

    // =====================================================
    // TRADE DATE
    // =====================================================

    date: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
);

// =====================================================
// INDEXES
// =====================================================

jornalSchema.index({
  user: 1,
  date: -1,
});

jornalSchema.index({
  user: 1,
  asset: 1,
});

jornalSchema.index({
  user: 1,
  result: 1,
});

// =====================================================
// MODEL
// =====================================================

const Jornal = mongoose.model("Jornal", jornalSchema);

export default Jornal;
