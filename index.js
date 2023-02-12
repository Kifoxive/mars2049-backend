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
        try {
          // if the data are empty
          if (!roomName || !playerName) {
            return socket.emit({ errorMessage: "empty data" });
          }

          // if the username is the same as the creator username
          // or if the creator connect to its own room (for creator)
          if (playerName === roomsData[roomName]?.creatorName);

          // if room is already created (for other players)
          if (roomsData[roomName]) {
            const room = roomsData[roomName];

            if (room.players.includes(playerName)) {
              return;
            }
            const roomInAvailableList = roomsAvailable.find(
              (room) => room.roomName === roomName
            );
            roomInAvailableList.roomPlayers.push(playerName);

            socket.join(roomName);
            room.addPlayer(playerName, socket.id);
            // roomsAvailable = [
            //   ...roomsAvailable,
            //   (players = [...roomsAvailable.players, playerName]),
            // ];

            io.to(roomName).emit("player_joined", room.players);
            io.to(room.creatorId).emit("allow_start_game", true);
            return;
          }

          // if room is a new
          // if (roomName in roomsData) return socket.emit({ errorMessage: "" });

          roomsAvailable.push({
            roomName,
            roomCreator: playerName,
            roomPlayers: [playerName],
          });

          roomsData[roomName] = new Room(roomName, playerName, socket.id);
          const room = roomsData[roomName];

          room.addPlayer(playerName, socket.id);

          socket.emit("set_creator");
          socket.join(roomName);
          io.to(roomName).emit("player_joined", room.players);
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on(
        "remove_player",
        ({ roomName, playerName, removePlayerName }) => {
          try {
            const room = roomsData[roomName];
            if (playerName !== room.creatorName) return;

            io.to(room.playersSocketIndexes[removePlayerName]).emit(
              "remove_player"
            );

            const roomInAvailableList = roomsAvailable.find(
              (room) => room.roomName === roomName
            );
            roomInAvailableList.roomPlayers.splice(
              roomInAvailableList.roomPlayers.indexOf(playerName, 1)
            );

            room.removePlayer(removePlayerName);

            if (room.playersCount < 2) {
              io.to(room.creatorId).emit("allow_start_game", false);
            }
            io.to(roomName).emit("player_joined", room.players);
          } catch ({ title = "Error", message }) {
            socket.emit("server_message", {
              title: `${title}`,
              message: `${message}`,
              type: "error",
            });
          }
        }
      );

      socket.on("start_game", ({ roomName, playerName }) => {
        try {
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
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("get_private_data", ({ roomName, playerName }) => {
        try {
          const { game } = roomsData[roomName];
          const playerData = game.playersObj[playerName];
          socket.emit("get_private_data", playerData);
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("make_turn", ({ roomName, playerName }) => {
        try {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;
          game.makeTurn();
          io.to(roomName).emit("new_turn", game);
          io.to(roomName).emit("get_public_game_data", game);
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("set_dice_symbol", ({ roomName, playerName, symbol }) => {
        try {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;

          game.setDiceSymbol(symbol);
          io.to(roomName).emit("get_public_game_data", game);

          const boardWithPossiblyBuildings = game.getFreePlaces();
          socket.emit("send_private_game_data", {
            ...game,
            board: boardWithPossiblyBuildings,
          });
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on(
        "add_building",
        ({ roomName, playerName, desiredBuilding, indexP, indexM }) => {
          try {
            const { game } = roomsData[roomName];
            if (playerName !== game.currentTurnPlayer.username) return;

            game.addBuilding(
              desiredBuilding,
              playerName,
              game.currentTurnPlayer.color,
              indexP,
              indexM
            );

            if (desiredBuilding === "H2O_station") {
              const playerObj = game.playersObj[playerName];
              if (
                playerObj.road < 1 ||
                playerObj.base < 5 ||
                playerObj !== game.currentTurnPlayer
              )
                throw new GameError(
                  "Can not win",
                  "You can not build an H2O station"
                );

              game.win();
              socket.emit("confirm_win", game);
            } else {
              io.to(roomName).emit("get_public_game_data", game);
            }
            const boardWithPossiblyBuildings = game.getFreePlaces();
            socket.emit("send_private_game_data", {
              ...game,
              board: boardWithPossiblyBuildings,
            });
          } catch ({ title = "Error", message }) {
            socket.emit("server_message", {
              title: `${title}`,
              message: `${message}`,
              type: "error",
            });
          }
        }
      );

      socket.on("submit_win", ({ roomName, playerName }) => {
        try {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;

          const playerObj = game.playersObj[playerName];
          if (playerObj.road < 1 || playerObj.base < 5)
            throw new GameError(
              "Can not win",
              "You can not build an H2O station"
            );

          game.finish();
          io.to(roomName).emit("finish", game);

          io.to(roomName).emit("server_message", {
            title: `${
              playerObj.color.charAt(0).toUpperCase() + playerObj.color.slice(1)
            } won!`,
            message: `Congratulations to ${playerName}`,
            type: "message",
          });

          io.to(roomName).emit("server_message", {
            title: `${
              playerObj.color.charAt(0).toUpperCase() + playerObj.color.slice(1)
            } won!`,
            message: `Congratulations to ${playerName}`,
            type: "message",
          });
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("buy_token", ({ roomName, playerName, resource, to }) => {
        try {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;

          game.buyToken(resource, to);

          const playerData = game.playersObj[playerName];
          socket.emit("get_private_data", playerData);
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("sell_token", ({ roomName, playerName, resource, from }) => {
        try {
          const { game } = roomsData[roomName];
          if (playerName !== game.currentTurnPlayer.username) return;

          game.sellToken(resource, from);

          const playerData = game.playersObj[playerName];
          socket.emit("get_private_data", playerData);
        } catch ({ title = "Error", message }) {
          socket.emit("server_message", {
            title: `${title}`,
            message: `${message}`,
            type: "error",
          });
        }
      });

      socket.on("disconnect", ({ id }) => {
        io.to(id).emit("message", "disconnected");
      });
    });
  } catch (e) {
    console.log(e.title);
    res.status(500).send(`Some error occured: ${e}`);
  }
};

start();
