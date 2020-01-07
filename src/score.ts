import CellRepo from "./cell-repo.js";
import { Cell, BorderCell } from "./cell.js";
import { Direction, clamp, all as allDirections } from "./direction.js";
import { NONE } from "./edge.js";

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

function getCenterCount(cells: CellRepo) {
	return cells.filter(cell => cell.isCenter() && cell.tile).length;
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
		console.log(connected);
		if (connected.length > 1) { results.push(connected.length); }
		connected.forEach(cell => exits.delete(cell));
	} 

	return results;
}

export function get(cells: CellRepo) {
	return {
		exits: getExits(cells),
		center: getCenterCount(cells)
	}
}