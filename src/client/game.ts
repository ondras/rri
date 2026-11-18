import Board from "../board.js";
import { BonusPool } from "./pool.js";

const dataset = document.body.dataset;
const waitNode = document.querySelector("#live-score .wait") as HTMLElement;
const scoreNode = document.querySelector("#live-score .score") as HTMLElement;

export default class Game {
	_node = document.querySelector("#game") as HTMLElement;
	_bonusPool = new BonusPool();

	constructor(readonly _board:Board) {}

	async play(): Promise<boolean> {
		dataset.stage = "game"
		waitNode.textContent = "";
		scoreNode.textContent = "";
		return true;
	}

	_outro() {
		dataset.stage = "outro";
	}
}
