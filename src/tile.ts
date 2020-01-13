import { Transform, get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { Direction } from "./direction.js";
import { Edge, EdgeType, NONE } from "./edge.js";
import * as html from "./html.js";


export default class Tile {
	_sid: string;
	_tid!: Transform;
	node: HTMLImageElement;

	constructor(sid: string, transform: Transform) {
		this._sid = sid;
		this.node = getShape(sid).image.cloneNode(true) as HTMLImageElement;
		this.node.classList.add("tile");

		this.transform = transform;
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

	set transform(transform: Transform) {
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
			if (nEdge == NONE || ourEdge == NONE) { return; }
			if (nEdge == ourEdge) {
				connections++;
			} else {
				errors++;
			}
		});

		return (errors == 0 && connections > 0);
	}
}
