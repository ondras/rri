import Board from "../board.js";
import { Cell } from "../cell-repo.js";
import Tile from "../tile.js";

import Pool, { BonusPool } from "./pool.js";
import * as html from "./html.js";
import { DBLCLICK } from "./conf.js";
import HTMLDice from "./html-dice.js";


export default class Round {
	node: HTMLElement;
	_pending: HTMLDice | null = null;
	_pool: Pool;
	_endButton: HTMLButtonElement = html.node("button");
	_placedDice = new Map<Cell, HTMLDice>();
	_lastClickTs = 0;

	constructor(readonly number: number, readonly _board: Board, readonly _bonusPool: BonusPool) {
		this._pool = new Pool(`Round #${this.number} Routes`);
		this.node = this._pool.node;

		this._endButton.textContent = `End round #${this.number}`;
/**
		window.addEventListener("keydown", e => {
			if (e.ctrlKey && e.key == "a") {
				e.preventDefault();
				while (true) {
					let r = this._pool.remaining;
					if (!r.length) break;
					let d = r.shift() as Dice;
					this._onPoolClick(d);
					let avail = this._board.getAvailableCells(d.tile);
					if (!avail.length) break;
					let cell = avail[Math.floor(Math.random() * avail.length)];
					this._onBoardClick(cell);
				}
			}
		});
/**/
	}

	play(dice: HTMLDice[]) {
		dice.forEach(dice => this._pool.add(dice))
		this.node.appendChild(this._endButton);

		this._pool.onClick = dice => this._onPoolClick(dice);
		this._bonusPool.onClick = dice => this._onPoolClick(dice);
		this._board.onClick = cell => this._onBoardClick(cell);

		this._syncEnd();
		this._bonusPool.unlock();

		return new Promise(resolve => {
			this._endButton.addEventListener("click", _ => {
				let valid = this._validatePlacement();
				if (!valid) {
					alert("Some of your dice were not placed according to the rules. Please re-place them correctly.");
					return;
				}
				this._end();
				resolve();
			});
		});
	}

	_end() {
		this._board.commit(this.number);

		function noop() {};
		this._pool.onClick = noop;
		this._bonusPool.onClick = noop;
		this._board.onClick = noop;
	}

	_onPoolClick(dice: HTMLDice) {
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
		let dice = this._placedDice.get(cell);
		if (!dice) { return; }

		this._placedDice.delete(cell);
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
		this._board.placeBest(tile.clone(), x, y, this.number);
		this._board.signal([]);

		this._pool.pending(null);
		this._bonusPool.pending(null);

		this._pool.disable(this._pending);
		this._bonusPool.disable(this._pending);

		this._placedDice.set(cell, this._pending);
		this._pending = null;
		this._syncEnd();
	}

	_tryToCycle(cell: Cell) {
		if (!this._placedDice.has(cell)) { return; }

		this._board.cycleTransform(cell.x, cell.y);
		this._syncEnd();
	}

	_syncEnd() {
		this._pool.sync(this._board);
		this._endButton.disabled = (this._pool.remaining.length > 0);
	}

	_validatePlacement() {
		interface TodoItem {
			cell: Cell,
			tile: Tile
		};

		// retrieve a list of placed tiles (and their cells); empty the board in the process
		let todo: TodoItem[] = [];
		for (let cell of this._placedDice.keys()) {
			todo.push({
				cell,
				tile: cell.tile as Tile
			});
			this._board.place(null, cell.x, cell.y, 0);
		}

		while (todo.length) {
			// try re-placing any of the items back
			let placed = todo.some((item, index) => {
				let cell = item.cell;
				let neighbors = this._board.getNeighborEdges(cell.x, cell.y);
				if (item.tile.fitsNeighbors(neighbors)) {
					this._board.place(item.tile, cell.x, cell.y, this.number);
					todo.splice(index, 1);
					return true;
				} else {
					return false;
				}
			});

			if (!placed) { // we found a non-re-insertable situation
				todo.forEach(item => this._tryToRemove(item.cell)); // return non-placeable back to pool(s)
				return false;
			}
		}

		return true;
	}
}
