// interface IBuilding {
//   building:
//     | "air_station"
//     | "food_station"
//     | "mineral_station"
//     | "base"
//     | "laboratory"
//     | "peaceful_mission"
//     | "agressive_mission"
//     | "roads"
//     | "H2O_station";
//   owner: string;
//   color: "green" | "orange" | "pink" | "blue";
//   paralel: number;
//   meridian: number;
// }

export default class Building {
  constructor(building, owner, color, paralel, meridian) {
    this.building = building;
    this.owner = owner;
    this.color = color;
    this.paralel = paralel;
    this.meridian = meridian;
  }
  building;
  owner;
  color;
  paralel;
  meridian;
}

// interface IBuildingPlace {
//   type: "all" | "no_base" | "road" | "H2O_station"
// }
// "all" means no_road && no_H2O_station
// "no_base" means "all" without base

export class BuildingPlace {
  constructor(type) {
    this.type = type;
  }
  type;
}
