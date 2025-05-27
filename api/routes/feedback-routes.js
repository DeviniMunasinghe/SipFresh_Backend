const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback-controller");

router.post("/send-feedback", feedbackController.sendFeedback);

module.exports = router;
