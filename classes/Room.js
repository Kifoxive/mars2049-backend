import Game from "./Game.js";

export default class Room {
  constructor(roomName, creatorName, creatorId) {
    this.roomName = roomName;
    this.creatorName = creatorName;
    this.creatorId = creatorId;
    this.players = [];
    this.playersCount = 0;
  }

  addPlayer(username) {
    // if (this.playersCount >= 4) throw new Error("too much players");
    if (this.playersCount >= 4) return;
    this.playersCount++;
    this.players.push(username);
  }

  removePlayer(username) {
    this.players.splice(
      this.players.findIndex((item) => item === username),
      1
    );
    this.playersCount--;
  }

  startGame() {
    if (this.playersCount < 2) throw new Error("not enough players");
    this.game = new Game(this.players, this.playersCount);
    return this.game;
  }
}
