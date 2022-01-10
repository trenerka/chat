const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./generate-message");
const { addUser, removeUser, getUser, getRoom } = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");

const port = process.env.PORT || 3000;

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New websocket connection");

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(message)) return callback("Profanity problem");
    io.to(user.user.room).emit(
      "message",
      generateMessage(user.user.username, message)
    );

    console.log(user.user.room);
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (pos, callback) => {
    const korisnik = getUser(socket.id);
    io.to(korisnik.user.room).emit(
      "locationMessage",
      generateLocationMessage(
        korisnik.user.username,
        `https://google.com/maps?q=${pos.latitude},${pos.longitude}`
      )
    );
    callback();
  });

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) callback(error);
    socket.join(user.room);

    socket.emit("message", generateMessage("WELCOME"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getRoom(user.room),
    });
    console.log(getRoom(user.room));
    callback();
  });
});

server.listen(port, () => {
  console.log("Server is up on port ", port);
});
