import Dice, { DiceType } from "../dice.ts";

import HTMLTile from "./html-tile.ts";
import * as html from "./html.ts";


export default class HTMLDice extends Dice {
	_tile: HTMLTile;
	node: HTMLElement = html.node("div", {className:"dice"});

	constructor(readonly _type: DiceType, readonly _sid: string) {
		super(_type, _sid);

		if (this._type == "lake") { this.node.classList.add("lake"); }
		if (this._type == "forest") { this.node.classList.add("forest"); }

		this._tile = new HTMLTile(this._sid, "0");
		this.node.appendChild(this._tile.node);
	}

	protected get classList() { return this.node.classList; }

	get tile() { return this._tile; }
	get mandatory() { return this._type == "plain" || this._type == "forest"; }

	get blocked() { return this.classList.contains("blocked"); }
	set blocked(value: boolean) { this.classList.toggle("blocked", value); }

	get pending() { return this.classList.contains("pending"); }
	set pending(value: boolean) { this.classList.toggle("pending", value); }

	get disabled() { return this.classList.contains("disabled"); }
	set disabled(value: boolean) { this.classList.toggle("disabled", value); }
}
