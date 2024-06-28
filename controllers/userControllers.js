const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../config/generateToken");
const createError = require("../config/error"); 
const bcrypt = require("bcryptjs");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res,next) => {
  
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  try{
    const { username, email, password } = req.body;
    console.log(username);
    if (!username || !email || !password) {
      next(createError(400, "Please Enter all the fields"));
      
    }
  
    const emailExists = await User.findOne({ email });
  
    if (emailExists) {
      next(createError(400, "Email already exists!"));
      
    }
    const  usernameExists= await User.findOne({username});
   if(usernameExists){
    next(createError(404, "Username already exists!"));
   }
  
    const user = await User.create({
      username,
      email,
      password,
    });
  
    
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } 
  
  catch(err){
     next(err);
  }
  
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res,next) => {
  try{
   

    const { username, password } = req.body;
   
    const user = await User.findOne({ username:username });
    
    if (!user) return next(createError(404, "User not found!"));
    
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect){
      return next(createError(400, "Wrong password!!"));}
      
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    
  }
  catch(err){
    next(err);
  }
  
});

module.exports = { allUsers, registerUser, authUser };
