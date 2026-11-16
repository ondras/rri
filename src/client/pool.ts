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
		let result = this._dices.filter(d => d.mandatory && !d.disabled && !d.blocked);

		let lava = this._dices.filter(d => d._type == "lava");
		let lavaPlaced = lava.some(d => d.disabled);

		if (lava.length && !lavaPlaced) {
			result.push(lava.filter(d => !d.disabled && !d.blocked)[0] || lava[0]);
		}

		return result;
	}

	get lavaRequiredBlocked() {
		let lava = this._dices.filter(d => d._type == "lava");
		let lavaPlaced = lava.some(d => d.disabled);

		if (!lava.length || lavaPlaced) { return false; }

		return lava.every(d => d.blocked);
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];

		if (!dice || dice.disabled) { return; }
		if (dice.blocked && !(dice._type == "lava" && this.lavaRequiredBlocked)) { return; }

		this.onClick(dice);
	}

	add(dice: HTMLDice) {
		this.node.insertBefore(dice.node, this.node.querySelector("button"));

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

		let forced = this.lavaRequiredBlocked;
		this._dices.forEach(dice => {
			dice.node.classList.toggle("forced", dice._type == "lava" && forced);
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

	setup(type: string) {
		if (type != "lava") { return; }
		if (this._dices.some(dice => dice._type == "volcano")) { return; }

		this.add(new HTMLDice("volcano", "volcano"));
	}

	handleEvent(e: Event) {
		let target = e.currentTarget as HTMLElement;
		let dice = this._dices.filter(dice => dice.node == target)[0];

		if (!dice || !dice.repeatable) {
			if (this._locked || this._used == MAX_BONUSES) { return; }
		}

	super.handleEvent(e);
	}

	disable(dice: HTMLDice) {
		let disabled = super.disable(dice);
		if (disabled && !dice.repeatable) { // only if disabled, i.e. the tile was ours
			this._used++;
			this._locked = true;
		}
		return disabled;
	}

	enable(dice: HTMLDice) {
		let enabled = super.enable(dice);
		if (enabled && !dice.repeatable) {
			this._used--;
			this._locked = false;
		}
		return enabled;
	}

	unlock() {
		this._locked = false;
		this._dices.filter(dice => dice.repeatable).forEach(dice => this.enable(dice));
	}

	toJSON() {
		return this._dices.filter(d => d.disabled && !d.repeatable).map(d => this._dices.indexOf(d));
	}

	fromJSON(indices: number[]) {
		this._locked = false;
		indices.forEach(i => this.disable(this._dices[i]));
	}
}
