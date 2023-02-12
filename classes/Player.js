export default class Player {
  constructor(username, color, playerId = null) {
    this.username = username;
    this.color = color;
    this.playerId = playerId;
  }

  base = 0;
  road_cards = 3;
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
    air: 20,
    food: 20,
    mineral: 20,
  };

  resource_tokens = {
    air: {
      three: 2,
      eight: 2,
    },
    food: {
      three: 2,
      eight: 2,
    },
    mineral: {
      three: 2,
      eight: 2,
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
