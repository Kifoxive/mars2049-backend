export default class Player {
  constructor(username, color, playerId) {
    this.username = username;
    this.color = color;
    this.playerId = playerId;
  }

  base = 0;
  road_cards = 0;
  road = 0;

  buildings = {
    air_station: 0,
    food_station: 0,
    mineral_station: 0,
  };

  laboratories = {
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
  acted = false;
}
