const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Group =require("../models/Group.js");
const asyncHandler = require("express-async-handler");
const createError = require("../config/error.js");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      next(createError(401,"Not authorized, token failed"))
      
    }
  }

  if (!token) {
    next(createError(401,"Not authorized, no token"))
  }
});
const verifyAdmin = (req, res, next) => {
  protect(req, res,  async () => {
    try{
      const groupId = req.body.groupId;
      const userId = req.user._id;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).send({ error: 'Group not found' });
      }
    
      if (group.admin.toString() !== userId.toString()) {
        return res.status(403).send({ error: 'Only Group admins can perform the operation' });
      }
      next();
    }
    catch(err){
      next(err);
    }
    
    

  });
}

module.exports = { protect,verifyAdmin };
