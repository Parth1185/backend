import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth, requireAdmin} from "../middleware/auth.js";

const router = Router();

function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
}

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;


router.post("/edit-profile", requireAuth, async (req, res) => {
  try {
    const { name, username, email, currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;

    if (newPassword) {
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error:
            "New password must be at least 6 characters long and contain at least one letter and one number.",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/signup", async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain at least one letter and one number.",
      });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists)
      return res
        .status(409)
        .json({ message: "Username or email already in use" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username,
      email,
      password: hash,
      role: role || "user", 
    });

    res.status(201).json({ message: "Signup successful" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const payload = {
      id: user._id,
      role: user.role, 
      version: process.env.TOKEN_VERSION,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role, 
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});


router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select(
    "name username email role"
  );
  res.json({ user });
});

// GET all users (ADMIN ONLY)
router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }) 
      .select("name username email");

    return res.json({ users });
  } catch (err) {
    console.error("Admin user fetch error:", err);
    return res.status(500).json({ error: "Server error while loading users" });
  }
});



router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const deleted = await User.findByIdAndDelete(userId);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;


