import { Direction, N, E, S, W } from "./direction.js";
import { TILE } from "./conf.js";

const LINE_WIDTH = 2;

const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;

const RAIL_TICK_SMALL = 6;
const RAIL_TICK_LARGE = 8;
const ROAD_TICK = 6;

const STATION = 18;
const RADIUS = 16;

type Point = [number, number];

export function station(ctx: CanvasRenderingContext2D) {
	let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
	ctx.fillRect(size[0]/2 - STATION/2, size[1]/2 - STATION/2, STATION, STATION);
}

const STARTS = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const VECTORS = [[0, 1], [-1, 0], [0, -1], [1, 0]];

export function railCross(ctx: CanvasRenderingContext2D) {
	ctx.lineWidth = LINE_WIDTH;
	ctx.beginPath();

	let c = [TILE/2, TILE/2];
	let d = RAIL_WIDTH/2;

	ctx.moveTo(c[0]-d, c[1]-d);
	ctx.lineTo(c[0]+d, c[1]+d);

	ctx.moveTo(c[0]-d, c[1]+d);
	ctx.lineTo(c[0]+d, c[1]-d);

	ctx.stroke();
}

export function railTicks(ctx: CanvasRenderingContext2D, edge: Direction, length: number) {
	let start = STARTS[edge].map($ => $*TILE);

	ctx.lineWidth = LINE_WIDTH;
	ctx.beginPath();

	let max = 3;
	let baseStep = RAIL_TICK_SMALL;
	if (length < 0.5) { max = 2; }
	if (length > 0.5) {
		max = 7;
		baseStep = RAIL_TICK_LARGE;
	}

	for (let i=0;i<max;i++) {
		let step = baseStep;
		switch (edge) {
			case S: step *= -1;
			case N:
				let y = start[1] + (i+1)*step;
				ctx.moveTo(start[0] - RAIL_WIDTH/2, y);
				ctx.lineTo(start[0] + RAIL_WIDTH/2, y);
			break;

			case E: step *= -1;
			case W:
				let x = start[0] + (i+1)*step;
				ctx.moveTo(x, start[1] - RAIL_WIDTH/2);
				ctx.lineTo(x, start[1] + RAIL_WIDTH/2);
			break;
		}
	}

	ctx.stroke();
}

export function rail(ctx: CanvasRenderingContext2D, edge: Direction, length: number) {
	let pxLength = length * TILE;

	let vec = VECTORS[edge];
	let start = STARTS[edge].map($ => $*TILE) as Point;
	let end = [start[0] + vec[0]*pxLength, start[1] + vec[1]*pxLength] as Point;

	ctx.lineWidth = LINE_WIDTH;
	ctx.beginPath();

	ctx.moveTo(...start);
	ctx.lineTo(...end);

	ctx.stroke();

	railTicks(ctx, edge, length);
}

export function roadTicks(ctx: CanvasRenderingContext2D, edge: Direction, length: number) {
	let start = STARTS[edge].map($ => $*TILE);

	ctx.lineWidth = LINE_WIDTH;
	ctx.beginPath();

	let max = 3;
	if (length < 0.5) { max = 2; }

	for (let i=0;i<max;i++) {
		let step = ROAD_TICK;
		switch (edge) {
			case S: step *= -1;
			case N:
				ctx.moveTo(start[0], start[1] + step*(1/2 + i*5/3));
				ctx.lineTo(start[0], start[1] + step*(3/2 + i*5/3));
			break;

			case E: step *= -1;
			case W:
				ctx.moveTo(start[0] + step*(1/2 + i*5/3), start[1]);
				ctx.lineTo(start[0] + step*(3/2 + i*5/3), start[1]);
			break;
		}
	}

	ctx.stroke();
}

export function road(ctx: CanvasRenderingContext2D, edge: Direction, length: number) {
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

	ctx.lineWidth = LINE_WIDTH;
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

	roadTicks(ctx, edge, length);
}

export function arc(ctx: CanvasRenderingContext2D, edge1: Direction, edge2: Direction, diff: number) {
	diff *= ROAD_WIDTH/2;
	let R = RADIUS + diff;
	ctx.lineWidth = LINE_WIDTH;
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
