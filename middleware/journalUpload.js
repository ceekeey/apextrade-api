import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "upload", "journals");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: fieldname-userid-timestamp.ext
    const fieldPrefix = file.fieldname.replace("Image", "");
    const userId = req.user._id.toString();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueFilename = `${fieldPrefix}-${userId}-${timestamp}${extension}`;
    cb(null, uniqueFilename);
  },
});

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const journalUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error("Only JPEG, PNG, and WEBP image files are allowed."),
        false,
      );
    }
    cb(null, true);
  },
});
