import { Direction, Vector, clamp, N, E, S, W } from "../direction.ts";
import DrawContext, { Point } from "../draw-context.ts";

import { TILE } from "./conf.ts";
import * as html from "./html.ts";


const RAIL_TICK_WIDTH = 1;
const LINE_WIDTH = 2;
const STATION = 18;
const RADIUS = 16;

const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;

const RAIL_TICK_SMALL = [RAIL_TICK_WIDTH, 6];
const RAIL_TICK_LARGE = [RAIL_TICK_WIDTH, 8];
const ROAD_TICK = [6, 4];

const STARTS: Point[] = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const TO_CENTER = Vector.map((_, i, all) => all[clamp(i+2)]);

function toAbs(p:Point) {
	return p.map($ => $*TILE) as Point;
}

function computeControlPoint(p1: Point, p2: Point): Point {
	if (p1[0] == p2[0]) {
		return [1-p1[0], 0.5];
	} else {
		return [0.5, 1-p1[1]];
	}
}

function createLakeCanvas() {
	const N = 4;
	const PX = 2;
	const canvas = html.node("canvas");
	canvas.width = canvas.height = N*PX;

	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	for (let i=0;i<N;i++) {
		for (let j=0;j<N;j++) {
			const H = 200 + ~~(Math.random()*(240-200));
			const S = 100;
			const V = 70 + ~~(Math.random()*(90-70));
			ctx.fillStyle = `hsl(${H}, ${S}%, ${V}%)`;
			ctx.fillRect(i*PX, j*PX, PX, PX);
		}
	}

	return canvas;
}

const lakeCanvas = createLakeCanvas();

export default class CanvasDrawContext implements DrawContext {
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

	styleLake() {
		const ctx = this._ctx;
		ctx.fillStyle = ctx.createPattern(lakeCanvas, "repeat") as CanvasPattern;
	}

	station() {
		const ctx = this._ctx;
		let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
		ctx.fillStyle = "#000";
		ctx.fillRect(size[0]/2 - STATION/2, size[1]/2 - STATION/2, STATION, STATION);
	}

	railCross() {
		const ctx = this._ctx;
		this.styleLine();

		ctx.lineWidth = RAIL_TICK_WIDTH;
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

		let pxLength = length * TILE;
		let start = toAbs(STARTS[edge]);
		let vec = TO_CENTER[edge];
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;

		this.styleRoadTicks(ROAD_TICK, -3);

		ctx.beginPath();
		ctx.moveTo(...start);
		ctx.lineTo(...end);

		ctx.stroke();
	}

	railTicks(edge: Direction, length: number) {
		const ctx = this._ctx;

		let pxLength = length * TILE;
		let start = toAbs(STARTS[edge]);
		let vec = TO_CENTER[edge];
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;

		if (length > 0.5) {
			this.styleRailTicks(RAIL_TICK_LARGE, 5);
		} else {
			this.styleRailTicks(RAIL_TICK_SMALL, 3);
		}

		ctx.beginPath();

		ctx.moveTo(...start);
		ctx.lineTo(...end);

		ctx.stroke();
	}

	rail(edge: Direction, length: number) {
		const ctx = this._ctx;
		this.styleLine();

		let pxLength = length * TILE;

		let vec = TO_CENTER[edge];
		let start = toAbs(STARTS[edge]);
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;

		ctx.beginPath();

		ctx.moveTo(...start);
		ctx.lineTo(...end);

		ctx.stroke();

		let ticksLength = length;
		if (length <= 0.5) { ticksLength = Math.min(ticksLength, 0.35); } // short rail segments have a max of .35 ticks
		this.railTicks(edge, ticksLength);
	}

	roadLine(edge: Direction, length: number, diff: number) {
		const ctx = this._ctx;
		this.styleLine();

		let pxLength = length * TILE;
		diff *= ROAD_WIDTH/2;

		let vec = TO_CENTER[edge];
		let start = toAbs(STARTS[edge]);
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength];

		ctx.beginPath();

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

		ctx.stroke();
	}

	road(edge: Direction, length: number) {
		const ctx = this._ctx;
		let pxLength = length * TILE;

		let vec = TO_CENTER[edge];
		let start = toAbs(STARTS[edge]);
		let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength];
		switch (edge) {
			case N: ctx.clearRect(start[0] - ROAD_WIDTH/2, start[1], ROAD_WIDTH, pxLength); break;
			case S: ctx.clearRect(end[0] - ROAD_WIDTH/2, end[1], ROAD_WIDTH, pxLength); break;

			case W: ctx.clearRect(start[0], start[1] - ROAD_WIDTH/2, pxLength, ROAD_WIDTH); break;
			case E: ctx.clearRect(end[0], end[1] - ROAD_WIDTH/2, pxLength, ROAD_WIDTH); break;
		}

		this.roadLine(edge, length, -1);
		this.roadLine(edge, length, +1);
		this.roadTicks(edge, length);
	}

	arc(quadrant: Direction, diff: number) {
		const ctx = this._ctx;

		diff *= ROAD_WIDTH/2;
		let R = RADIUS + diff;
		ctx.beginPath();

		let start = [0, 0] as Point; // N/S edge
		let end = [0, 0] as Point;   // E/W edge

		switch (quadrant) {
			case N: // top-left
				start[0] = end[1] = TILE/2 + diff;
			break;
			case E:  // top-right
				start[0] = TILE/2 - diff;
				end[0] = TILE;
				end[1] = TILE/2 + diff;
			break;
			case S: // bottom-right
				start[0] = TILE/2 - diff;
				start[1] = TILE;
				end[0] = TILE;
				end[1] = TILE/2 - diff;
			break;
			case W: // bottom-left
				end[1] = TILE/2 - diff;
				start[0] = TILE/2 + diff;
				start[1] = TILE;
			break;
		}

		ctx.moveTo(...start);
		ctx.arcTo(start[0], end[1], end[0], end[1], R);
		ctx.lineTo(...end);

		ctx.stroke();
	}

	redGlow(direction: Direction) {
		const ctx = this._ctx;

		let point = toAbs(STARTS[direction]);
		const R = 12;

		ctx.beginPath();
		ctx.arc(point[0], point[1], R, 0, Math.PI, false);

		ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
		ctx.fill();
	}

	lake(points: Point[]) {
		points.push(points[0]); // implicitly closed
		const ctx = this._ctx;

		const fillPath = new Path2D();
		const strokePath = new Path2D();

		for (let i=0;i<points.length; i++) {
			const point = points[i]
			const absPoint = toAbs(point);
			if (i == 0) {
				fillPath.moveTo(...absPoint);
				strokePath.moveTo(...absPoint);
				continue;
			}

			const prevPoint = points[i-1];

			if (point[0] == 0.5) { // arc
				let nextPoint = points[i+1];
				let cp = computeControlPoint(prevPoint, nextPoint);
				cp = toAbs(cp);
				nextPoint = toAbs(nextPoint);
				fillPath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
				strokePath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
				i++;
			} else { // straight line
				fillPath.lineTo(...absPoint);
				// only diagonals are stroked
				if (point[0] == prevPoint[0] || point[1] == prevPoint[1]) {
					strokePath.moveTo(...absPoint);
				} else {
					strokePath.lineTo(...absPoint);
				}
			}
		}

		this.styleLake();
		ctx.fill(fillPath);

		this.styleLine();
		ctx.stroke(strokePath);
	}

	forest() {
		const ctx = this._ctx;
		ctx.lineWidth = LINE_WIDTH;

		for (let i=0; i<3; i++) {
			let x = Math.round(TILE/4 * (i+1));
			let y = TILE*3/4 + TILE/6 * (i % 2 ? -1 : 1);
			ctx.beginPath();
			(Math.random() < 0.5 ? tree1(ctx, x, y) : tree2(ctx, x, y));
			ctx.fill();
			ctx.stroke();
		}
	}
}

function tree1(ctx: CanvasRenderingContext2D, x: number, y: number) {
	const R = TILE/8;
	const cy = y - TILE/3;

	ctx.fillStyle = "yellowgreen";
	ctx.moveTo(x, y);
	ctx.lineTo(x, cy + R);

	ctx.arc(x, cy, R, Math.PI/2, -Math.PI/2);
	ctx.arc(x, cy, R, -Math.PI/2, Math.PI/2);
}

function tree2(ctx: CanvasRenderingContext2D, x: number, y: number) {
	ctx.fillStyle = "forestgreen"
	ctx.moveTo(x, y);

	const STEP_X = TILE/10;
	const STEP_Y = TILE/8;

	y -= TILE/5;
	ctx.lineTo(x, y);
	ctx.lineTo(x-STEP_X, y);
	ctx.lineTo(x, y-STEP_Y);
	ctx.lineTo(x+STEP_X, y);
	ctx.lineTo(x, y);

	y -= STEP_Y;
	ctx.moveTo(x, y);
	ctx.lineTo(x-STEP_X, y);
	ctx.lineTo(x, y-STEP_Y);
	ctx.lineTo(x+STEP_X, y);
	ctx.lineTo(x, y);
}
