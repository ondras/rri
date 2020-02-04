import Board from "./board-canvas.js";
import { BonusPool } from "./pool.js";

const dataset = document.body.dataset;

export default class Game {
	_node = document.querySelector("#game") as HTMLElement;
	_bonusPool = new BonusPool();

	play(_board: Board) {
		dataset.stage = "game";
	}

	_outro(_board: Board) {
		dataset.stage = "outro";
	}
}
