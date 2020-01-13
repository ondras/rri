import Tile from "./tile.js";
import { BOARD } from "./conf.js";

export interface Cell {
	tile: Tile | null;
	x: number;
	y: number;
	border: boolean;
	center: boolean;
	round: number;
}

function inBoard(x: number, y: number) {
	return (x > 0 && y > 0 && x <= BOARD && y <= BOARD);
}

export default class CellRepo {
	_cells: Cell[][] = [];

	constructor() {
		const tile = null;
		const round = 0;

		for (let y=0; y<BOARD+2; y++) {
			let row = [] as Cell[];
			this._cells.push(row);

			for (let x=0; x<BOARD+2; x++) {
				let border = !inBoard(x, y);
				let center = (x >= 3 && x <= 5 && y >= 3 && y <= 5);
				let cell = { x, y, border, center, tile, round };
				row.push(cell);
			}
		}
	}

	forEach(cb: (cell: Cell) => void) {
		this._cells.forEach(row => {
			row.forEach(cell => cb(cell));
		});
	}

	filter(test: (cell: Cell) => any) {
		let results: Cell[] = [];

		this._cells.forEach(row => {
			row.forEach(cell => {
				test(cell) && results.push(cell);
			});
		});

		return results;
	}

	at(x: number, y: number) {
		return this._cells[y][x];
	}
}
