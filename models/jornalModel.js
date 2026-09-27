import mongoose from "mongoose";

const jornalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan", // References your trading plan model
      required: false, // Set to true if a plan must always be attached
    },
    asset: {
      type: String,
      required: [
        true,
        "Please provide the asset symbol (e.g., EURUSD, BTCUSDT, AAPL)",
      ],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["LONG", "SHORT", "BUY", "SELL"],
      required: [true, "Please specify trade direction"],
    },
    pnl: {
      type: Number,
      required: [true, "Please provide the Profit or Loss amount"],
    },
    entryPrice: {
      type: Number,
      required: [true, "Please specify the entry price"],
    },
    exitPrice: {
      type: Number,
      required: [true, "Please specify the exit price"],
    },
    lotSize: {
      type: Number,
      required: [true, "Please specify the position size/lots"],
    },
    setup: {
      type: String,
      trim: true,
    },
    emotion: {
      type: String,
      enum: ["CONFIDENT", "FOMO", "REVENGE", "DISCIPLINED", "ANXIOUS", "CALM"],
      default: "CALM",
    },
    notes: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

jornalSchema.index({ user: 1, date: -1 });

const Jornal = mongoose.model("Jornal", jornalSchema);
export default Jornal;
