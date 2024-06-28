const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const User = require("../models/User");
const Group = require("../models/Group");
const createError = require("../config/error");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res,next) => {
  try {
    
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username email")
      .populate("group");
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res,next) => {
  const { content, groupId } = req.body;
  

  if (!content || !groupId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    group: groupId,
  };

  try {
    var message = await Message.create(newMessage);
   
    message = await message.populate("sender", "username").execPopulate();
   
    message = await message.populate("group").execPopulate();
    
    message = await User.populate(message, {
      path: "group.members",
      select: "username email",
    });
    

    const group = await Group.findById(groupId);
    if (group) {
      group.latestMessage = message;
      await group.save();
    }

    res.json(message);
  } catch (error) {
    console.log(error);
    next(error);
    
  }
});

module.exports = { allMessages, sendMessage };
