import { get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { Direction } from "./direction.js";
import { Edge, EdgeType, NONE, LAKE } from "./edge.js";
import * as html from "./html.js";

export interface SerializedTile {
	sid: string;
	tid: string;
}

export default class Tile {
	_sid: string;
	_tid!: string;
	node: HTMLImageElement;

	static fromJSON(data: SerializedTile) {
		return new this(data.sid, data.tid);
	}

	constructor(sid: string, transform: string) {
		this._sid = sid;
		this.node = getShape(sid).image.cloneNode(true) as HTMLImageElement;
		this.node.classList.add("tile");

		this.transform = transform;
	}

	toJSON(): SerializedTile {
		return {
			sid: this._sid,
			tid: this._tid
		}
	}

	clone() {
		return new Tile(this._sid, this.transform);
	}

	createCanvas() {
		const shape = getShape(this._sid);
		const source = shape.canvas;

		const canvas = html.node("canvas", {width:source.width, height:source.height});

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		getTransform(this._tid).applyToContext(ctx);
		ctx.drawImage(shape.canvas, 0, 0);

		return canvas;
	}

	get transform() { return this._tid; }

	set transform(transform: string) {
		this._tid = transform;
		this.node.style.transform = getTransform(transform).getCSS();
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
