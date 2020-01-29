import Tile from "./tile.js";
import * as html from "./html.js";

type DiceType = "plain" | "lake";

interface DiceTemplate {
	tiles: string[];
	type: DiceType;
}

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

export const DICE_REGULAR_1: DiceTemplate = {
	tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
	type: "plain"
}

export const DICE_REGULAR_2: DiceTemplate = {
	tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
	type: "plain"
}

export const DICE_LAKE: DiceTemplate = {
	tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
	type: "lake"
}
