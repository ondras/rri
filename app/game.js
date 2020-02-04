import { BonusPool } from "./pool.js";
const dataset = document.body.dataset;
export default class Game {
    constructor() {
        this._node = document.querySelector("#game");
        this._bonusPool = new BonusPool();
    }
    play(_board) {
        dataset.stage = "game";
    }
    _outro(_board) {
        dataset.stage = "outro";
    }
}
