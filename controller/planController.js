import Plan from "../models/Plan.js";
import mongoose from "mongoose";

/* =========================================================
   CREATE PLAN
========================================================= */

export const createPlan = async (req, res) => {
  try {
    const { name, description, rules, image } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }

    if (!Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        message: "Rules must be an array",
      });
    }

    // Clean rules
    const cleanedRules = rules
      .map((rule) => String(rule).trim())
      .filter((rule) => rule.length > 0);

    // Validate image if supplied
    let planImage = {
      data: null,
      mimeType: null,
    };

    if (image) {
      if (!image.data || !image.mimeType) {
        return res.status(400).json({
          success: false,
          message: "Image must contain data and mimeType",
        });
      }

      planImage = {
        data: image.data,
        mimeType: image.mimeType,
      };
    }

    const plan = await Plan.create({
      name: name.trim(),
      description: description?.trim() || "",
      rules: cleanedRules,
      image: planImage,
    });

    return res.status(201).json({
      success: true,
      message: "Trading plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create plan. Try again later.",
    });
  }
};

/* =========================================================
   GET ALL PLANS
========================================================= */

export const allPlan = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Error getting plans:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get plans. Try again later.",
    });
  }
};

/* =========================================================
   GET SINGLE PLAN (COMPLETED)
========================================================= */

export const singlePlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId to prevent CastErrors
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID format",
      });
    }

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Trading plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error getting single plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get plan. Try again later.",
    });
  }
};

/* =========================================================
   UPDATE PLAN
========================================================= */

export const editPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rules, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID format",
      });
    }

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Trading plan not found",
      });
    }

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name cannot be empty",
        });
      }

      plan.name = name.trim();
    }

    // Update description
    if (description !== undefined) {
      plan.description = description.trim();
    }

    // Update rules
    if (rules !== undefined) {
      if (!Array.isArray(rules)) {
        return res.status(400).json({
          success: false,
          message: "Rules must be an array",
        });
      }

      plan.rules = rules
        .map((rule) => String(rule).trim())
        .filter((rule) => rule.length > 0);
    }

    // Update image
    if (image !== undefined) {
      if (image === null) {
        plan.image = {
          data: null,
          mimeType: null,
        };
      } else {
        if (!image.data || !image.mimeType) {
          return res.status(400).json({
            success: false,
            message: "Image must contain data and mimeType",
          });
        }

        plan.image = {
          data: image.data,
          mimeType: image.mimeType,
        };
      }
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Trading plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update plan. Try again later.",
    });
  }
};

/* =========================================================
   DELETE PLAN
========================================================= */

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID format",
      });
    }

    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Trading plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trading plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete plan. Try again later.",
    });
  }
};
