import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import { router as trainRoutes } from "./routes/apiRoutes.js";
import { connectRedis } from "./utils/redisClient.js";
import otpRoutes from "./routes/otp.js";

const app = express();

/* =========================
   GLOBAL ERROR HANDLERS
========================= */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

  app.use(cors({
    origin: true,
    credentials: true
  }));

app.use(express.json());
app.use(cookieParser());

/* =========================
   HEALTH CHECK ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running successfully...");
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/train", trainRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/otp", otpRoutes);

/* =========================
   DATABASE ERROR LOGGING
========================= */
mongoose.connection.on("error", (err) => {
  console.error("MongoDB Error:", err);
});

/* =========================
   SERVER START FUNCTION
========================= */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    /* ---------- Redis ---------- */
    await connectRedis();
    console.log("✅ Redis connected successfully");

    /* ---------- MongoDB ---------- */
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");

    /* ---------- Server ---------- */
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup Failed:", error);
  }
}

startServer();