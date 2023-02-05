export default class GameError extends Error {
  constructor(title, message) {
    super(message);
    this.title = title;
    this.message = message;
  }
  title;
  message;
}
