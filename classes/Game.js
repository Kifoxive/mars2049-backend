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
  turnIndex = 0;
  totalGameTurn = 0;
  playersColors = {};
  currentTurnPlayer = null;
  diceSymbol = null;
  canMakeTurn = false;
  diced = false;
  isGameStarted = false;
  winner = null;

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

    this.currentTurnPlayer = this.playersObj[this.playersNames[this.turnIndex]];
    this.currentTurnPlayer.isMyTurn = true;
    this.madeStartBases();
    this.isGameStarted = true;
  }

  makeTurn() {
    if (!this.canMakeTurn) throw Error("Can not make turnIndex, shake a dice");
    this.currentTurnPlayer.isMyTurn = false;
    //  this.turnIndex = this.turnIndex < this.playersCount - 1 ? this.turnIndex + 1 : 0;
    this.turnIndex =
      this.turnIndex === 0 ? this.playersCount - 1 : this.turnIndex - 1;
    this.currentTurnPlayer = this.playersObj[this.playersNames[this.turnIndex]];
    this.currentTurnPlayer.isMyTurn = true;
    if (this.playersNames[0] === this.currentTurnPlayer.username) {
      this.totalGameTurn++;
    }
    this.canMakeTurn = false;
    this.diced = false;
  }

  win() {
    this.winner = this.currentTurnPlayer;
  }
  finish() {
    console.log("finish");
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
    if (this.diced) throw new GameError("Already diced", "Some error occured");
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
        // this.canMakeTurn = true;
        // this.makeTurn();
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
    if (!this.diced)
      throw new GameError("Not diced", "The dice was not shaked");
    const around = [];
    for (let i = 0; i < 7; i++) {
      around[i] = this.board[i].slice();
    }

    for (let paralel = 0; paralel < 7; paralel++) {
      if (paralel + 1 === 6 && this.board[6][0] === null) {
        this.possiblyBuilding(around, paralel + 1, 0);
        break;
      }

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
    ownerName,
    color,
    paralel,
    meridian,
    payForBuilding = true
  ) {
    try {
      meridian = Game.getMeridian(meridian);
      const ownerObj = this.playersObj[ownerName];

      if (building === "laboratory") {
        switch (ownerObj.laboratories.rate) {
          case 4:
            building = "laboratory_three";
            break;
          case 3:
            building = "laboratory_two";
            break;
          case 2:
            return;
        }
      }

      const canPay = this.canPayForBuilding(building, ownerObj);

      if (!canPay && payForBuilding)
        throw new GameError("Not enough resources", "Grow your colony");

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
        case "laboratory_two":
          ownerObj.laboratories.rate = 2;
          ownerObj.laboratories.two++;
          break;
        case "laboratory_three":
          ownerObj.laboratories.rate = 3;
          ownerObj.laboratories.three++;
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

      if (this.board[paralel][meridian] == null) {
        this.board[paralel][meridian] = new Building(
          building,
          ownerName,
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
    laboratory_two: { air: 4, mineral: 3 },
    laboratory_three: { air: 4, mineral: 3 },
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
      }
    } else {
      canPay = Object.keys(Game.buildingCosts[building]).every((card) => {
        return ownerObj.cards[card] - Game.buildingCosts[building][card] >= 0;
      });
    }

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
    if (paralel === 6 && this.currentTurnPlayer.road === 1) {
      around[paralel][meridian] = "H2O_station";
    } else if (paralel === 5 && isAboveTheBase) {
      around[paralel][meridian] = "road";
    } else if (paralel < 5) {
      if (
        paralel < this.currentTurnPlayer.base &&
        this.currentTurnPlayer.laboratories.three >= 1
      ) {
        around[paralel][meridian] = "station";
      } else if (paralel < this.currentTurnPlayer.base) {
        around[paralel][meridian] = "no_base";
      } else if (this.currentTurnPlayer.laboratories.two >= 1) {
        around[paralel][meridian] = "no_laboratory";
      } else around[paralel][meridian] = "all";
    }
  };

  static tokens = {
    three: 3,
    eight: 8,
  };

  buyToken(resource, to) {
    const player = this.currentTurnPlayer;

    if (player.cards[resource] - Game.tokens[to] >= 0) {
      player.cards[resource] -= Game.tokens[to];
      player.resource_tokens[resource][to]++;
    }
    return;
  }

  sellToken(resource, from) {
    const player = this.currentTurnPlayer;

    if (player.resource_tokens[resource][from] > 0) {
      player.resource_tokens[resource][from]--;
      player.cards[resource] += Game.tokens[from];
    }
    return;
  }

  tradeCards(from, to) {
    const playerObj = this.currentTurnPlayer;
    if (playerObj.cards[from] >= playerObj.laboratories.rate) {
      playerObj.cards[from] -= playerObj.laboratories.rate;
      playerObj.cards[to] += 1;
    }
  }
}
