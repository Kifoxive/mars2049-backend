import Building from "./Building.js";
import Player from "./Player.js";

export default class Game {
  constructor(playersNames, playersCount) {
    this.playersNames = Game.shuffleArray(playersNames);
    this.playersCount = playersCount;
    this.board = [];
    this.playersObj = {};
    this.turn = 0;
    this.totalGameTurn = 0;
    this.playersColors = {};
    this.currentTurnPlayer = null;
    this.diceSymbol = null;
    this.canMakeTurn = false;
    this.diced = false;

    for (let i = 0; i < 6; i++) {
      this.board[i] = [];
      for (let k = 0; k < 24; k++) {
        this.board[i].push(null);
      }
    }
  }

  start() {
    const colors = ["green", "orange", "pink", "blue"];
    const numbers = Game.shuffleArray([0, 1, 2, 3]);

    for (let i = 0; i < this.playersCount; i++) {
      const curPlayerName = this.playersNames[i];
      this.playersColors[curPlayerName] = colors[numbers[i]];

      this.playersObj[curPlayerName] = new Player(
        curPlayerName,
        colors[numbers[i]]
      );
    }

    this.currentTurnPlayer = this.playersObj[this.playersNames[this.turn]];
    this.currentTurnPlayer.isMyTurn = true;
    this.madeStartBases();
  }

  makeTurn() {
    if (!this.canMakeTurn) throw Error("Can not make turn");
    this.currentTurnPlayer.isMyTurn = false;
    //  this.turn = this.turn < this.playersCount - 1 ? this.turn + 1 : 0;
    this.turn = this.turn === 0 ? this.playersCount - 1 : this.turn - 1;
    this.currentTurnPlayer = this.playersObj[this.playersNames[this.turn]];
    this.currentTurnPlayer.isMyTurn = true;
    if (this.playersNames[0] === this.currentTurnPlayer.username) {
      this.totalGameTurn++;
    }
    this.canMakeTurn = false;
    this.diced = false;
  }

  finish() {
    // this.winner = null
  }

  madeScene() {
    // this.board[]
  }

  static buildingCosts = {
    air_station: { food: 2, mineral: 2 },
    food_station: { air: 2, mineral: 2 },
    mineral_station: { air: 2, mineral: 2 },
    base: { air: 3, food: 3, mineral: 3 },
    laboratory: { air: 4, mineral: 3 },
    peaceful_mission: { air: 3, food: 1 },
    agressive_mission: { air: 1, mineral: 3 },
    roads: { road_cards: 3 },
    H2O_station: { air: 8, food: 8, mineral: 8 },
  };

  static shuffleArray(array) {
    let curId = array.length;
    // There remain elements to shuffle
    while (0 !== curId) {
      // Pick a remaining element
      let randId = Math.floor(Math.random() * curId);
      curId -= 1;
      // Swap it with the current element.
      let tmp = array[curId];
      array[curId] = array[randId];
      array[randId] = tmp;
    }
    return array;
  }

  madeStartBases() {
    for (let i = 0; i < this.playersCount; i++) {
      const player = this.playersObj[this.playersNames[i]];
      const color = player.color;
      player.shift = (i * 24) / this.playersCount;
      this.addBuilding(
        "air_station",
        this.playersNames[i],
        color,
        0,
        (i * 24) / this.playersCount - 1
      );

      this.addBuilding(
        "base",
        this.playersNames[i],
        color,
        0,
        (i * 24) / this.playersCount
      );

      this.addBuilding(
        "mineral_station",
        this.playersNames[i],
        color,
        0,
        (i * 24) / this.playersCount + 1
      );

      this.addBuilding(
        "food_station",
        this.playersNames[i],
        color,
        1,
        (i * 24) / this.playersCount
      );
    }
  }

  addBuilding(building, owner, color, paralel, meridian) {
    meridian = Game.getMeridian(meridian);

    const ownerObj = this.playersObj[owner];

    switch (building) {
      case "air_station":
        ownerObj.buildings[building]++;
        break;
      case "food_station":
        ownerObj.buildings[building]++;
        break;
      case "mineral_station":
        ownerObj.buildings[building]++;
        break;
      case "base":
        ownerObj.base++;
        break;
      case "laboratory":
        if (ownerObj.labaratories.rate === 4) {
          ownerObj.labaratories.rate = 3;
          ownerObj.labaratories.three++;
        } else if (ownerObj.labaratories.rate === 3) {
          ownerObj.labaratories.rate = 2;
          ownerObj.labaratories.two++;
        }
        break;
      case "road":
        this.owner.road++;
      case "H2O_station":
        this.base++;
      default:
        throw Error(`Building ${building} does not exist`);
    }

    if (this.board[paralel][meridian] == null) {
      this.board[paralel][meridian] = new Building(
        building,
        owner,
        color,
        paralel,
        meridian
      );
    }
  }

  diceSymbols = "discovery" | "robbery" | "mineral" | "food" | "skip" | "air";

  static getMeridian(meridian) {
    if (meridian < 0) {
      return 24 - Math.abs(meridian);
    } else if (meridian > 23) {
      return meridian - 24;
    }
    return meridian;
  }

  static getParalel(paralel) {
    const result = paralel;
    if (paralel < 0 || paralel > 6) {
      return null;
    }
    return Number(result);
  }

  setDiceSymbol(symbol) {
    if (this.diced) throw Error("Already diced");
    this.diceSymbol = symbol;
    this.diced = true;
    this.currentTurnPlayer.lastDice = symbol;

    switch (symbol) {
      case "discovery":
        break;
      case "robbery":
        break;
      case "mineral":
        for (let player in this.playersObj) {
          this.playersObj[player].cards.mineral++;
        }
        break;
      case "food":
        for (let player in this.playersObj) {
          this.playersObj[player].cards.food++;
        }
        break;
      case "skip":
        break;
      case "air":
        for (let player in this.playersObj) {
          this.playersObj[player].cards.air++;
        }
        break;
      default:
        break;
    }

    //  for (let card in this.currentTurnPlayer.cards) {
    //    this.currentTurnPlayer.cards[card] +=
    //      this.currentTurnPlayer.buildings[card + "_station"];
    //  }

    this.canMakeTurn = true;
  }

  getFreePlaces() {
    if (!this.diced) throw Error("Not diced");
    const around = [];
    for (let i = 0; i < 6; i++) {
      around[i] = this.board[i].slice();
    }

    for (let paralel = 0; paralel < 6; paralel++) {
      for (let meridian = 0; meridian < 24; meridian++) {
        const building = this.board[paralel][meridian];
        if (
          building instanceof Building &&
          building.owner === this.currentTurnPlayer.username &&
          building.building === "base"
        ) {
          // on the top
          if (this.board[paralel] + 1) {
            if (
              this.board[paralel + 1][Game.getMeridian(meridian - 1)] === null
            ) {
              //   console.log("on top right");
              around[paralel + 1][Game.getMeridian(meridian - 1)] = true;
            }
            if (this.board[paralel + 1][meridian] === null) {
              //   console.log("on top");
              around[paralel + 1][Game.getMeridian(meridian)] = true;
            }
            if (
              this.board[paralel + 1][Game.getMeridian(meridian + 1)] === null
            ) {
              //   console.log("on top left");
              around[paralel + 1][Game.getMeridian(meridian + 1)] = true;
            }
          }

          //  on the middle
          if (this.board[paralel][Game.getMeridian(meridian - 1)] === null) {
            // console.log("on right");
            around[paralel][Game.getMeridian(meridian - 1)] = true;
          }
          if (this.board[paralel][Game.getMeridian(meridian + 1)] === null) {
            // console.log("on left");
            around[paralel][Game.getMeridian(meridian + 1)] = true;
          }
        }
      }
    }
    return around;
  }
}
