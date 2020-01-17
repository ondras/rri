import Dice from "./dice.js";
import Board from "./board.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";

const MAX_BONUSES = 3;

export default class Pool {
	node: HTMLElement = html.node("div", {className:"pool"});
	_dices: Dice[] = [];

	get length() {
		return this._dices.filter(d => !d.disabled && !d.blocked).length;
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];
		if (!dice || dice.disabled || dice.blocked) { return; }
		this.onClick(dice);
	}

	add(dice: Dice) {
		this.node.appendChild(dice.node);

		dice.node.addEventListener(DOWN, this);
		this._dices.push(dice);
	}

	enable(dice: Dice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.disabled = false;
		return true;
	}

	disable(dice: Dice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.disabled = true;
		return true;
	}

	pending(dice: Dice | null) {
		this._dices.forEach(d => d.pending = (dice == d));
	}

	onClick(dice: Dice) { console.log(dice); }

	sync(board: Board) {
		this._dices.filter(dice => !dice.disabled).forEach(dice => {
			let cells = board.getAvailableCells(dice.tile);
			dice.blocked = (cells.length == 0);
		});
	}
}

export class BonusPool extends Pool {
	_used = 0;
	_locked = false;

	constructor() {
		super();
		this.node.classList.add("bonus");
		this.add(Dice.withTile("cross-road-road-rail-road", "0"));
		this.add(Dice.withTile("cross-road-rail-rail-rail", "0"));
		this.add(Dice.withTile("cross-road", "0"));
		this.add(Dice.withTile("cross-rail", "0"));
		this.add(Dice.withTile("cross-road-rail-rail-road", "0"));
		this.add(Dice.withTile("cross-road-rail-road-rail", "0"));
	}

	handleEvent(e: Event) {
		if (this._locked || this._used == MAX_BONUSES) { return; }
		super.handleEvent(e);
	}

	disable(dice: Dice) {
		let disabled = super.disable(dice);
		if (disabled) { // only if disabled, i.e. the tile was ours
			this._used++;
			this._locked = true;
		}
		return disabled;
	}

	enable(dice: Dice) {
		let enabled = super.enable(dice);
		if (enabled) {
			this._used--;
			this.unlock();
		}
		return enabled;
	}

	unlock() {
		this._locked = false;
	}
}
