import Tile, { TileData } from "./tile.js";
import { clamp, all as allDirections, Vector } from "./direction.js";
import { Score, get as getScore } from "./score.js";
import CellRepo, { Cell } from "./cell-repo.js";
import { NONE, LAKE, LAVA, ROAD, RAIL, FOREST, RIVER, EdgeType } from "./edge.js";

interface CellData {
	x: number;
	y: number;
	round: number;
	tile: TileData;
}

export type SerializedBoard = CellData[];

function hasEdge(tile: Tile, type: EdgeType) {
	return allDirections.some(dir => tile.getEdge(dir).type == type);
}

function touches(tile: Tile, neighborEdges: EdgeType[], type: EdgeType) {
	return allDirections.some(dir => {
		return tile.getEdge(dir).type == type && neighborEdges[dir] == type;
	});
}

export function isRoute(tile: Tile) {
	let route = hasEdge(tile, ROAD) || hasEdge(tile, RAIL);
	let expansion = hasEdge(tile, LAVA) || hasEdge(tile, LAKE) || hasEdge(tile, FOREST) || hasEdge(tile, RIVER);
	return route && !expansion;
}

export default class Board {
	node: HTMLElement | null;
	blob: Blob | null = null;
	_cells = new CellRepo();

	constructor(readonly _tileCtor = Tile) {
		this.node = this._build();
		this._placeInitialTiles();
	}

		_build(): HTMLElement | null { return null; };
	signal(_cells: Cell[]) {};
	anticipate(_cells: Cell[]) {};
	showScore(_score: Score) {}
	onClick(_cell: Cell) {}

	getScore() {
		let added: Cell[] = [];
		let pending = this._getSurroundedCells();

		while (pending.length) { // anticipate _surroundLakes; no place() => no tiles are drawn
			pending.forEach(cell => {
				cell.tile = new Tile("lake-4", "0");
				added.push(cell);
			});
			pending = this._getSurroundedCells();
		}

		let score = getScore(this._cells);
		added.forEach(cell => cell.tile = null);

		this.anticipate(added);
		return score;
	}

	fits(tile: Tile, x: number, y: number) {
		let neighborEdges = this.getNeighborEdges(x, y);
		return this._fits(tile, neighborEdges);
	}

	_fits(tile: Tile, neighborEdges: EdgeType[]) {
		if (tile._data.sid == "volcano") {
			return this._fitsExpansionRules(tile, neighborEdges);
		}

		return tile.fitsNeighbors(neighborEdges) && this._fitsExpansionRules(tile, neighborEdges);
	}

	_fitsExpansionRules(tile: Tile, neighborEdges: EdgeType[]) {
		if (!hasEdge(tile, LAVA)) { return true; }

		if (tile._data.sid == "volcano") {
			return !neighborEdges.includes(LAVA);
		}

		return touches(tile, neighborEdges, LAVA);
	}

	setup(type: string) {
		switch (type) {
			case "lava": this._setupLava(); break;
		}
	}

	fromJSON(cells: SerializedBoard) {
		const Tile = this._tileCtor;

		this._cells.forEach(cell => {
			if (!cell.border) { cell.tile = null; }
		});

		cells.forEach(cell => {
			let tile = Tile.fromJSON(cell.tile);
			this.place(tile, cell.x, cell.y, cell.round);
		});

		this.commit(0);
		return this;
	}

	toJSON() {
		let result: SerializedBoard = [];
		this._cells.forEach(cell => {
			const tile = cell.tile;
			if (cell.border || !tile) { return; }
			result.push({
				x: cell.x,
				y: cell.y,
				round: cell.round,
				tile: tile.toJSON()
			});
		})
		return result;
	}

	commit(round: number) {
		round && this._surroundLakes(round);
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
		cell.round = round;
	}

	getNeighborEdges(x: number, y: number) {
		return allDirections.map(dir => {
			let vector = Vector[dir];
			let neighbor = this._cells.at(x + vector[0], y + vector[1]).tile;
			if (!neighbor) { return NONE; }
			return neighbor.getEdge(clamp(dir + 2)).type;
		});
	}

	getAvailableCells(tile: Tile) {
		return this._cells.filter(cell => {
			if (cell.border || cell.tile) { return false; }

			let transforms = this._getTransforms(tile, cell.x, cell.y);
			return (transforms.length > 0);
		});
	}

	getOverwritableCells(tile: Tile, round: number) {
		return this._cells.filter(cell => {
			if (cell.border || !cell.tile || cell.round == round) { return false; }
			if (!isRoute(cell.tile)) { return false; }

			let backupTile = cell.tile;
			cell.tile = null; // bypass place(); nothing is rendered
			let fits = this._getTransforms(tile, cell.x, cell.y).length > 0;
			cell.tile = backupTile;

			return fits;
		});
	}

	_getTransforms(tile: Tile, x: number, y: number) {
		let neighborEdges = this.getNeighborEdges(x, y);
		let clone = tile.clone();

		function compare(t1: string, t2: string) {
			clone.transform = t1;
			let c1 = clone.fitsNeighbors(neighborEdges);
			clone.transform = t2;
			let c2 = clone.fitsNeighbors(neighborEdges);
			return c2-c1;
		}

		return tile.getTransforms().filter(t => {
			clone.transform = t;
			return this._fits(clone, neighborEdges);
		}).sort(compare);
	}

	_setupLava() {
		const Tile = this._tileCtor;

		let cell = this._cells.at(4, 4);
		if (cell.tile) { return; }

		this.place(new Tile("volcano", "0"), 4, 4, 0);
		this.commit(0);
	}

	_placeInitialTiles() {
		const Tile = this._tileCtor;

		this._cells.forEach(cell => {
			const x = cell.x;
			const y = cell.y;
			let tile: Tile | null = null;
			switch (true) {
				case (x==2 && y==0):
				case (x==6 && y==0):
					tile = new Tile("road-half", "2");
				break;

				case (x==2 && y==8):
				case (x==6 && y==8):
					tile = new Tile("road-half", "0");
				break;

				case (x==0 && y==2):
				case (x==0 && y==6):
					tile = new Tile("rail-half", "1");
				break;

				case (x==8 && y==2):
				case (x==8 && y==6):
					tile = new Tile("rail-half", "-1");
				break;

				case (x==4 && y==0): tile = new Tile("rail-half", "2"); break;
				case (x==4 && y==8): tile = new Tile("rail-half", "0"); break;
				case (x==0 && y==4): tile = new Tile("road-half", "1"); break;
				case (x==8 && y==4): tile = new Tile("road-half", "-1"); break;
			}
			this.place(tile, x, y, 0);
		});

		this.commit(0);
	}

	_getSurroundedCells() {
		return this._cells.filter(cell => {
			if (cell.tile || cell.border) { return false; }
			let neighborEdges = this.getNeighborEdges(cell.x, cell.y);
			return neighborEdges.filter(e => e == LAKE).length >= 3;
		});
	}

	_surroundLakes(round: number) {
		const Tile = this._tileCtor;

		let surrounded = this._getSurroundedCells();

		surrounded.forEach(cell => {
			let tile = new Tile("lake-4", "0");
			this.place(tile, cell.x, cell.y, round);
		});

		surrounded.length && this.commit(round);
	}
}
