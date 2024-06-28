const express = require("express");
const {
  allMessages,
  sendMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:groupId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);

module.exports = router;
