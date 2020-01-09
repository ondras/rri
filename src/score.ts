import CellRepo from "./cell-repo.js";
import { Cell, BorderCell } from "./cell.js";
import { Direction, clamp, all as allDirections } from "./direction.js";
import { NONE, ROAD, RAIL, EdgeType } from "./edge.js";
import * as html from "./html.js";

const DIFFS = [ // FIXME dupe s board.js
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];

export interface Score {
	exits: number[];
	center: number;
	deadends: number;
	road: number;
	rail: number;
}

interface LongestPathContext {
	cells: CellRepo;
	edgeType: EdgeType;
	lockedCells: Set<Cell>;
}

function getCenterCount(cells: CellRepo) {
	return cells.filter(cell => cell.isCenter && cell.tile).length;
}

function getEdgeKey(a: Cell, b: Cell) {
	if (a.x > b.x || a.y > b.y) { [a, b] = [b, a]; }
	return [a.x, a.y, b.x, b.y].join("/");
}

function getSubgraph(start: Cell, cells: CellRepo) {
	interface QueueItem {
		cell: Cell;
		from: Direction | null;
	}

	let subgraph: Cell[] = [];
	let queue: QueueItem[] = [{cell:start, from: null}];
	let lockedEdges = new Set<string>();

	while (queue.length) {
		let current = queue.shift() as QueueItem;
		let cell = current.cell;
		if (!cell.tile) { continue; }

		subgraph.push(cell);
		let tile = cell.tile;

		let outDirections = (current.from === null ? allDirections : tile.getEdge(current.from).connects);
		outDirections.forEach(d => {
			let edgeType = tile.getEdge(d).type;
			if (edgeType == NONE) { return; }

			let x = cell.x + DIFFS[d][0];
			let y = cell.y + DIFFS[d][1];
			let neighbor = cells.at(x, y);
			if (!neighbor.tile) { return; }

			let neighborEdge = clamp(d+2);
			let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
			if (neighborEdgeType != edgeType) { return; }

			let edgeKey = getEdgeKey(cell, neighbor);
			if (lockedEdges.has(edgeKey)) { return; }

			lockedEdges.add(edgeKey);
			queue.push({cell: neighbor, from: neighborEdge});
		});
	}

	return subgraph;
}

function getConnectedExits(start: Cell, cells: CellRepo) {
	return getSubgraph(start, cells).filter(cell => cell instanceof BorderCell);
}

function getExits(cells: CellRepo) {
	let results: number[] = [];
	let exitsArr = cells.filter(cell => cell instanceof BorderCell && cell.tile);
	let exits = new Set(exitsArr);

	while (exits.size > 0) {
		let cell = exits.values().next().value;
		let connected = getConnectedExits(cell, cells);
		if (connected.length > 1) { results.push(connected.length); }
		connected.forEach(cell => exits.delete(cell));
	} 

	return results;
}

function getLongestFrom(cell: Cell, from: Direction | null, ctx: LongestPathContext) {
	let length = 0;
	if (!cell.tile) { return length; }

	let tile = cell.tile;
	let outDirections = (from === null ? allDirections : tile.getEdge(from).connects);

	ctx.lockedCells.add(cell);

	outDirections
		.filter(d => tile.getEdge(d).type == ctx.edgeType)
		.forEach(d => {
			let x = cell.x + DIFFS[d][0];
			let y = cell.y + DIFFS[d][1];
			let neighbor = ctx.cells.at(x, y);
			if (neighbor instanceof BorderCell || !neighbor.tile) { return; }
			if (ctx.lockedCells.has(neighbor)) { return; }

			let neighborEdge = clamp(d+2);
			let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
			if (neighborEdgeType != ctx.edgeType) { return; }

			let subpath = getLongestFrom(neighbor, neighborEdge, ctx);
			length = Math.max(length, subpath);
	});

	ctx.lockedCells.delete(cell);

	return length+1;
}

function getLongest(edgeType: EdgeType, cells: CellRepo) {
	function contains(cell: Cell) {
		if (cell instanceof BorderCell || !cell.tile) { return; }
		let tile = cell.tile;
		return allDirections.some(d => tile.getEdge(d).type == edgeType);
	}
	let starts = cells.filter(contains);

	let length = 0;
	starts.forEach(cell => {
		let lockedCells = new Set<Cell>();
		let ctx: LongestPathContext = { cells, edgeType, lockedCells };
		let l = getLongestFrom(cell, null, ctx);
		length = Math.max(length, l);
	});

	return length;
}

function isDeadend(cell: Cell, direction: Direction, cells: CellRepo) {
	let x = cell.x + DIFFS[direction][0];
	let y = cell.y + DIFFS[direction][1];
	let neighbor = cells.at(x, y);
	if (neighbor instanceof BorderCell) { return false; }

	if (!neighbor.tile) { return true; }
	let neighborEdge = clamp(direction+2);
	return (neighbor.tile.getEdge(neighborEdge).type == NONE);
}

function getDeadends(cells: CellRepo) {
	let deadends = 0;

	cells.forEach(cell => {
		if (cell instanceof BorderCell || !cell.tile) { return; }
		let tile = cell.tile;
		allDirections.forEach(d => {
			let edge = tile.getEdge(d).type;
			if (edge == RAIL || edge == ROAD) {
				if (isDeadend(cell, d, cells)) { deadends++; }
			}
		});
	});

	return deadends;
}

export function get(cells: CellRepo): Score {
	return {
		exits: getExits(cells),
		center: getCenterCount(cells),
		rail: getLongest(RAIL, cells),
		road: getLongest(ROAD, cells),
		deadends: getDeadends(cells)
	}
}

export function render(score: Score) {
	let table = html.node("table", {className:"score"});
	
	let row: HTMLTableRowElement;

	let exits = score.exits.map(count => count == 12 ? 45 : (count-1)*4);
	let exitScore = exits.reduce((a, b) => a+b, 0);
	row = table.insertRow();
	row.insertCell().textContent = "Connected exits";
	row.insertCell().textContent = (exitScore ? `${exits.join("+")}=${exitScore}` : "0");

	row = table.insertRow();
	row.insertCell().textContent = "Longest road";

	row.insertCell().textContent = score.road.toString();
	row = table.insertRow();
	row.insertCell().textContent = "Longest rail";
	row.insertCell().textContent = score.rail.toString();

	row = table.insertRow();
	row.insertCell().textContent = "Center tiles";
	row.insertCell().textContent = score.center.toString();

	row = table.insertRow();
	row.insertCell().textContent = "Dead ends";
	row.insertCell().textContent = (-score.deadends).toString();

	let total = exitScore
					+ score.road
					+ score.rail
					+ score.center
					- score.deadends;
	
	let tfoot = html.node("tfoot");
	table.appendChild(tfoot);
	row = tfoot.insertRow();
	row.insertCell().textContent = "Score";
	row.insertCell().textContent = total.toString();

	return table;
}
