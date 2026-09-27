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

// Protected routes (Require login)
router.get("/allplans", protect, allPlan);
router.get("/plan/:id", protect, singlePlan);
router.post("/create", protect, createPlan);
router.put("/update/:id", protect, editPlan);
router.delete("/delete/:id", protect, deletePlan);

export default router;
