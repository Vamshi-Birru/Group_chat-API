const asyncHandler = require("express-async-handler");
const Group = require("../models/Group");
const User = require("../models/User");
const createError = require("../config/error");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res,next) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    next(createError(400))
  }

  var isGroup = await Group.find({
    $and: [
      { members: { $elemMatch: { $eq: req.user._id } } },
      { member: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("members", "-password")
    .populate("latestMessage");

  isGroup = await User.populate(isGroup, {
    path: "latestMessage.sender",
    select: "username pic email",
  });

  if (isGroup.length > 0) {
    res.send(isGroup[0]);
  } else {
    var GroupData = {
      GroupName: "sender",
      users: [req.user._id, userId],
    };

    try {
      const createdGroup = await Group.create(GroupData);
      const FullChat = await Group.findOne({ _id: createdGroup._id }).populate(
        "members",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      next(createError(400,err.message));
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res,next) => {
  try {
    Group.find({ members: { $elemMatch: { $eq: req.user._id } } })
      .populate("members", "-password")
      .populate("admin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "username pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    next(createError(400,err.message));
    
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroup = asyncHandler(async (req, res,next) => {
  
  try{
    if (!req.body.users || !req.body.name) {
      return res.status(400).send({ message: "Please Fill all the feilds" });
    }
  
    var users = JSON.parse(req.body.users);
  
    if (users.length < 2) {
      return res
        .status(400)
        .send("More than 2 users are required to form a group chat");
    }
     
    users.push(req.user);
  
    
      const groupChat = await Group.create({
        name: req.body.name,
        members: users,
        admin: req.user,
      });
  
      const fullGroupChat = await Group.findOne({ _id: groupChat._id })
        .populate("members", "-password")
        .populate("admin", "-password");
  
        res.status(201).send({ message: 'Group created', fullGroupChat });
  }
  catch(err){
    next(err);
  }
  
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res,next) => {
  try{
    const { groupId, name } = req.body;
   
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        name: name,
      },
      {
        new: true,
      }
    )
      .populate("members", "-password")
      .populate("admin", "-password");
  
    if (!updatedGroup) {
      next(createError(404,"Group Not Found"));
    } else {
      res.status(200).json(updatedGroup);
    }
  }
  catch(err){
    
    next(err)
  }
 
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res,next) => {
  try{
    
    const { groupId, userIdToRemove } = req.body;
    const userId=req.user._id;

    // check if the requester is admin
    const group = await Group.findById(groupId);



    if (group.admin.toString() === userIdToRemove.toString()) {
      return res.status(400).send({ error: 'Admin cannot remove themselves' });
    }
    const removed = await Group.findByIdAndUpdate(
      groupId,
      {
        $pull: { members: userIdToRemove },
      },
      {
        new: true,
      }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");
  
    if (!removed) {
      next(createError(404,"Chat Not Found"));
    } else {
      res.send({ message: 'User removed from group', removed });
    }
  }
  catch(err){
    next(err);
  }
 
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
 
  try{
  const { groupId, userIdToAdd } = req.body;
  const group = await Group.findById(groupId);

  if (!group) {
    return res.status(404).send({ error: 'Group not found' });
  }
  // Check if the user to add exists
  const userToAdd = await User.findById(userIdToAdd);
   
  if (!userToAdd) {
    return res.status(404).send({ error: 'User not found' });
  }
  if (group.members.includes(userIdToAdd)) {
    return res.status(400).send({ error: 'User is already a member of the group' });
  }
  // check if the requester is admin

  const added = await Group.findByIdAndUpdate(
    chatId,
    {
      $push: { members: userToAdd },
    },
    {
      new: true,
    }
  )
    .populate("members", "-password")
    .populate("admin", "-password");

  if (!added) {
    next(createError(404,"Group Not Found"));
   
  } else {
    res.status(200).send({ message: 'User added to group', group });
  }
}
  catch (err) {
    next(err);
  }
});
const leaveFromGroup = asyncHandler(async (req, res) => {
  try {
    const { groupId} = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).send({ error: 'Group not found' });
    }

    if (group.admin.toString() === userId.toString()) {
      return res.status(400).send({ error: 'Admin cannot leave the group' });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).send({ error: 'User is not a member of this group' });
    }

    group.members = group.members.filter(member => member.toString() !== userId.toString());
    await group.save();

    res.send({ message: 'User has left the group', group });
  }
  catch (err) {
    next(err);
  }
});
const dismantleGroup = asyncHandler(async (req, res) => {
  try {
    const{ groupId} = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    await group.remove();

    res.send({ message: 'Group dismantled' });
  }
  catch (err) {
    next(err);
  }
});
module.exports = {
  accessChat,
  fetchChats,
  createGroup,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveFromGroup,
  dismantleGroup
};
