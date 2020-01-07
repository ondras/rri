import Tile from "./tile.js";
import { Transform } from "./transform.js";
import * as html from "./html.js";

export default class Dice {
	node: HTMLElement = html.node("div", {className:"dice"});
	_tile!: Tile;

	static withTile(name: string, transform: Transform) {
		return new this(new Tile(name, transform));
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

	set signal(signal: boolean) { this.node.classList.toggle("signal", signal); }

	get disabled() { return this.node.classList.contains("disabled"); }
	set disabled(disabled) { this.node.classList.toggle("disabled", disabled); }
}
