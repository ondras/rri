import Board from "./board.js";
import Pool, { BonusPool } from "./pool.js";
import Dice from "./dice.js";
import * as html from "./html.js";

export default class Round {
	node: HTMLElement;
	_num: number;
	_pending: Dice | null = null;
	_pool: Pool;
	_bonusPool: BonusPool;
	_board: Board;
	_end: HTMLButtonElement = html.node("button");

	constructor(num: number, board: Board, bonusPool: BonusPool) {
		this._num = num;
		this._board = board;
		this._bonusPool = bonusPool;

		this._pool = new Pool();
		this._pool.onClick = dice => this._onPoolClick(dice);
		this._bonusPool.onClick = dice => this._onPoolClick(dice);
		this.node = this._pool.node;

		this._end.textContent = `End round #${this._num}`;
		this._end.disabled = true;
		this._end.addEventListener("pointerdown", () => this.onEnd(this._num));

		this._board.onClick = (x, y) => this._onBoardClick(x, y);

		["bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t"].forEach(type => {
			this._pool.add(Dice.withTile(type, "0"));
		});
		this.node.appendChild(this._end);

		this._bonusPool.unlock();
	}

	onEnd(num: number) { console.log(num); }

	_onPoolClick(dice: Dice) {
		if (this._pending == dice) {
			this._pending = null;
			this._board.signalAvailable(null);
			this._pool.signal(null);
			this._bonusPool.signal(null);
		} else {
			this._pending = dice;
			this._board.signalAvailable(dice.tile);
			this._pool.signal(dice);	
			this._bonusPool.signal(dice);	
		}
	}

	_onBoardClick(x: number, y: number) {
		if (this._pending) {
			let tile = this._pending.tile;
			if (!this._board.wouldFit(tile, x, y)) { return false; }

			let clone = tile.clone();
			this._board.placeBest(clone, x, y, this._num);
			this._board.signalAvailable(null);

			this._pool.signal(null);
			this._bonusPool.signal(null);

			this._pool.disable(this._pending);
			this._bonusPool.disable(this._pending);

			this._pending = null;

			if (this._pool.length == 0) { this._end.disabled = false; } // fixme re-disable on return
		} else {
			this._board.cycleTransform(x, y);
		}
	}
}
