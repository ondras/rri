import Board from "./board.js";
import Pool, { BonusPool } from "./pool.js";
import Dice, { DICE_REGULAR_1, DICE_REGULAR_2, DICE_LAKE } from "./dice.js";
import Tile from "./tile.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import { Cell } from "./cell-repo.js";
import { DBLCLICK } from "./conf.js";

const DEMO = ["bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t",
				"lake-1", "lake-2", "lake-3", "lake-4", "lake-rail", "lake-road", "lake-rail-road"
			];
//const DEMO = ["bridge"];

export default class Round {
	node: HTMLElement;
	_num: number;
	_pending: Dice | null = null;
	_pool: Pool;
	_bonusPool: BonusPool;
	_board: Board;
	_end: HTMLButtonElement = html.node("button");
	_placedTiles = new Map<Tile, Dice>();
	_lastClickTs = 0;

	constructor(num: number, board: Board, bonusPool: BonusPool) {
		this._num = num;
		this._board = board;
		this._bonusPool = bonusPool;

		this._pool = new Pool();
		this.node = this._pool.node;

		this._end.textContent = `End round #${this._num}`;
	}

	start(type="normal") {
		this._pool.onClick = dice => this._onPoolClick(dice);
		this._bonusPool.onClick = dice => this._onPoolClick(dice);
		this._board.onClick = cell => this._onBoardClick(cell);

		switch (type) {
			case "demo":
				DEMO.map(type => new Dice(new Tile(type, "0")))
					.forEach(dice => this._pool.add(dice));
			break;

			case "lake": {
				let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
				while (templates.length) {
					let index = Math.floor(Math.random()*templates.length);
					let template = templates.splice(index, 1)[0];
					this._pool.add(Dice.fromTemplate(template));
				}
				this._pool.add(Dice.fromTemplate(DICE_LAKE));
				this._pool.add(Dice.fromTemplate(DICE_LAKE));
			} break;

			default: {
				let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
				while (templates.length) {
					let index = Math.floor(Math.random()*templates.length);
					let template = templates.splice(index, 1)[0];
					this._pool.add(Dice.fromTemplate(template));
				}
			} break;
		}

		this.node.appendChild(this._end);
		this._syncEnd();
		this._bonusPool.unlock();

		return new Promise(resolve => {
			this._end.addEventListener(DOWN, () => {
				!this._end.disabled && resolve();
			});
		});
	}

	end() {
		this._board.commit(this._num);

		function noop() {};
		this._pool.onClick = noop;
		this._bonusPool.onClick = noop;
		this._board.onClick = noop;
	}

	_onPoolClick(dice: Dice) {
		if (this._pending == dice) {
			this._pending = null;
			this._board.signal([]);
			this._pool.pending(null);
			this._bonusPool.pending(null);
		} else {
			this._pending = dice;
			let available = this._board.getAvailableCells(dice.tile);
			this._board.signal(available);
			this._pool.pending(dice);
			this._bonusPool.pending(dice);
		}
	}

	_onBoardClick(cell: Cell) {
		const ts = Date.now();
		if (ts-this._lastClickTs < DBLCLICK) {
			this._tryToRemove(cell);
		} else if (this._pending) {
			this._tryToAdd(cell);
		} else {
			this._tryToCycle(cell);
			this._lastClickTs = ts;
		}
	}

	_tryToRemove(cell: Cell) {
		let tile = cell.tile;
		if (!tile) { return; }

		let dice = this._placedTiles.get(tile);
		if (!dice) { return; }

		this._placedTiles.delete(tile);
		this._board.place(null, cell.x, cell.y, 0);

		this._pool.enable(dice);
		this._bonusPool.enable(dice);

		this._syncEnd();
	}

	_tryToAdd(cell: Cell) {
		if (!this._pending) { return; }

		let tile = this._pending.tile;
		let available = this._board.getAvailableCells(tile);
		if (!available.includes(cell)) { return false; }

		const x = cell.x;
		const y = cell.y;
		const clone = tile.clone();
		this._board.placeBest(clone, x, y, this._num);
		this._board.signal([]);

		this._pool.pending(null);
		this._bonusPool.pending(null);

		this._pool.disable(this._pending);
		this._bonusPool.disable(this._pending);

		this._placedTiles.set(clone, this._pending);
		this._pending = null;
		this._syncEnd();

	}

	_tryToCycle(cell: Cell) {
		let tile = cell.tile;
		if (!tile) { return; }
		if (!this._placedTiles.has(tile)) { return; }

		this._board.cycleTransform(cell.x, cell.y);
		this._syncEnd();
	}

	_syncEnd() {
		this._pool.sync(this._board);
		this._end.disabled = (this._pool.remaining > 0);
	}
}
