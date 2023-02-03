export default class Player {
  constructor(username, color, playerId = null) {
    this.username = username;
    this.color = color;
    this.playerId = playerId;
  }

  static max_bases = 5;
  base = 1;
  static max_roads = 1;
  road_cards = 0;
  road = 0;

  buildings = {
    air_station: 0,
    food_station: 0,
    mineral_station: 0,
  };

  labaratories = {
    rate: 4,
    two: 0,
    three: 0,
  };

  cards = {
    air: 2,
    food: 2,
    mineral: 2,
  };

  resource_tokens = {
    air: {
      three: 0,
      eight: 0,
    },
    food: {
      three: 0,
      eight: 0,
    },
    mineral: {
      three: 0,
      eight: 0,
    },
  };

  mission_cards = {
    peaceful_mission: [],
    agressive_mission: [],
  };

  H2O_station = false;

  lastDice = null;
  isMyTurn = false;
}
