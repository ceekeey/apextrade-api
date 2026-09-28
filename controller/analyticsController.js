import Jornal from "../models/jornalModel.js";

// @desc    Get trading analytics and performance metrics
// @route   GET /api/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&month=MM&year=YYYY
// @access  Private
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    let query = { user: req.user._id };

    // Date Filtering Logic
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const trades = await Jornal.find(query);

    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return res.status(200).json({
        success: true,
        metrics: {
          winRate: "0%",
          profitFactor: "0.00",
          avgPnl: "$0.00",
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          bestTrade: 0,
        },
      });
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let bestTrade = -Infinity;

    trades.forEach((trade) => {
      if (trade.pnl > 0) {
        winningTrades++;
        grossProfit += trade.pnl;
      } else if (trade.pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(trade.pnl);
      }
      if (trade.pnl > bestTrade) {
        bestTrade = trade.pnl;
      }
    });

    const winRate = ((winningTrades / totalTrades) * 100).toFixed(1) + "%";

    // Profit Factor = Gross Profit / Gross Loss (Avoid division by zero)
    const profitFactor =
      grossLoss === 0
        ? grossProfit > 0
          ? "Infinite"
          : "0.00"
        : (grossProfit / grossLoss).toFixed(2);

    const totalPnl = trades.reduce((acc, curr) => acc + curr.pnl, 0);
    const avgPnl = (totalPnl / totalTrades).toFixed(2);

    return res.status(200).json({
      success: true,
      metrics: {
        winRate,
        profitFactor,
        avgPnl: `$${avgPnl}`,
        totalTrades,
        winningTrades,
        losingTrades,
        bestTrade: `$${bestTrade.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics metrics.",
    });
  }
};
