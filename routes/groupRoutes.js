const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroup,
  removeFromGroup,
  addToGroup,
  renameGroup,
  leaveFromGroup,
  dismantleGroup
} = require("../controllers/groupControllers");
const { protect, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/create").post(protect, createGroup);
router.route("/rename").put(protect, renameGroup);
router.route("/remove").put(verifyAdmin, removeFromGroup);
router.route("/add").put(verifyAdmin, addToGroup);
router.route("/leave").put(protect,leaveFromGroup);
router.route("/dismantle").delete(verifyAdmin, dismantleGroup);

module.exports = router;
