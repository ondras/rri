import { Direction, Vector, clamp, N, E, S, W } from "../direction.js";
import DrawContext, { Point } from "../draw-context.js";

import { TILE } from "./conf.js";
import * as html from "./html.js";


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

const DPR = devicePixelRatio;

function toAbs(p:Point) {
	return p.map($ => $*TILE) as Point;
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

function createLavaCanvas() {
	const N = 4;
	const PX = 2;
	const canvas = html.node("canvas");
	canvas.width = canvas.height = N*PX;

	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	for (let i=0;i<N;i++) {
		for (let j=0;j<N;j++) {
			const H = 10 + ~~(Math.random()*35);
			const S = 100;
			const V = 30 + ~~(Math.random()*50);
			ctx.fillStyle = `hsl(${H}, ${S}%, ${V}%)`;
			ctx.fillRect(i*PX, j*PX, PX, PX);
		}
	}

	return canvas;
}

const lavaCanvas = createLavaCanvas();

const WAVE = TILE / 28;
const WAVELENGTH = TILE / 5.6; // half wave

function createBubbles() {
	let bubbles: number[][] = [];
	for (let i=0;i<16;i++) { // x, y, radius
		bubbles.push([Math.random(), Math.random(), 1 + Math.random()]);
	}
	return bubbles;
}

const BUBBLES = createBubbles();

const ERUPTION = [ // from x/y, control x/y, to x/y
	[0.44, 0.41, 0.47, 0.32, 0.31, 0.23],
	[0.50, 0.41, 0.46, 0.26, 0.64, 0.10],
	[0.54, 0.39, 0.61, 0.26, 0.68, 0.29]
];

function isBorder(p1: Point, p2: Point) {
	return (p1[0] == p2[0] && (p1[0] == 0 || p1[0] == 1))
		|| (p1[1] == p2[1] && (p1[1] == 0 || p1[1] == 1));
}

function wavyShore(shore: Point[]) {
	const first = shore[0];
	const last = shore[shore.length-1];
	const mid = (shore.length > 2 ? shore[1] : null);

	// quadratic through the middle point; without one this degenerates to a straight line
	const cp: Point = (mid
		? [2*mid[0] - (first[0]+last[0])/2, 2*mid[1] - (first[1]+last[1])/2]
		: [(first[0]+last[0])/2, (first[1]+last[1])/2]);

	function at(t: number): Point {
		const s = 1-t;
		return [
			s*s*first[0] + 2*s*t*cp[0] + t*t*last[0],
			s*s*first[1] + 2*s*t*cp[1] + t*t*last[1]
		];
	}

	function tangent(t: number): Point {
		const s = 1-t;
		return [
			2*s*(cp[0]-first[0]) + 2*t*(last[0]-cp[0]),
			2*s*(cp[1]-first[1]) + 2*t*(last[1]-cp[1])
		];
	}

	let length = 0;
	for (let i=1; i<shore.length; i++) {
		length += Math.sqrt((shore[i][0]-shore[i-1][0])**2 + (shore[i][1]-shore[i-1][1])**2);
	}

	// an odd number of half waves vanishes at both ends and mirrors around the middle
	const halfWaves = Math.round((length/WAVELENGTH - 1)/2)*2 + 1;
	const steps = halfWaves * 8;

	let points: Point[] = [];
	for (let i=0; i<=steps; i++) {
		const t = i/steps;
		const p = at(t);
		const d = tangent(t);
		const len = Math.sqrt(d[0]**2 + d[1]**2) || 1;
		const wobble = Math.sin(t * Math.PI * halfWaves) * WAVE;
		points.push([p[0] + d[1]/len*wobble, p[1] - d[0]/len*wobble]);
	}

	return points;
}

export default class CanvasDrawContext implements DrawContext {
	_ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		canvas.width = canvas.height = TILE * DPR;
		this._ctx = canvas.getContext("2d") as CanvasRenderingContext2D
		this._ctx.scale(DPR, DPR);
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

	styleLava() {
	const ctx = this._ctx;
	ctx.fillStyle = ctx.createPattern(lavaCanvas, "repeat") as CanvasPattern;
	}

	station() {
		const ctx = this._ctx;
		let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / DPR);
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

	_shorePaths(points: Point[]) {
		const closed = [...points, points[0]]; // implicitly closed
		const fillPath = new Path2D();
		const strokePath = new Path2D();
		fillPath.moveTo(...toAbs(closed[0]));

		let shore: Point[] = [];
		const drawShore = () => {
			if (!shore.length) { return; }
			wavyShore(shore.map(toAbs)).forEach((p, i) => {
				fillPath.lineTo(...p);
				i ? strokePath.lineTo(...p) : strokePath.moveTo(...p);
			});
			shore = [];
		};

		for (let i=1; i<closed.length; i++) {
			if (isBorder(closed[i-1], closed[i])) { // tile edge: straight, not outlined
				drawShore();
				fillPath.lineTo(...toAbs(closed[i]));
			} else { // shore: collect, consecutive segments form one curve
				shore.length || shore.push(closed[i-1]);
				shore.push(closed[i]);
			}
		}
		drawShore();

		return {fillPath, strokePath};
	}

	lake(points: Point[]) {
		const ctx = this._ctx;
		const {fillPath, strokePath} = this._shorePaths(points);

		this.styleLake();
		ctx.fill(fillPath);

		this.styleLine();
		ctx.stroke(strokePath);
	}

	lava(points: Point[]) {
		const ctx = this._ctx;
		const {fillPath, strokePath} = this._shorePaths(points);

		this.styleLava();
		ctx.fill(fillPath);

		ctx.save();
		ctx.clip(fillPath);
		ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
		BUBBLES.forEach(bubble => {
			ctx.beginPath();
			ctx.arc(bubble[0]*TILE, bubble[1]*TILE, bubble[2], 0, Math.PI*2);
			ctx.fill();
		});
		ctx.restore();

		this.styleLine();
		ctx.stroke(strokePath);
	}

	volcano() {
		const ctx = this._ctx;
		const u = (f: number) => f*TILE;

		this.styleLine();
		ctx.lineWidth = LINE_WIDTH * 1.25;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "#000";

		// cone: steep concave flanks, notched crater rim, sagging base
		ctx.beginPath();
		ctx.moveTo(u(0.17), u(0.80));
		ctx.quadraticCurveTo(u(0.40), u(0.61), u(0.41), u(0.42));
		ctx.quadraticCurveTo(u(0.50), u(0.50), u(0.59), u(0.42));
		ctx.quadraticCurveTo(u(0.60), u(0.61), u(0.83), u(0.80));
		ctx.quadraticCurveTo(u(0.50), u(0.91), u(0.17), u(0.80));
		ctx.stroke();

		// eruption, springing from the crater notch
		ERUPTION.forEach(arc => {
			ctx.beginPath();
			ctx.moveTo(u(arc[0]), u(arc[1]));
			ctx.quadraticCurveTo(u(arc[2]), u(arc[3]), u(arc[4]), u(arc[5]));
			ctx.stroke();
		});

		ctx.lineCap = "butt";
		ctx.lineJoin = "miter";
	}
	
	river(edge: Direction, length: number) {
	const ctx = this._ctx;
	let banks = this.getRiverBanks(edge, length);

	this.styleLake();

	ctx.beginPath();
	banks[0].forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
	banks[1].reverse().forEach(p => ctx.lineTo(...p));
	ctx.closePath();
	ctx.fill();

	this.styleLine();

	banks.forEach(bank => {
		ctx.beginPath();
		bank.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
		ctx.stroke();
	});
}

getRiverBanks(edge: Direction, length: number): Point[][] {
	let pxLength = length * TILE;
	let start = toAbs(STARTS[edge]);
	let vec = TO_CENTER[edge];

	let steps = 60;
	let wave = 1;
	let waves = 2.0;
	let half = ROAD_WIDTH / 2;

	let banks: Point[][] = [[], []];

	for (let i=0; i<=steps; i++) {
		let d = pxLength * i / steps;
		let x = start[0] + vec[0] * d;
		let y = start[1] + vec[1] * d;

		let wobble = 0;

		if (edge == N || edge == S) {
			wobble = Math.sin(y / TILE * Math.PI * 2 * waves) * wave;
			banks[0].push([x - half + wobble, y]);
			banks[1].push([x + half + wobble, y]);
		} else {
			wobble = Math.sin(x / TILE * Math.PI * 2 * waves) * wave;
			banks[0].push([x, y - half + wobble]);
			banks[1].push([x, y + half + wobble]);
		}
	}

	return banks;
}

riverArc(quadrant: Direction) {
	const ctx = this._ctx;
	let banks = this.getRiverArcBanks(quadrant);

	this.styleLake();

	ctx.beginPath();
	banks[0].forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
	[...banks[1]].reverse().forEach(p => ctx.lineTo(...p));
	ctx.closePath();
	ctx.fill();

	this.styleLine();

	banks.forEach(bank => {
		ctx.beginPath();
		bank.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
		ctx.stroke();
	});
}

getRiverArcBanks(quadrant: Direction): Point[][] {
	let stepsLine = 24;
	let stepsArc = 60;

	let waveLine = 1;
	let lineWaves = 1;

	function getSide(diff: number): Point[] {
		diff *= ROAD_WIDTH / 2;

		let start: Point = [0, 0];
		let end: Point = [0, 0];

		switch (quadrant) {
			case N:
				start[0] = end[1] = TILE / 2 + diff;
				break;

			case E:
				start[0] = TILE / 2 - diff;
				end[0] = TILE;
				end[1] = TILE / 2 + diff;
				break;

			case S:
				start[0] = TILE / 2 - diff;
				start[1] = TILE;
				end[0] = TILE;
				end[1] = TILE / 2 - diff;
				break;

			case W:
				end[1] = TILE / 2 - diff;
				start[0] = TILE / 2 + diff;
				start[1] = TILE;
				break;
		}

		let corner: Point = [start[0], end[1]];
		let radius = RADIUS + diff;

		let inVec: Point = [
			start[0] - corner[0],
			start[1] - corner[1]
		];

		let outVec: Point = [
			end[0] - corner[0],
			end[1] - corner[1]
		];

		let inLen = Math.sqrt(inVec[0]*inVec[0] + inVec[1]*inVec[1]) || 1;
		let outLen = Math.sqrt(outVec[0]*outVec[0] + outVec[1]*outVec[1]) || 1;

		inVec = [inVec[0] / inLen, inVec[1] / inLen];
		outVec = [outVec[0] / outLen, outVec[1] / outLen];

		let t1: Point = [
			corner[0] + inVec[0] * radius,
			corner[1] + inVec[1] * radius
		];

		let t2: Point = [
			corner[0] + outVec[0] * radius,
			corner[1] + outVec[1] * radius
		];

		let center: Point = [
			corner[0] + inVec[0] * radius + outVec[0] * radius,
			corner[1] + inVec[1] * radius + outVec[1] * radius
		];

		let points: Point[] = [];

		addWavyLine(points, start, t1, stepsLine, waveLine, lineWaves);
		addArc(points, center, t1, t2, stepsArc);
		addWavyLine(points, t2, end, stepsLine, waveLine, lineWaves);

		return points;
	}

	function addWavyLine(points: Point[], a: Point, b: Point, steps: number, wave: number, waves: number) {
		let dx = b[0] - a[0];
		let dy = b[1] - a[1];
		let len = Math.sqrt(dx*dx + dy*dy) || 1;

		let nx = -dy / len;
		let ny = dx / len;

		for (let i=0; i<=steps; i++) {
			if (points.length && !i) { continue; }

			let t = i / steps;
			let x = a[0] + dx * t;
			let y = a[1] + dy * t;
			let wobble = -Math.sin(t * Math.PI * waves) * wave;

			points.push([
				x + nx * wobble,
				y + ny * wobble
			]);
		}
	}

	function addArc(points: Point[], center: Point, start: Point, end: Point, steps: number) {
		let a0 = Math.atan2(start[1] - center[1], start[0] - center[0]);
		let a1 = Math.atan2(end[1] - center[1], end[0] - center[0]);
		let radius = Math.sqrt(
			(start[0] - center[0]) * (start[0] - center[0]) +
			(start[1] - center[1]) * (start[1] - center[1])
		);

		let delta = a1 - a0;

		if (delta > Math.PI) {
			delta -= Math.PI * 2;
		}

		if (delta < -Math.PI) {
			delta += Math.PI * 2;
		}

		for (let i=0; i<=steps; i++) {
			if (points.length && !i) { continue; }

			let t = i / steps;
			let a = a0 + delta * t;

			points.push([
				center[0] + Math.cos(a) * radius,
				center[1] + Math.sin(a) * radius
			]);
		}
	}

	return [getSide(-1), getSide(+1)];
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
