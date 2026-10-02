import fs from "fs";
import path from "path";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper function to generate JWT
const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Helper for email validation regex
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const avatarDirectory = path.resolve(process.cwd(), "upload", "avatars");

const isSafeAvatarPath = (avatarPath) => {
  if (!avatarPath || typeof avatarPath !== "string") {
    return false;
  }

  const normalizedPath = avatarPath.replace(/\\/g, "/");

  if (!normalizedPath.startsWith("/upload/avatars/")) {
    return false;
  }

  const fullPath = path.normalize(
    path.resolve(process.cwd(), `.${normalizedPath}`),
  );
  const safeRoot = path.normalize(avatarDirectory);

  return fullPath === safeRoot || fullPath.startsWith(`${safeRoot}${path.sep}`);
};

const removeAvatarFile = (avatarPath) => {
  if (!isSafeAvatarPath(avatarPath)) {
    return;
  }

  const fullPath = path.normalize(
    path.resolve(process.cwd(), `.${avatarPath}`),
  );

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Error deleting avatar file:", error.message);
  }
};

export const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // 1. Validate inputs exist
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, email, password) are required.",
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    // 2. Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // 3. Validate password strength (e.g., min 6 chars, contains number)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email.",
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create account
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 6. Generate JWT Token & set HTTP-only cookie
    const token = generateToken(newUser._id, newUser.email);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token, // Optional: useful if client uses local storage alongside cookies
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create account" });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    email = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials." });
    }

    // Generate token & set cookie
    const token = generateToken(user._id, user.email);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear the token cookie using matching attributes
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ success: false, error: "Failed to logout" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!currentUser || !currentUser._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const user = await User.findById(currentUser._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hasName =
      req.body && Object.prototype.hasOwnProperty.call(req.body, "name");
    const hasEmail =
      req.body && Object.prototype.hasOwnProperty.call(req.body, "email");
    const hasAvatar = !!req.file;

    if (!hasName && !hasEmail && !hasAvatar) {
      return res.status(400).json({
        success: false,
        message: "Please provide a name, email, or avatar to update.",
      });
    }

    const newName = hasName ? String(req.body.name).trim() : user.name;
    const newEmail = hasEmail
      ? String(req.body.email).trim().toLowerCase()
      : user.email;
    const previousAvatar = user.avatar || "";
    const newAvatarPath = hasAvatar
      ? `/upload/avatars/${req.file.filename}`
      : null;

    if (hasName && !newName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (hasEmail && !newEmail) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty",
      });
    }

    if (hasEmail && !isValidEmail(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (hasEmail && newEmail !== user.email) {
      const duplicateUser = await User.findOne({ email: newEmail });

      if (
        duplicateUser &&
        duplicateUser._id.toString() !== user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "This email is already in use by another account.",
        });
      }
    }

    user.name = hasName ? newName : user.name;
    user.email = hasEmail ? newEmail : user.email;

    if (hasAvatar) {
      user.avatar = newAvatarPath;
    }

    try {
      await user.save();

      if (hasAvatar && previousAvatar && previousAvatar !== newAvatarPath) {
        removeAvatarFile(previousAvatar);
      }

      const responseUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      };

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: responseUser,
      });
    } catch (error) {
      if (newAvatarPath) {
        removeAvatarFile(newAvatarPath);
      }

      console.error("Error updating profile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
