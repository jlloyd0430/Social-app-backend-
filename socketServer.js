const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  origins: "https://social-media-frontend-7sq7.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
  let users = [];
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

io.use(authSocket);
io.on("connection", socketServer);

module.exports = { server };
