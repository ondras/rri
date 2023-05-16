import HTMLDice from "./html-dice.js";
import Board from "../board.js";
import * as html from "./html.js";
import { DOWN_EVENT } from "./conf.js";


const MAX_BONUSES = 3;

export default class Pool {
	node: HTMLElement = html.node("div", {className:"pool"});
	_dices: HTMLDice[] = [];

	constructor(label: string) {
		let heading = html.node("h2", {className:"heading"});
		heading.append(label);
		this.node.append(heading);
    }

	get remaining() {
		return this._dices.filter(d => d.mandatory && !d.disabled && !d.blocked);
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];
		if (!dice || dice.disabled || dice.blocked) { return; }
		this.onClick(dice);
	}

	add(dice: HTMLDice) {
		this.node.appendChild(dice.node);

		dice.node.addEventListener(DOWN_EVENT, this);
		this._dices.push(dice);
	}

	enable(dice: HTMLDice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.disabled = false;
		return true;
	}

	disable(dice: HTMLDice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.disabled = true;
		return true;
	}

	pending(dice: HTMLDice | null) {
		this._dices.forEach(d => d.pending = (dice == d));
	}

	onClick(_dice: HTMLDice) {}

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
		super("Special Routes");
		this.node.classList.add("bonus");

		["cross-road-road-rail-road", "cross-road-rail-rail-rail", "cross-road",
		 "cross-rail", "cross-road-rail-rail-road", "cross-road-rail-road-rail"].forEach(sid => {
			this.add(new HTMLDice("plain", sid));
		});
	}

	handleEvent(e: Event) {
		if (this._locked || this._used == MAX_BONUSES) { return; }
		super.handleEvent(e);
	}

	disable(dice: HTMLDice) {
		let disabled = super.disable(dice);
		if (disabled) { // only if disabled, i.e. the tile was ours
			this._used++;
			this._locked = true;
		}
		return disabled;
	}

	enable(dice: HTMLDice) {
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

	toJSON() {
		return this._dices.filter(d => d.disabled).map(d => this._dices.indexOf(d));
	}

	fromJSON(indices: number[]) {
		this._locked = false;
		indices.forEach(i => this.disable(this._dices[i]));
	}
}
