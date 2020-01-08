import { Direction, N, E, S, W } from "./direction.js";
import { TILE } from "./conf.js";

const LINE_WIDTH = 2;
const STATION = 18;
const RADIUS = 16;

const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;

const RAIL_TICK_SMALL = [2, 5];
const RAIL_TICK_LARGE = [2, 7];
const ROAD_TICK = [6, 4];

type Point = [number, number];

const STARTS = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const VECTORS = [[0, 1], [-1, 0], [0, -1], [1, 0]];

export default class DrawContext {
	_ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		canvas.width = canvas.height = TILE * devicePixelRatio;
		this._ctx = canvas.getContext("2d") as CanvasRenderingContext2D
		this._ctx.scale(devicePixelRatio, devicePixelRatio);
		this._ctx.lineWidth = LINE_WIDTH;
	}

	styleLine() {
		const ctx = this._ctx;

		ctx.lineWidth = LINE_WIDTH;
		ctx.setLineDash([]);
		ctx.lineDashOffset = 0;
	}

	styleRoadTicks(dash: number[], offset: number) {
		const ctx = this._ctx;

		ctx.lineWidth = LINE_WIDTH;
		ctx.setLineDash(dash);
		ctx.lineDashOffset = offset; 
	}

	styleRailTicks(dash: number[], offset: number) {
		const ctx = this._ctx;

		ctx.lineWidth = RAIL_WIDTH;
		ctx.setLineDash(dash);
		ctx.lineDashOffset = offset; 
	}

	station() {
		const ctx = this._ctx;
		let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
		ctx.fillRect(size[0]/2 - STATION/2, size[1]/2 - STATION/2, STATION, STATION);
	}
	
	railCross() {
		const ctx = this._ctx;

		ctx.beginPath();
	
		let c = [TILE/2, TILE/2];
		let d = RAIL_WIDTH/2;
	
		ctx.moveTo(c[0]-d, c[1]-d);
		ctx.lineTo(c[0]+d, c[1]+d);
	
		ctx.moveTo(c[0]-d, c[1]+d);
		ctx.lineTo(c[0]+d, c[1]-d);
	
		ctx.stroke();
	}
	
	roadTicks(edge: Direction, length: number) {
		const ctx = this._ctx;
		ctx.save();
	
		let pxLength = length * TILE;
		let start = STARTS[edge].map($ => $*TILE) as Point;
		let vec = VECTORS[edge];
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;
	
		this.styleRoadTicks(ROAD_TICK, -3);
	
		ctx.beginPath();
		ctx.moveTo(...start);
		ctx.lineTo(...end);
	
		ctx.stroke();
	
		ctx.restore();
	}
	
	railTicks(edge: Direction, length: number) {
		const ctx = this._ctx;

		let pxLength = length * TILE;
		let start = STARTS[edge].map($ => $*TILE) as Point;
		let vec = VECTORS[edge];
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;
	
		ctx.save();
	
		if (length > 0.5) {
			this.styleRailTicks(RAIL_TICK_LARGE, 5);
		} else {
			this.styleRailTicks(RAIL_TICK_SMALL, 3);
		}
	
		ctx.beginPath();
	
		ctx.moveTo(...start);
		ctx.lineTo(...end);
	
		ctx.stroke();
	
		ctx.restore();
	}
	
	rail(edge: Direction, length: number) {
		const ctx = this._ctx;
		let pxLength = length * TILE;
	
		let vec = VECTORS[edge];
		let start = STARTS[edge].map($ => $*TILE) as Point;
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;
	
		ctx.beginPath();
	
		ctx.moveTo(...start);
		ctx.lineTo(...end);
	
		ctx.stroke();
	
		this.railTicks(edge, length > 0.5 ? 1 : 0.35);
	}
	
	road(edge: Direction, length: number) {
		const ctx = this._ctx;
		let pxLength = length * TILE;
	
		let vec = VECTORS[edge];
		let start = STARTS[edge].map($ => $*TILE);
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength];
		switch (edge) {
			case N: ctx.clearRect(start[0] - ROAD_WIDTH/2, start[1], ROAD_WIDTH, pxLength); break;
			case S: ctx.clearRect(end[0] - ROAD_WIDTH/2, end[1], ROAD_WIDTH, pxLength); break;
	
			case W: ctx.clearRect(start[0], start[1] - ROAD_WIDTH/2, pxLength, ROAD_WIDTH); break;
			case E: ctx.clearRect(end[0], end[1] - ROAD_WIDTH/2, pxLength, ROAD_WIDTH); break;
		}
	
		ctx.beginPath();
	
		[-ROAD_WIDTH/2, ROAD_WIDTH/2].forEach(diff => {
			switch (edge) {
				case N:
				case S:
					ctx.moveTo(start[0]+diff, start[1]);
					ctx.lineTo(end[0]+diff, end[1]);
				break;
	
				case W:
				case E:
					ctx.moveTo(start[0], start[1]+diff);
					ctx.lineTo(end[0], end[1]+diff);
				break;
			}
		});
	
		ctx.stroke();
	
		this.roadTicks(edge, length);
	}
	
	arc(edge1: Direction, edge2: Direction, diff: number) {
		const ctx = this._ctx;
		diff *= ROAD_WIDTH/2;
		let R = RADIUS + diff;
		ctx.beginPath();
	
		let start = STARTS[edge1].map($ => $*TILE) as Point;
		let end = STARTS[edge2].map($ => $*TILE) as Point;
		let mid = [0, 0];
	
		switch (edge1) {
			case N:
			case S:
				start[0] += (edge2 == W ? 1 : -1)*diff;
				mid[0] = start[0];
			break;
	
			case E:
			case W:
				start[1] += (edge2 == N ? 1 : -1)*diff;
				mid[1] = start[1];
			break;
		}
	
		switch (edge2) {
			case N:
			case S:
				end[0] += (edge1 == W ? 1 : -1)*diff;
				mid[0] = end[0];
			break;
	
			case E:
			case W:
				end[1] += (edge1 == N ? 1 : -1)*diff;
				mid[1] = end[1];
			break;
		}
	
		ctx.moveTo(...start);
		ctx.arcTo(mid[0], mid[1], end[0], end[1], R);
		ctx.lineTo(...end);
	
		ctx.stroke();
	}
}
