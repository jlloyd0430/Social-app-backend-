const jwt = require("jsonwebtoken");
let users = [];
const express = require("express");
const app = express();
const cors = require("cors");

const corsOptions = {
  origin: "*",
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

const authSocket = (socket, next) => {
  let token = socket.handshake.auth.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_KEY);
      socket.decoded = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  } else {
    next(new Error("Authentication error"));
  }
};

const socketServer = (socket) => {
  const userId = socket.decoded.userId;
  users.push({ userId, socketId: socket.id });

  socket.on("send-message", (recipientUserId, username, content) => {
    const recipient = users.find((user) => user.userId == recipientUserId);
    if (recipient) {
      socket
        .to(recipient.socketId)
        .emit("receive-message", userId, username, content);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.userId != userId);
  });
};

module.exports = { socketServer, authSocket };
