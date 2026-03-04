const nodemailer = require("nodemailer");

async function sendEmail(to, subject, text, html = null) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"SmartVyapar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,              // ✅ fallback (always sent)
      html: html || `<p>${text}</p>`, // ✅ if no HTML, wrap text in <p>
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
}

module.exports = sendEmail;
