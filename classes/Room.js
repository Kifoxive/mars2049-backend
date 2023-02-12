import Game from "./Game.js";

export default class Room {
  constructor(roomName, creatorName, creatorId) {
    this.roomName = roomName;
    this.creatorName = creatorName;
    this.creatorId = creatorId;
  }
  players = [];
  playersCount = 0;
  playersSocketIndexes = {};

  addPlayer(username, socketId) {
    if (this.playersCount >= 4) return;
    this.players.push(username);
    this.playersSocketIndexes[username] = socketId;
    this.playersCount++;
  }

  removePlayer(username) {
    this.players.splice(
      this.players.findIndex((item) => item === username),
      1
    );
    delete this.playersSocketIndexes[username];
    this.playersCount--;
  }

  startGame() {
    if (this.playersCount < 2) throw new Error("not enough players");
    this.game = new Game(this.players, this.playersCount);
    return this.game;
  }
}
