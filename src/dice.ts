import Tile from "./tile.js";
import * as html from "./html.js";

interface DiceTemplate {
	tiles: string[];
	flags: string[];
}

export default class Dice {
	node: HTMLElement = html.node("div", {className:"dice"});
	_tile!: Tile;

	static fromTemplate(template: DiceTemplate) {
		let names = template.tiles;
		let name = names[Math.floor(Math.random() * names.length)];
		let instance = new this(new Tile(name, "0"));
		template.flags.forEach(flag => instance.flag(flag, true));
		return instance;
	}

	constructor(tile: Tile) {
		this.tile = tile;
	}

	get tile() { return this._tile; }
	set tile(tile: Tile) {
		this._tile = tile;
		this.node.innerHTML = "";
		this.node.appendChild(tile.node);
	}

	flag(name: string, value?: boolean) {
		if (arguments.length > 1) { this.node.classList.toggle(name, value); }
		return this.node.classList.contains(name);
	}
}

export const DICE_REGULAR_1: DiceTemplate = {
	tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
	flags: ["mandatory"]
}

export const DICE_REGULAR_2: DiceTemplate = {
	tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
	flags: ["mandatory"]
}

export const DICE_LAKE: DiceTemplate = {
	tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
	flags: ["lake"]
}
