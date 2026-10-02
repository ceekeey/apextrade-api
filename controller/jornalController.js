import Jornal from "../models/jornalModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete uploaded files on error
const deleteUploadedFiles = (files) => {
  if (!files) return;

  const fields = [
    "highTimeFrameImage",
    "mediumTimeFrameImage",
    "lowTimeFrameImage",
  ];
  fields.forEach((fieldName) => {
    if (files[fieldName] && files[fieldName][0]) {
      const filePath = files[fieldName][0].path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
};

// @desc    Create new journal entry
// @route   POST /api/jornal/create
// @access  Private
export const createJornal = async (req, res) => {
  try {
    const {
      asset,
      type,
      pnl,
      entryPrice,
      stopLoss,
      takeProfit,
      exitPrice,
      lotSize,
      risk,
      result,
      setup,
      emotion,
      afterEmotion,
      notes,
      date,
      plan,
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!asset || !type) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Asset and trade type are required.",
      });
    }

    if (!["LONG", "SHORT"].includes(type)) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Trade type must be LONG or SHORT.",
      });
    }

    if (pnl === undefined || pnl === null || pnl === "") {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "P&L is required.",
      });
    }

    if (entryPrice === undefined || entryPrice === null || entryPrice === "") {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Entry price is required.",
      });
    }

    if (exitPrice === undefined || exitPrice === null || exitPrice === "") {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Exit price is required.",
      });
    }

    if (lotSize === undefined || lotSize === null || lotSize === "") {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Lot size is required.",
      });
    }

    // -----------------------------------------
    // NUMERIC VALIDATION
    // -----------------------------------------

    const numericPnl = Number(pnl);
    const numericEntryPrice = Number(entryPrice);
    const numericStopLoss =
      stopLoss === undefined || stopLoss === "" ? 0 : Number(stopLoss);

    const numericTakeProfit =
      takeProfit === undefined || takeProfit === "" ? 0 : Number(takeProfit);

    const numericExitPrice = Number(exitPrice);
    const numericLotSize = Number(lotSize);

    const numericRisk = risk === undefined || risk === "" ? 0 : Number(risk);

    if (
      !Number.isFinite(numericPnl) ||
      !Number.isFinite(numericEntryPrice) ||
      !Number.isFinite(numericExitPrice) ||
      !Number.isFinite(numericLotSize)
    ) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message:
          "P&L, entry price, exit price and lot size must be valid numbers.",
      });
    }

    if (
      !Number.isFinite(numericStopLoss) ||
      !Number.isFinite(numericTakeProfit) ||
      !Number.isFinite(numericRisk)
    ) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Stop loss, take profit and risk must be valid numbers.",
      });
    }

    // -----------------------------------------
    // RESULT VALIDATION
    // -----------------------------------------

    const allowedResults = ["Win", "Loss", "Break Even"];

    if (
      result !== undefined &&
      result !== null &&
      !allowedResults.includes(result)
    ) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Result must be Win, Loss or Break Even.",
      });
    }

    // -----------------------------------------
    // PROCESS UPLOADED FILES
    // -----------------------------------------

    const highTimeFrameImage = req.files?.highTimeFrameImage?.[0]
      ? `/upload/journals/${req.files.highTimeFrameImage[0].filename}`
      : null;

    const mediumTimeFrameImage = req.files?.mediumTimeFrameImage?.[0]
      ? `/upload/journals/${req.files.mediumTimeFrameImage[0].filename}`
      : null;

    const lowTimeFrameImage = req.files?.lowTimeFrameImage?.[0]
      ? `/upload/journals/${req.files.lowTimeFrameImage[0].filename}`
      : null;

    // -----------------------------------------
    // CREATE JOURNAL
    // -----------------------------------------

    const newJornal = await Jornal.create({
      user: req.user._id,

      plan: plan || null,

      asset,
      type,

      pnl: numericPnl,

      entryPrice: numericEntryPrice,
      stopLoss: numericStopLoss,
      takeProfit: numericTakeProfit,
      exitPrice: numericExitPrice,

      lotSize: numericLotSize,
      risk: numericRisk,

      result: result || "Break Even",

      setup: setup || "",
      emotion:
        emotion &&
        [
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
        ].includes(emotion)
          ? emotion
          : "CALM",
      afterEmotion: afterEmotion || "",

      notes: notes || "",

      highTimeFrameImage,
      mediumTimeFrameImage,
      lowTimeFrameImage,

      date: date || Date.now(),
    });

    // -----------------------------------------
    // POPULATE PLAN
    // -----------------------------------------

    const populatedJornal = await Jornal.findById(newJornal._id).populate(
      "plan",
      "name description",
    );

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message: "Journal entry created successfully.",
      data: populatedJornal,
    });
  } catch (error) {
    // Clean up uploaded files on error
    deleteUploadedFiles(req.files);

    console.error("Error creating journal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create journal entry. Try again later.",
    });
  }
};

// =====================================================
// GET ALL JOURNALS
// =====================================================

// @desc    Get all journal entries for logged-in user
// @route   GET /api/jornal/all
// @access  Private
export const allJornal = async (req, res) => {
  try {
    const journals = await Jornal.find({
      user: req.user._id,
    })
      .populate("plan", "name description")
      .sort({ date: -1 });

    const totalPnl = journals.reduce(
      (acc, curr) => acc + Number(curr.pnl || 0),
      0,
    );

    const totalTrades = journals.length;

    const winningTrades = journals.filter(
      (journal) => Number(journal.pnl || 0) > 0,
    ).length;

    const losingTrades = journals.filter(
      (journal) => Number(journal.pnl || 0) < 0,
    ).length;

    const breakEvenTrades = journals.filter(
      (journal) => Number(journal.pnl || 0) === 0,
    ).length;

    const winRate =
      totalTrades > 0
        ? ((winningTrades / totalTrades) * 100).toFixed(2)
        : "0.00";

    return res.status(200).json({
      success: true,

      count: totalTrades,

      stats: {
        totalPnl,
        winRate: `${winRate}%`,
        winningTrades,
        losingTrades,
        breakEvenTrades,
      },

      data: journals,
    });
  } catch (error) {
    console.error("Error fetching journals:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries. Try again later.",
    });
  }
};

// =====================================================
// GET SINGLE JOURNAL
// =====================================================

// @desc    Get single journal entry by ID
// @route   GET /api/jornal/:id
// @access  Private
export const singleJornal = async (req, res) => {
  try {
    const { id } = req.params;

    const jornal = await Jornal.findOne({
      _id: id,
      user: req.user._id,
    }).populate("plan", "name description rules");

    if (!jornal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: jornal,
    });
  } catch (error) {
    console.error("Error fetching single journal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal entry. Try again later.",
    });
  }
};

// =====================================================
// DELETE JOURNAL
// =====================================================

// @desc    Delete journal entry
// @route   DELETE /api/jornal/delete/:id
// @access  Private
export const deleteJornal = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    const jornal = await Jornal.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!jornal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Journal entry deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting journal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete journal entry. Try again later.",
    });
  }
};

// =====================================================
// UPDATE JOURNAL
// =====================================================

// @desc    Update journal entry
// @route   PUT /api/jornal/update/:id
// @access  Private
export const updateJornal = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    const jornal = await Jornal.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!jornal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found or unauthorized.",
      });
    }

    const updates = {
      ...req.body,
    };

    // Never allow ownership changes
    delete updates.user;

    // Never allow changing these through body
    delete updates._id;
    delete updates.__v;

    const updatedJornal = await Jornal.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).populate("plan", "name description");

    return res.status(200).json({
      success: true,
      message: "Journal entry updated successfully.",
      data: updatedJornal,
    });
  } catch (error) {
    console.error("Error updating journal:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update journal entry. Try again later.",
    });
  }
};
