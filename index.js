import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import Room from "./classes/Room.js";

config();
const PORT = process.env.PORT || 3001;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.get("/rooms", (req, res) => {
  res.json({ rooms: roomsAvailable });
});

let roomsAvailable = [];
const roomsData = {};

const start = async () => {
  try {
    httpServer.listen(PORT, function () {
      console.log("Started application on port %d", 3001);
    });
    io.on("connection", (socket) => {
      socket.on("join_room", ({ roomName, playerName }) => {
        // if the data are empty
        if (!roomName || !playerName) {
          return socket.emit({ errorMessage: "empty data" });
        }

        // if the username is the same as the creator username
        // or if the creator connect to its own room (for creator)
        if (
          roomsData[roomName] &&
          playerName === roomsData[roomName].creatorName
        ) {
          socket.emit({ errorMessage: "cannot join again" });
        }

        // if room is already created (for other players)
        if (roomsData[roomName]) {
          const room = roomsData[roomName];

          socket.join(roomName);
          room.addPlayer(playerName, socket.id);
          io.to(roomName).emit("player_joined", room.players);
          io.to(room.creatorId).emit("allow_start_game");
          return;
        }

        // if room is a new
        if (roomName in roomsData) return socket.emit({ errorMessage: "" });

        roomsAvailable.push({ roomName, playerName });
        roomsData[roomName] = new Room(roomName, playerName, socket.id);
        const room = roomsData[roomName];

        room.addPlayer(playerName, socket.id);

        socket.emit("set_creator");
        socket.join(roomName);
        io.to(roomName).emit("player_joined", room.players);
      });

      socket.on("start_game", ({ playerName, roomName }) => {
        if (roomsData[roomName].creatorName !== playerName) {
          return socket.emit({
            errorMessage: "only admin can start the game, no permission",
          });
        }

        roomsAvailable = roomsAvailable.filter(
          (room) => room.roomName !== roomName
        );

        const room = roomsData[roomName];
        const game = room.startGame();

        game.start(room.players);
        io.to(roomName).emit("new_turn", game);
        io.to(roomName).emit("get_public_game_data", game);
      });

      socket.on("get_private_data", ({ roomName, playerName }) => {
        const { game } = roomsData[roomName];
        const playerData = game.playersObj[playerName];
        socket.emit("get_private_data", playerData);
      });

      socket.on("make_turn", ({ roomName, playerName }) => {
        const { game } = roomsData[roomName];
        if (playerName !== game.currentTurnPlayer.username) {
          //  io.to(roomName).emit("server_message", {
          //   title: "Not allowed",
          //   message: "You can not make turn",
          // });
          return;
        }
        game.makeTurn();
        io.to(roomName).emit("new_turn", game);
        io.to(roomName).emit("get_public_game_data", game);
      });

      socket.on("set_dice_symbol", ({ roomName, playerName, symbol }) => {
        const { game } = roomsData[roomName];
        if (playerName !== game.currentTurnPlayer.username) return;

        game.setDiceSymbol(symbol);
        io.to(roomName).emit("get_public_game_data", game);
        const privateGameData = game.getFreePlaces();
        socket.emit("send_private_game_data", { board: privateGameData, game });
      });

      socket.on(
        "add_building",
        ({ roomName, playerName, desiredBuilding, indexP, indexM }) => {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;

          game.addBuilding(
            desiredBuilding,
            playerName,
            game.currentTurnPlayer.color,
            indexP,
            indexM
          );

          io.to(roomName).emit("get_public_game_data", game);
          const privateGameData = game.getFreePlaces();
          socket.emit("send_private_game_data", {
            board: privateGameData,
            game,
          });
        }
      );

      socket.on("disconnect", ({ id }) => {
        io.to(id).emit("message", "disconnected");
      });
    });
  } catch (e) {
    console.log(e.message);
    res.status(500).send(`Some error occured: ${e}`);
  }
};

start();
