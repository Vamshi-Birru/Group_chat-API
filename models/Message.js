const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
