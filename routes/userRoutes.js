import express from "express";
import multer from "multer";
import { updateProfile } from "../controller/authController.js";
import { protect } from "../middleware/protect.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.put(
  "/profile",
  protect,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "Avatar file must be 5MB or less.",
          });
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            error: "Only JPEG, PNG, and WEBP avatar files are allowed.",
          });
        }

        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }

      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }

      return next();
    });
  },
  updateProfile,
);

export default router;
