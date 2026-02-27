import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "SafarMitra <onboarding@resend.dev>",
      to: email,
      subject: "SafarMitra OTP Verification",
      html: `
        <h2>Your OTP Code</h2>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    });

    console.log("OTP email sent");
  } catch (err) {
    console.error("Email Error:", err);
  }
};