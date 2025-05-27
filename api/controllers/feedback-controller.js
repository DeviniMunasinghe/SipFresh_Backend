const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true,
  logger: true,
});

exports.sendFeedback = async (req, res) => {
  try {
    const { name, email, contactNumber, message } = req.body;

    const mailOptions = {
      from: email,
      to: "yumzyfooddealer@gmail.com",
      subject: `Feedback from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nContact Number: ${contactNumber}\n\nMessage:\n${message}`,
    };

    // Auto-reply mail options to the user
    const autoReplyOptions = {
      from: "yumzyfooddealer@gmail.com",
      to: email,
      subject: "Thank you for your feedback!",
      text: `Dear ${name},\n\nThank you for reaching out to us! We have received your feedback and will get back to you shortly if needed.\n\nBest regards,\nYumzy Food Dealer Team`,
    };

    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReplyOptions);

    res.status(200).json({
      message:
        "Feedback sent successfully and confirmation email sent to the user!",
    });
  } catch (error) {
    console.error("Error sending feedback", error);
    res.status(500).json({
      error: "Failed to send feedback or confirmation email",
    });
  }
};
