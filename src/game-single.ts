import Game from "./game.js";
import Round from "./round.js";
import { GameType, ROUNDS } from "./rules.js";
import Board from "./board-canvas.js";
import * as score from "./score.js";

export default class SingleGame extends Game {
	constructor(readonly _type: GameType) {
		super();
	}

	async play(board: Board) {
		super.play(board);
		this._node.innerHTML = "";

		this._node.appendChild(this._bonusPool.node);

		let num = 1;
		while (num <= ROUNDS[this._type]) {
			let round = new Round(num, board, this._bonusPool);
			this._node.appendChild(round.node);
			await round.start(this._type);
			round.end();
			round.node.remove();
			num++;
		}

		this._outro(board);
	}

	_outro(board: Board) {
		super._outro(board);

		let s = board.getScore();
		board.showScore(s);

		const placeholder = document.querySelector("#outro div") as HTMLElement;
		placeholder.innerHTML = "";
		placeholder.appendChild(score.render(s));
	}
}
