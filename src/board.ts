import Tile from "./tile.js";
import { clamp, all as allDirections, Vector } from "./direction.js";
import { NONE } from "./edge.js";
import { Score, get as getScore } from "./score.js";
import CellRepo, { Cell } from "./cell-repo.js";
import { LAKE } from "./edge.js";

export default abstract class Board {
	node: HTMLElement;
	_cells = new CellRepo();

	constructor() {
		this.node = this._build();
		this._placeInitialTiles();
	}

	abstract _build(): HTMLElement;
	abstract signal(cells: Cell[]): void;
	abstract async toBlob(): Promise<Blob | null>;
	showScore(_score: Score) {}
	onClick(_cell: Cell) {}
	getScore() { return getScore(this._cells); }

	commit(round: number) {
		this._surroundLakes(round);
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

	getAvailableCells(tile: Tile) {
		return this._cells.filter(cell => {
			if (cell.border || cell.tile) { return false; }

			let transforms = this._getTransforms(tile, cell.x, cell.y);
			return (transforms.length > 0);
		});
	}

	_getTransforms(tile: Tile, x: number, y: number) {
		let neighborEdges = this._getNeighborEdges(x, y);
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
			return clone.fitsNeighbors(neighborEdges);
		}).sort(compare);
	}

	_getNeighborEdges(x: number, y: number) {
		return allDirections.map(dir => {
			let vector = Vector[dir];
			let neighbor = this._cells.at(x + vector[0], y + vector[1]).tile;
			if (!neighbor) { return NONE; }
			return neighbor.getEdge(clamp(dir + 2)).type;
		});
	}

	_placeInitialTiles() {
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

	_surroundLakes(round: number) {
		const isSurrounded = (cell: Cell) => {
			if (cell.tile || cell.border) { return false; }
			let neighborEdges = this._getNeighborEdges(cell.x, cell.y);
			return neighborEdges.filter(e => e == LAKE).length >= 3;
		}
		let surrounded = this._cells.filter(isSurrounded);

		surrounded.forEach(cell => {
			let tile = new Tile("lake-4", "0");
			this.place(tile, cell.x, cell.y, round);
		});

		surrounded.length && this.commit(round);
	}
}
