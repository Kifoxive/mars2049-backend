import Building from "./Building.js";
import GameError from "./GameError.js";
import Player from "./Player.js";

export default class Game {
  constructor(playersNames, playersCount) {
    this.playersNames = Game.shuffleArray(playersNames);
    this.playersCount = playersCount;
    this.board = [];

    for (let i = 0; i < 7; i++) {
      this.board[i] = [];
      if (i === 6) {
        // for H2O_station
        this.board[i][0] = null;
        break;
      }

      for (let k = 0; k < 24; k++) {
        this.board[i].push(null);
      }
    }
  }
  static max_bases = 5;
  static max_roads = 1;

  playersObj = {};
  turn = 0;
  totalGameTurn = 0;
  playersColors = {};
  currentTurnPlayer = null;
  diceSymbol = null;
  canMakeTurn = false;
  diced = false;
  isGameStarted = false;

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
    this.isGameStarted = true;
  }

  makeTurn() {
    if (!this.canMakeTurn) throw Error("Can not make turn, shake a dice");
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
        (i * 24) / this.playersCount - 1,
        false
      );

      this.addBuilding(
        "base",
        this.playersNames[i],
        color,
        0,
        (i * 24) / this.playersCount,
        false
      );

      this.addBuilding(
        "mineral_station",
        this.playersNames[i],
        color,
        0,
        (i * 24) / this.playersCount + 1,
        false
      );

      this.addBuilding(
        "food_station",
        this.playersNames[i],
        color,
        1,
        (i * 24) / this.playersCount,
        false
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

    for (let card in this.currentTurnPlayer.cards) {
      this.currentTurnPlayer.cards[card] +=
        this.currentTurnPlayer.buildings[card + "_station"];
    }

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
          if (this.board[paralel + 1]) {
            if (
              this.board[paralel + 1][Game.getMeridian(meridian - 1)] === null
            ) {
              // on top right
              this.possiblyBuilding(
                around,
                paralel + 1,
                Game.getMeridian(meridian - 1)
              );
            }
            if (this.board[paralel + 1][meridian] === null) {
              // on top
              this.possiblyBuilding(around, paralel + 1, meridian, true);
            }
            if (
              this.board[paralel + 1][Game.getMeridian(meridian + 1)] === null
            ) {
              // on top left
              this.possiblyBuilding(
                around,
                paralel + 1,
                Game.getMeridian(meridian + 1)
              );
            }
          }

          //  on the middle
          if (this.board[paralel][Game.getMeridian(meridian - 1)] === null) {
            // on right
            this.possiblyBuilding(
              around,
              paralel,
              Game.getMeridian(meridian - 1)
            );
          }
          if (this.board[paralel][Game.getMeridian(meridian + 1)] === null) {
            // on left
            this.possiblyBuilding(
              around,
              paralel,
              Game.getMeridian(meridian + 1)
            );
          }

          // on the bottom
          if (this.board[paralel - 1]) {
            if (
              this.board[paralel - 1][Game.getMeridian(meridian - 1)] === null
            ) {
              // on bottom right
              this.possiblyBuilding(
                around,
                paralel - 1,
                Game.getMeridian(meridian - 1)
              );
            }
            if (this.board[paralel - 1][meridian] === null) {
              // on bottom
              this.possiblyBuilding(around, paralel - 1, meridian);
            }
            if (
              this.board[paralel - 1][Game.getMeridian(meridian + 1)] === null
            ) {
              // on bottom left
              this.possiblyBuilding(
                around,
                paralel - 1,
                Game.getMeridian(meridian + 1)
              );
            }
          }
        }
      }
    }
    return around;
  }

  addBuilding(
    building,
    owner,
    color,
    paralel,
    meridian,
    payForBuilding = true
  ) {
    try {
      meridian = Game.getMeridian(meridian);
      const ownerObj = this.playersObj[owner];
      const canPay = this.canPayForBuilding(building, ownerObj);

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
          if (paralel > 4 || ownerObj.base > 5) {
            throw new GameError(
              "Not valid place",
              "You can not build the base in not valid place on the map "
            );
          }

          ownerObj.base++;
          break;
        case "laboratory":
          if (ownerObj.labaratories.rate === 4) {
            ownerObj.labaratories.rate = 3;
            ownerObj.labaratories.two++;
          } else if (ownerObj.labaratories.rate === 3) {
            ownerObj.labaratories.rate = 2;
            ownerObj.labaratories.three++;
          }
          break;
        case "road":
          ownerObj.road++;
          break;
        case "H2O_station":
          ownerObj.base++;
          break;
        default:
          throw Error(`Building "${building}" does not exist`);
      }

      if (this.isGameStarted && canPay && payForBuilding) {
        this.payForBuilding(building, ownerObj);
      }
      // if (building === "H2O_station") console.log(true);;
      if (this.board[paralel][meridian] == null) {
        this.board[paralel][meridian] = new Building(
          building,
          owner,
          color,
          paralel,
          meridian
        );
      }
    } catch ({ title, message }) {
      throw new GameError(title, message);
    }
  }

  static buildingCosts = {
    air_station: { food: 2, mineral: 2 },
    food_station: { air: 2, mineral: 2 },
    mineral_station: { air: 2, food: 2 },
    base: { air: 3, food: 3, mineral: 3 },
    laboratory: { air: 4, mineral: 3 },
    peaceful_mission: { air: 3, food: 1 },
    agressive_mission: { air: 1, mineral: 3 },
    road: { road_cards: 3 },
    H2O_station: { air: 8, food: 8, mineral: 8 },
  };

  canPayForBuilding = (building, ownerObj) => {
    let canPay = false;

    if (building === "road") {
      if (ownerObj.road_cards >= Game.buildingCosts[building].road_cards) {
        canPay = true;
      } else canPay = false;
    } else {
      canPay = Object.keys(Game.buildingCosts[building]).every((card) => {
        return ownerObj.cards[card] - Game.buildingCosts[building][card] >= 0;
      });
    }

    if (!canPay)
      throw new GameError("Not enough resources", "Grow your colony");

    return canPay;
  };

  payForBuilding = (building, ownerObj) => {
    try {
      if (building === "road") {
        ownerObj.road_cards -= Game.buildingCosts[building].road_cards;
      } else {
        Object.keys(Game.buildingCosts[building]).forEach((card) => {
          ownerObj.cards[card] -= Game.buildingCosts[building][card];
        });
      }
    } catch ({ title, message }) {
      throw new GameError(title, message);
    }
  };

  possiblyBuilding = (around, paralel, meridian, isAboveTheBase = false) => {
    if (paralel === 6) {
      around[paralel][meridian] = "H2O_station";
    } else if (paralel === 5 && isAboveTheBase) {
      around[paralel][meridian] = "road";
    } else if (paralel < 5) {
      if (
        paralel < this.currentTurnPlayer.base &&
        this.currentTurnPlayer.labaratories.three >= 1
      ) {
        around[paralel][meridian] = "station";
      } else if (paralel < this.currentTurnPlayer.base) {
        around[paralel][meridian] = "no_base";
      } else if (this.currentTurnPlayer.labaratories.three >= 1) {
        around[paralel][meridian] = "no_labaratory";
      } else around[paralel][meridian] = "all";
    }
  };
}
