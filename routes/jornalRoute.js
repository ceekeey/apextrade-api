import express from "express";
const router = express.Router();
import { protect } from "../middleware/protect.js";
import {
  allJornal,
  createJornal,
  deleteJornal,
  singleJornal,
  updateJornal,
} from "../controller/jornalController.js";

router.post("/create", protect, createJornal);
router.get("/all", protect, allJornal);
router.get("/jornal/:id", protect, singleJornal);
router.delete("/delete/:id", protect, deleteJornal); // Best practice: use DELETE method + id param
router.post("/delete", protect, deleteJornal); // Kept fallback if your frontend uses POST
router.put("/update/:id", protect, updateJornal); // Best practice: use PUT method + id param
router.post("/update", protect, updateJornal); // Kept fallback if your frontend uses POST

export default router;
