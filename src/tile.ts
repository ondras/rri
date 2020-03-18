import { get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { Direction } from "./direction.js";
import { Edge, EdgeType, NONE, LAKE } from "./edge.js";

export interface SerializedTile {
	sid: string;
	tid: string;
}

export default class Tile {
	_sid: string;
	_tid!: string;

	static fromJSON(data: SerializedTile) {
		return new this(data.sid, data.tid);
	}

	constructor(sid: string, transform: string) {
		this._sid = sid;

		this.transform = transform;
	}

	toJSON(): SerializedTile {
		return {
			sid: this._sid,
			tid: this._tid
		}
	}

	clone() { return new Tile(this._sid, this.transform); }

	get transform() { return this._tid; }

	set transform(transform: string) {
		this._tid = transform;
	}

	getEdge(direction: Direction): Edge {
		let transform = getTransform(this.transform);
		direction = transform.invert(direction);
		let edge = getShape(this._sid).edges[direction];
		return {
			type: edge.type,
			connects: edge.connects.map(d => transform.apply(d))
		};
	}

	getTransforms() { return getShape(this._sid).transforms; }

	fitsNeighbors(neighborEdges: EdgeType[]) {
		let connections = 0;
		let errors = 0;

		neighborEdges.forEach((nEdge, dir) => {
			let ourEdge = this.getEdge(dir as Direction).type;
			if (ourEdge == LAKE) {
				connections++;
				return;
			}
			if (nEdge == NONE || ourEdge == NONE) { return; }
			if (nEdge == ourEdge) {
				connections++;
			} else {
				errors++;
			}
		});

		if (errors > 0) { return 0; }
		return connections;
	}
}
