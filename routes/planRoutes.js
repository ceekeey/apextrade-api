import express from "express";
import {
  allPlan,
  createPlan,
  deletePlan,
  singlePlan,
  editPlan,
} from "../controller/planController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Public routes (or you can protect all if plans are strictly private)
router.get("/allplans", allPlan);
router.get("/plan/:id", singlePlan);

// Protected routes (Require login)
router.post("/create", protect, createPlan);
router.put("/update/:id", protect, editPlan);
router.delete("/delete/:id", protect, deletePlan);

export default router;
