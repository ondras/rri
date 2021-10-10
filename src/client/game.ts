import Board from "../board.ts";
import { BonusPool } from "./pool.ts";

const dataset = document.body.dataset;

export default class Game {
	_node = document.querySelector("#game") as HTMLElement;
	_bonusPool = new BonusPool();

	constructor(readonly _board:Board) {}

	async play(): Promise<boolean> {
		dataset.stage = "game";
		return true;
	}

	_outro() {
		dataset.stage = "outro";
	}
}
