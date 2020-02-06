import Dice from "./dice.js";
import Board from "./board.js";
import * as html from "./html.js";
import { DOWN_EVENT } from "./conf.js";
import { DiceDescriptor } from "./rules.js";

const MAX_BONUSES = 3;

export default class Pool {
	node: HTMLElement = html.node("div", {className:"pool"});
	_dices: Dice[] = [];

	get remaining() {
		return this._dices.filter(d => d.type == "plain" && !d.disabled && !d.blocked);
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];
		if (!dice || dice.disabled || dice.blocked) { return; }
		this.onClick(dice);
	}

	add(dice: Dice) {
		this.node.appendChild(dice.node);

		dice.node.addEventListener(DOWN_EVENT, this);
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

	onClick(_dice: Dice) {}

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

		["cross-road-road-rail-road", "cross-road-rail-rail-rail", "cross-road",
		 "cross-rail", "cross-road-rail-rail-road", "cross-road-rail-road-rail"].forEach(name => {
			let descriptor: DiceDescriptor = {sid:name, transform:"0", type:"plain"};
			this.add(Dice.fromDescriptor(descriptor));
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
