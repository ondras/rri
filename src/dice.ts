import Tile from "./tile.js";
import * as html from "./html.js";
import { DiceTemplate, DiceType }  from "./rules.js";

export default class Dice {
	node: HTMLElement = html.node("div", {className:"dice"});
	_tile!: Tile;
	blocked!: boolean;
	pending!: boolean;
	disabled!: boolean;
	readonly type: DiceType;

	static fromTemplate(template: DiceTemplate) {
		let names = template.tiles;
		let name = names[Math.floor(Math.random() * names.length)];
		return new this(new Tile(name, "0"), template.type);
	}

	constructor(tile: Tile, type: DiceType) {
		this.tile = tile;
		this.type = type;

		if (type == "lake") { this.node.classList.add("lake"); }
	}

	get tile() { return this._tile; }
	set tile(tile: Tile) {
		this._tile = tile;
		this.node.innerHTML = "";
		this.node.appendChild(tile.node);
	}
}

["blocked", "pending", "disabled"].forEach(prop => {
	Object.defineProperty(Dice.prototype, prop, {
		get() { return this.node.classList.contains(prop); },
		set(flag) { this.node.classList.toggle(prop, flag); }
	});
});

