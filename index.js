import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./db.js";
dotenv.config();

import authRoutes from "./routes/authRoutes.js"
import planRoutes from "./routes/planRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes)
app.use("/api/plans", planRoutes);

app.listen(process.env.PORT, () => {
  connectDb();
  console.log("server running ");
});
