import Jornal from "../models/jornalModel.js";

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
      exitPrice,
      lotSize,
      setup,
      emotion,
      notes,
      date,
      plan,
      highTimeFrameImage,
      mediumTimeFrameImage,
      lowTimeFrameImage,
    } = req.body;

    if (
      !asset ||
      !type ||
      pnl === undefined ||
      !entryPrice ||
      !exitPrice ||
      !lotSize
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required trade fields (asset, type, pnl, entryPrice, exitPrice, lotSize).",
      });
    }

    const newJornal = await Jornal.create({
      user: req.user._id,
      plan: plan || null,
      asset,
      type,
      pnl,
      entryPrice,
      exitPrice,
      lotSize,
      setup,
      emotion,
      notes,
      highTimeFrameImage: highTimeFrameImage || { data: null, mimeType: null },
      mediumTimeFrameImage: mediumTimeFrameImage || {
        data: null,
        mimeType: null,
      },
      lowTimeFrameImage: lowTimeFrameImage || { data: null, mimeType: null },
      date: date || Date.now(),
    });

    const populatedJornal = await Jornal.findById(newJornal._id).populate(
      "plan",
      "name description",
    );

    return res.status(201).json({
      success: true,
      message: "Journal entry created successfully.",
      data: populatedJornal,
    });
  } catch (error) {
    console.error("Error creating journal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create journal entry. Try again later.",
    });
  }
};

// @desc    Get all journal entries for logged-in user
// @route   GET /api/jornal/all
// @access  Private
export const allJornal = async (req, res) => {
  try {
    const journals = await Jornal.find({ user: req.user._id })
      .populate("plan", "name description")
      .sort({ date: -1 });

    const totalPnl = journals.reduce((acc, curr) => acc + curr.pnl, 0);
    const totalTrades = journals.length;
    const winningTrades = journals.filter((j) => j.pnl > 0).length;
    const winRate =
      totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      count: totalTrades,
      stats: {
        totalPnl,
        winRate: `${winRate}%`,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
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

// @desc    Delete journal entry
// @route   DELETE /api/jornal/delete/:id (or POST with id in body)
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

// @desc    Update journal entry
// @route   PUT /api/jornal/update/:id
// @access  Private
export const updateJornal = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const updates = req.body;

    let jornal = await Jornal.findOne({ _id: id, user: req.user._id });

    if (!jornal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found or unauthorized.",
      });
    }

    jornal = await Jornal.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("plan", "name description");

    return res.status(200).json({
      success: true,
      message: "Journal entry updated successfully.",
      data: jornal,
    });
  } catch (error) {
    console.error("Error updating journal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update journal entry. Try again later.",
    });
  }
};
