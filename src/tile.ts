import { Transform, get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { Direction } from "./direction.js";
import { Edge, EdgeType, NONE } from "./edge.js";


export default class Tile {
	_sid: string;
	_tid!: Transform;
	node: HTMLElement;

	constructor(sid: string, transform: Transform) {
		this._sid = sid;
		this.node = getShape(sid).node.cloneNode(true) as HTMLElement;
		this.node.classList.add("tile");

		this.transform = transform;
	}

	clone() {
		return new Tile(this._sid, this.transform);
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
