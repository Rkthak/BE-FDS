const nodemailer = require("nodemailer");
const { EMAIL_USER, EMAIL_PASS } = require("./config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendOTP = async ({ to, subject, title, message, otp }) => {
  await transporter.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>${title}</h2>
        <p>${message}</p>

        <h1 style="letter-spacing: 8px;">
          ${otp}
        </h1>

        <p>This OTP will expire in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = sendOTP;
