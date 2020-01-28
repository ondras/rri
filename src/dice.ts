import Tile from "./tile.js";
import * as html from "./html.js";

interface DiceTemplate {
	tiles: string[];
	ctor: {new(tile: Tile): Dice}
}

export default class Dice {
	node: HTMLElement = html.node("div", {className:"dice"});
	_tile!: Tile;
	blocked!: boolean;
	pending!: boolean;
	disabled!: boolean;

	constructor(tile: Tile) {
		this.tile = tile;
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

export class LakeDice extends Dice {
	constructor(tile: Tile) {
		super(tile);
		this.node.classList.add("lake");
	}
}

export const DICE_REGULAR_1: DiceTemplate = {
	tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
	ctor: Dice
}

export const DICE_REGULAR_2: DiceTemplate = {
	tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
	ctor: Dice
}

export const DICE_LAKE: DiceTemplate = {
	tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
	ctor: LakeDice
}

export function create(template: DiceTemplate) {
	let names = template.tiles;
	let name = names[Math.floor(Math.random() * names.length)];
	return new template.ctor(new Tile(name, "0"));
}
