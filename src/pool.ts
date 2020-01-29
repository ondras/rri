import Dice from "./dice.js";
import Board from "./board.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import Tile from "./tile.js";

const MAX_BONUSES = 3;

export default class Pool {
	node: HTMLElement = html.node("div", {className:"pool"});
	_dices: Dice[] = [];

	get remaining() {
		return this._dices.filter(d => d.flag("mandatory") && !d.flag("disabled") && !d.flag("blocked")).length;
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];
		if (!dice || dice.flag("disabled") || dice.flag("blocked")) { return; }
		this.onClick(dice);
	}

	add(dice: Dice) {
		this.node.appendChild(dice.node);

		dice.node.addEventListener(DOWN, this);
		this._dices.push(dice);
	}

	enable(dice: Dice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.flag("disabled", false);
		return true;
	}

	disable(dice: Dice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.flag("disabled", true);
		return true;
	}

	pending(dice: Dice | null) {
		this._dices.forEach(d => d.flag("pending", dice == d));
	}

	onClick(dice: Dice) { console.log(dice); }

	sync(board: Board) {
		this._dices.filter(dice => !dice.flag("disabled")).forEach(dice => {
			let cells = board.getAvailableCells(dice.tile);
			dice.flag("blocked", cells.length == 0);
		});
	}
}

export class BonusPool extends Pool {
	_used = 0;
	_locked = false;

	constructor() {
		super();
		this.node.classList.add("bonus");

		["cross-road-road-rail-road", "cross-road-rail-rail-rail", "cross-road",
		 "cross-rail", "cross-road-rail-rail-road", "cross-road-rail-road-rail"].forEach(name => {
			this.add(new Dice(new Tile(name, "0")));
		});
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
