import { GameType, ROUNDS, createDice } from "../rules.ts";
import Board from "../board.ts";

import HTMLDice from "./html-dice.ts";
import Game from "./game.ts";
import Round from "./round.ts";
import * as scoreTable from "./score-table.ts";


export default class SingleGame extends Game {
	constructor(_board:Board, readonly _type: GameType) {
		super(_board);
	}

	async play() {
		super.play();
		this._node.innerHTML = "";
		this._node.appendChild(this._bonusPool.node);

		let num = 1;
		while (num <= ROUNDS[this._type]) {
			let round = new Round(num, this._board, this._bonusPool);
			this._node.appendChild(round.node);
			let dice = createDice(HTMLDice, this._type, num);
			await round.play(dice);
			round.node.remove();
			num++;
		}

		this._outro();

		return true;
	}

	_outro() {
		super._outro();

		let s = this._board.getScore();
		this._board.showScore(s);

		const parent = document.querySelector("#score") as HTMLElement;
		parent.innerHTML = "";
		parent.appendChild(scoreTable.renderSingle(s));
	}
}
