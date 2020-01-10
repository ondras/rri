import Tile from "./tile.js";
import { clamp, all as allDirections } from "./direction.js";
import { NONE } from "./edge.js";
import { get as getScore } from "./score.js";
import { Cell, BorderCell } from "./cell.js";
import CellRepo from "./cell-repo.js";
import * as html from "./html.js";
import { DOWN, UP } from "./event.js";
import { BOARD, TILE } from "./conf.js";

const HOLD = 400;

const DIFFS = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];

export default class Board {
	_cells: CellRepo;
	node = html.node("table", {className:"board"});

	constructor() {
		this.node.addEventListener(DOWN, this);
		this.node.addEventListener("contextmenu", this);

		this._cells = new CellRepo(this.node);
	}

	handleEvent(e: Event) {
		switch (e.type) {
			case "contextmenu": e.preventDefault(); break; 

			case DOWN:
				let td = (e.target as HTMLElement).closest("td") as HTMLElement;
				if (!td) { return; }

				let cell = this._cells.byNode(td);
				cell && this.onClick(cell);

				function removeEvents() {
					td.removeEventListener(UP, cancelHold);
					td.removeEventListener("pointerleave", cancelHold);
				}

				function cancelHold() {
					clearTimeout(timeout);
					removeEvents();
				}

				let timeout = setTimeout(() => {
					this.onHold(cell);
					removeEvents();
				}, HOLD);

				td.addEventListener(UP, cancelHold);
				td.addEventListener("pointerleave", cancelHold);
			break;
		}
	}

	onClick(cell: Cell) { console.log("click", cell); }
	onHold(cell: Cell) { console.log("hold", cell); }

	signalAvailable(tile: Tile | null) {
		this._cells.forEach(cell => {
			cell.signal = (tile ? this.wouldFit(tile, cell.x, cell.y) : false);
		});
	}

	cycleTransform(x: number, y: number) {
		let tile = this._cells.at(x, y).tile;
		if (!tile) { return; }

		let avail = this._getTransforms(tile, x, y);
		let index = avail.indexOf(tile.transform);
		if (index == -1 || avail.length <= 1) { return; }

		index = (index+1) % avail.length;
		tile.transform = avail[index];
	}

	placeBest(tile: Tile, x: number, y: number, round: number) {
		let avail = this._getTransforms(tile, x, y);
		if (!avail.length) { return false; }
		tile.transform = avail[0];
		this.place(tile, x, y, round);
		return true;
	}

	place(tile: Tile | null, x: number, y: number, round: number) {
		let cell = this._cells.at(x, y);
		cell.tile = tile;
		cell.round = (tile ? round.toString() : "");
	}

	wouldFit(tile: Tile, x: number, y: number) {
		let cell = this._cells.at(x, y);
		if (cell instanceof BorderCell || cell.tile) { return false; }

		let transforms = this._getTransforms(tile, x, y);
		return (transforms.length > 0);
	}

	getScore() { return getScore(this._cells); }

	_getTransforms(tile: Tile, x: number, y: number) {
		let neighborEdges = allDirections.map(dir => {
			let diff = DIFFS[dir];
			let neighbor = this._cells.at(x + diff[0], y + diff[1]).tile;
			if (!neighbor) { return NONE; }
			return neighbor.getEdge(clamp(dir + 2)).type;
		});

		let clone = tile.clone();
		return tile.getTransforms().filter(t => {
			clone.transform = t;
			return clone.fitsNeighbors(neighborEdges);
		});
	}
}

export class CanvasBoard {
	_cells: CellRepo;
	node = html.node("canvas", {className:"board"});

	constructor() {
		let table = html.node("table");
		this.node.addEventListener(DOWN, this);
		this.node.addEventListener("contextmenu", this);

		this._cells = new CellRepo(table);

		const SIZE = (BOARD+2)*TILE + (BOARD+1);
		this.node.width = this.node.height = SIZE * devicePixelRatio;
		this.node.style.width = this.node.style.height = `${SIZE}px`;

		const ctx = this.node.getContext("2d") as CanvasRenderingContext2D;
		ctx.scale(devicePixelRatio, devicePixelRatio);
		ctx.beginPath();

		let offset = [TILE+1, TILE+1];
		let length = BOARD*TILE + (BOARD-1);
		for (let i=0;i<BOARD-1;i++) {
			let x = offset[0] + (i+1)*(TILE+1);
			let y = offset[1] + (i+1)*(TILE+1);

			ctx.moveTo(offset[0], y);
			ctx.lineTo(offset[0]+length, y);

			ctx.moveTo(x, offset[1]);
			ctx.lineTo(x, offset[1]+length);
		}
		ctx.stroke();
	}

	handleEvent(e: Event) {
		switch (e.type) {
			case "contextmenu": e.preventDefault(); break; 

			case DOWN:
				let td = (e.target as HTMLElement).closest("td") as HTMLElement;
				if (!td) { return; }

				let cell = this._cells.byNode(td);
				cell && this.onClick(cell);

				function removeEvents() {
					td.removeEventListener(UP, cancelHold);
				}

				function cancelHold() {
					clearTimeout(timeout);
					removeEvents();
				}

				let timeout = setTimeout(() => {
					this.onHold(cell);
					removeEvents();
				}, HOLD);

				td.addEventListener(UP, cancelHold);
			break;
		}
	}

	onClick(cell: Cell) { console.log("click", cell); }
	onHold(cell: Cell) { console.log("hold", cell); }

	signalAvailable(tile: Tile | null) {
		this._cells.forEach(cell => {
			cell.signal = (tile ? this.wouldFit(tile, cell.x, cell.y) : false);
		});
	}

	cycleTransform(x: number, y: number) {
		let tile = this._cells.at(x, y).tile;
		if (!tile) { return; }

		let avail = this._getTransforms(tile, x, y);
		let index = avail.indexOf(tile.transform);
		if (index == -1 || avail.length <= 1) { return; }

		index = (index+1) % avail.length;
		tile.transform = avail[index];
	}

	placeBest(tile: Tile, x: number, y: number, round: number) {
		let avail = this._getTransforms(tile, x, y);
		if (!avail.length) { return false; }
		tile.transform = avail[0];
		this.place(tile, x, y, round);
		return true;
	}

	place(tile: Tile | null, x: number, y: number, round: number) {
		let cell = this._cells.at(x, y);
		cell.tile = tile;
		cell.round = (tile ? round.toString() : "");
	}

	wouldFit(tile: Tile, x: number, y: number) {
		let cell = this._cells.at(x, y);
		if (cell instanceof BorderCell || cell.tile) { return false; }

		let transforms = this._getTransforms(tile, x, y);
		return (transforms.length > 0);
	}

	getScore() { return getScore(this._cells); }

	_getTransforms(tile: Tile, x: number, y: number) {
		let neighborEdges = allDirections.map(dir => {
			let diff = DIFFS[dir];
			let neighbor = this._cells.at(x + diff[0], y + diff[1]).tile;
			if (!neighbor) { return NONE; }
			return neighbor.getEdge(clamp(dir + 2)).type;
		});

		let clone = tile.clone();
		return tile.getTransforms().filter(t => {
			clone.transform = t;
			return clone.fitsNeighbors(neighborEdges);
		});
	}
}
