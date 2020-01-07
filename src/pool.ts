import Dice from "./dice.js";
import * as html from "./html.js";

const MAX_BONUSES = 3;

export default class Pool {
	node: HTMLElement = html.node("div", {className:"pool"});
	_dices: Dice[] = [];

	get length() { 
		return this._dices.filter(d => !d.disabled).length;
	}

	handleEvent(e: PointerEvent) {
		let target = e.currentTarget as HTMLElement;
		let index = this._dices.map(dice => dice.node).indexOf(target);
		if (index == -1) { return; }
		this.onClick(this._dices[index]);
	}

	add(dice: Dice) {
		this.node.appendChild(dice.node);

		dice.node.addEventListener("pointerdown", this);
		this._dices.push(dice);
	}

	disable(dice: Dice) {
		if (!this._dices.includes(dice)) { return false; }
		dice.node.removeEventListener("pointerdown", this);
		dice.disabled = true;
		return true;
	}

	signal(dice: Dice | null) {
		this._dices.forEach(d => d.signal = (dice == d));
	}

	onClick(dice: Dice) { console.log(dice); }
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

	handleEvent(e: PointerEvent) {
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

	unlock() {
		this._locked = false;
	}
}
