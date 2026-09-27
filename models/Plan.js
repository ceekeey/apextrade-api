import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    rules: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function (rules) {
          return rules.every(
            (rule) =>
              typeof rule === "string" &&
              rule.trim().length > 0 &&
              rule.trim().length <= 500,
          );
        },
        message:
          "Every rule must be a non-empty string with max 500 characters",
      },
    },

    image: {
      data: {
        type: String,
        default: null,
      },

      mimeType: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
