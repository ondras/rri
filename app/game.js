import { BonusPool } from "./pool.js";
const dataset = document.body.dataset;
export default class Game {
    constructor(_board) {
        this._board = _board;
        this._node = document.querySelector("#game");
        this._bonusPool = new BonusPool();
    }
    play() {
        dataset.stage = "game";
    }
    _outro() {
        dataset.stage = "outro";
    }
}
