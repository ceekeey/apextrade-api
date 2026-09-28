import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./db.js";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import jornalRoute from "./routes/jornalRoute.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Api routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/jornal", jornalRoute);
app.use("/api/analytics", analyticsRoutes);

app.listen(process.env.PORT, () => {
  connectDb();
  console.log("server running ");
});
