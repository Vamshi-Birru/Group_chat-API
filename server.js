const express = require("express");
const http = require("HTTP");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const cors= require("cors");

dotenv.config();
connectDB();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});
app.use(express.json()); // to accept json data

app.use(cors());
app.use("/api/user", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/message", messageRoutes);


  app.get("/", (req, res) => {
    res.send("API is running..");
  });


// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT||9000;

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});


const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.group;

    if (!chat.members) return console.log("chat.members not defined");

    chat.members.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
