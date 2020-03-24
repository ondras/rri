import { get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { Direction } from "./direction.js";
import { Edge, EdgeType, NONE, LAKE, FOREST } from "./edge.js";


export interface TileData {
	sid: string;
	tid: string;
}

export default class Tile {
	_data: TileData;

	static fromJSON<T>(this: new(sid:string, tid:string) => T, data: TileData): T {
		return new this(data.sid, data.tid);
	}

	constructor(sid: string, tid: string) {
		this._data = { sid, tid }
	}

	get transform() { return this._data.tid; }
	set transform(transform: string) { this._data.tid = transform; }

	toJSON(): TileData { return this._data; }
	clone() { return Tile.fromJSON(this.toJSON()); }

	getEdge(direction: Direction): Edge {
		let transform = getTransform(this.transform);
		direction = transform.invert(direction);
		let edge = getShape(this._data.sid).edges[direction];
		return {
			type: edge.type,
			connects: edge.connects.map(d => transform.apply(d))
		};
	}

	getTransforms() { return getShape(this._data.sid).transforms; }

	fitsNeighbors(neighborEdges: EdgeType[]) {
		let connections = 0;
		let errors = 0;

		neighborEdges.forEach((nEdge, dir) => {
			let ourEdge = this.getEdge(dir as Direction).type;
			if (ourEdge == LAKE || ourEdge == FOREST) {
				connections++;
				return;
			}
			if (nEdge == NONE || ourEdge == NONE || nEdge == FOREST) { return; }
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
