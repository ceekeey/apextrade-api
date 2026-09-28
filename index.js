import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet"; // 🛡️ Added for security headers
import connectDb from "./db.js";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import jornalRoute from "./routes/jornalRoute.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();

// 🛡️ Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Limit payload size for base64 images

// 🌍 Public API Status / Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to ApexTrade — Trading Journal API 🚀",
    version: "1.0.0",
    description:
      "The backend engine for tracking trading plans, multi-timeframe journals, and performance analytics.",
    status: "Active & Secure",
  });
});

// Api routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/jornal", jornalRoute);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDb();
  console.log(`Server running securely on port ${PORT}`);
});
