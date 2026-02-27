import express from "express";
import transporter from "../utils/mailer.js";

const router = express.Router();

router.get("/test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"SafarMitra" <${process.env.EMAIL_USER}>`,
      to: "parthbhandari17851@gmail.com", // send to yourself
      subject: "SafarMitra Email Test",
      text: "If you received this, email setup is working 🎉",
    });

    res.json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
