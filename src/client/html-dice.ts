import Dice, { DiceType, DiceData } from "../dice.js";

import HTMLTile from "./html-tile.js";
import * as html from "./html.js";


export default class HTMLDice extends Dice {
	node: HTMLElement = html.node("div", {className:"dice"});

	static fromJSON(data: DiceData) {
		let tile = new HTMLTile(data.sid, data.transform);
		return new this(tile, data.type);
	}

	constructor(readonly _tile: HTMLTile, readonly _type: DiceType) {
		super(_tile, _type);

		if (this._type == "lake") { this.node.classList.add("lake"); }
		if (this._type == "forest") { this.node.classList.add("forest"); }

		this.node.appendChild(this._tile.node);
	}
}
