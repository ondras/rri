import Tile from "./tile.js";


export type DiceType = "plain" | "lake" | "forest";

export interface DiceData {
	type: DiceType;
	sid: string;
	transform: string;
}

export default class Dice {
	blocked!: boolean;
	pending!: boolean;
	disabled!: boolean;

	static fromJSON(data: DiceData) {
		let tile = new Tile(data.sid, data.transform);
		return new this(tile, data.type);
	}

	constructor(readonly _tile: Tile, readonly _type: DiceType) {
	}

	toJSON(): DiceData {
		let tileData = this._tile.toJSON(); // FIXME do not expand tileData
		return {
			type: this._type,
			sid: tileData.sid,
			transform: tileData.tid
		}
	}

	get tile() { return this._tile; }
	get mandatory() { return this._type == "plain" || this._type == "forest"; }
}

["blocked", "pending", "disabled"].forEach(prop => {
	Object.defineProperty(Dice.prototype, prop, {
		get() { return this.node.classList.contains(prop); },
		set(flag) { this.node.classList.toggle(prop, flag); }
	});
});

