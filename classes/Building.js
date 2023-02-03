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

// class Base extends Building() {
//   constructor(building, owner, color) {
//     super(building, owner, color, paralel, meridian);
//   }
// }
