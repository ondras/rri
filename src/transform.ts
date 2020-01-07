import { Direction, clamp } from "./direction.js";

export type Transform = string;
const repo: {[key:string]: TransformImpl} = {};

class TransformImpl {
	_direction: number;
	_offset: number;

	constructor(direction: number, offset: number) {
		this._direction = direction;
		this._offset = offset;
	}

	apply(direction: Direction) {
		return clamp(this._direction * (direction + this._offset));
	}

	invert(direction: Direction) {
		return clamp(this._direction * direction - this._offset);
	}

	getCSS() {
		let scale = "";
		if (this._direction == -1) {
			scale = "scale(-1, 1) ";
		}
		return `${scale}rotate(${this._offset * 90}deg)`;
	}
}

function create(id: string) {
	let offset = Math.abs(Number(id));
	let direction = (id.startsWith("-") ? -1 : 1);
	repo[id] = new TransformImpl(direction, offset)
	return get(id);
}

export function get(id: string) {
	if (!(id in repo)) { throw new Error(`Transform ${id} not found`); } 
	return repo[id];
}

export const all = ["0", "1", "2", "3", "-0", "-1", "-2", "-3"];
all.forEach(create);
