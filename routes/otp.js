// import express from "express";
// import bcrypt from "bcrypt";
// import { Resend } from "resend";

// import User from "../models/User.js";
// import generateOtp from "../utils/generateOtp.js";
// import { redisClient } from "../utils/redisClient.js";

// const router = express.Router();
// const resend = new Resend(process.env.RESEND_API_KEY);

// /* ===============================
//    SEND OTP
// =================================*/
// router.post("/send-otp", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email required",
//       });
//     }

//     const otp = generateOtp();

//     // ✅ Store OTP in Redis (5 min expiry)
//     await redisClient.set(
//       `otp:${email}`,
//       otp,
//       { EX: 300 }
//     );

//     // ✅ Respond instantly (IMPORTANT)
//     res.json({
//       success: true,
//       message: "OTP sent successfully",
//     });

//     // ✅ Send email async (prevents UI freeze)
//     await resend.emails.send({
//       from: "SafarMitra <onboarding@resend.dev>",
//       to: email,
//       subject: "SafarMitra OTP Verification",
//       html: `
// <!DOCTYPE html>
// <html>
// <body style="font-family:Arial;background:#f4f6fb;padding:20px">
// <div style="max-width:450px;margin:auto;background:white;padding:25px;border-radius:12px;text-align:center">

// <h2 style="color:#1f3c88;">SafarMitra Verification</h2>

// <p>Enter this OTP to complete signup</p>

// <div style="
// font-size:34px;
// letter-spacing:6px;
// font-weight:bold;
// background:#eef4ff;
// padding:15px;
// border-radius:10px;
// margin:20px 0;">
// ${otp}
// </div>

// <p>This OTP is valid for <b>5 minutes</b></p>

// <p style="font-size:12px;color:gray">
// If you didn't request this, ignore this email.
// </p>

// </div>
// </body>
// </html>
// `,
//     });

//     console.log("✅ OTP Email Sent");

//   } catch (err) {
//     console.error("OTP Send Error:", err);
//   }
// });


// /* ===============================
//    VERIFY OTP + SIGNUP
// =================================*/
// router.post("/verify-otp", async (req, res) => {
//   try {
//     const {
//       name,
//       username,
//       email,
//       password,
//       role,
//       otp,
//     } = req.body;

//     if (!name || !username || !email || !password || !otp) {
//       return res.status(400).json({
//         message: "All fields required",
//       });
//     }

//     // ✅ Get OTP from Redis
//     const storedOtp = await redisClient.get(`otp:${email}`);

//     if (!storedOtp) {
//       return res.status(400).json({
//         message: "OTP expired",
//       });
//     }

//     if (storedOtp !== otp) {
//       return res.status(400).json({
//         message: "Invalid OTP",
//       });
//     }

//     // ✅ Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ✅ Create user
//     await User.create({
//       name,
//       username,
//       email,
//       password: hashedPassword,
//       role,
//     });

//     // ✅ Delete OTP after success
//     await redisClient.del(`otp:${email}`);

//     res.json({
//       success: true,
//       message: "Signup successful",
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// export default router;  

import express from "express";
import bcrypt from "bcrypt";
import { Resend } from "resend";

import User from "../models/User.js";
import generateOtp from "../utils/generateOtp.js";
import { redisClient } from "../utils/redisClient.js";

const router = express.Router();   // ✅ REQUIRED

const resend = new Resend(process.env.RESEND_API_KEY);


/* ===============================
   SEND OTP
=================================*/
router.post("/send-otp", async (req, res) => {
  try {
    console.log("✅ SEND OTP HIT");

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const otp = generateOtp();

    await redisClient.set(`otp:${email}`, otp, { EX: 300 });

    console.log("OTP stored in Redis");

    const response = await resend.emails.send({
      from: "SafarMitra <onboarding@resend.dev>",
      to: email,
      subject: "SafarMitra OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2>`
    });

    console.log("✅ RESEND RESPONSE:", response);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("❌ OTP Send Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});


/* ===============================
   VERIFY OTP
=================================*/
router.post("/verify-otp", async (req, res) => {
  try {
    const { name, username, email, password, role, otp } = req.body;

    const storedOtp = await redisClient.get(`otp:${email}`);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    });

    await redisClient.del(`otp:${email}`);

    res.json({
      success: true,
      message: "Signup successful",
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;