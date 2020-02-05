import Board from "./board.js";
import { BonusPool } from "./pool.js";

const dataset = document.body.dataset;

export default class Game {
	_node = document.querySelector("#game") as HTMLElement;
	_bonusPool = new BonusPool();

	constructor(readonly _board:Board) {
	}

	play() {
		dataset.stage = "game";
	}

	_outro() {
		dataset.stage = "outro";
	}
}
