import Board from "./board.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import Tile from "./tile.js";
import { BOARD, TILE } from "./conf.js";

const BCELL = TILE;
const BB = 3;
const BC = 1;
const DPR = devicePixelRatio;
/*
function pxToCell(px: number) {
	for (let i=0;i<BOARD+2;i++) {
		let cellPx = cellToPx(i);
		if (px >= cellPx && px < cellPx+TILE) { return i; }
	}
	return null;
}
*/

function cellToPx(cell: number) {
	if (cell == 0) { return 0; }
	let offset = BCELL+BB;
	if (cell <= BOARD) { return offset + (cell-1) * (TILE+BC); }

	return offset + BOARD*TILE + (BOARD-1)*BC + BB;
}


export default class BoardCanvas extends Board {
	_ctx!: CanvasRenderingContext2D;
	_pendingTiles!: Map<string, Tile>;

	constructor() {
		super();

		this.node.addEventListener(DOWN, this);
		this.node.addEventListener("contextmenu", this);
	}

	handleEvent(e: Event) {
		switch (e.type) {
			case "contextmenu": e.preventDefault(); break;

			case DOWN: break;
		}
	}

	place(tile: Tile, x: number, y: number, round: number) {
		super.place(tile, x, y, round);

		let key = [x,y].join("/");
		let oldTile = this._pendingTiles.get(key);
		if (oldTile) {
			oldTile.node.remove();
			this._pendingTiles.delete(key);
		}

		if (!tile) { return; }

		let pxx = cellToPx(x);
		let pxy = cellToPx(y);
		this.node.appendChild(tile.node);
		tile.node.style.left = `${pxx}px`;
		tile.node.style.top = `${pxy}px`;
		this._pendingTiles.set(key, tile);
	}

	commit() {
		const ctx = this._ctx;

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(100, 100);
		ctx.stroke();

		this._pendingTiles.forEach((tile, key) => {
			let [x, y] = key.split("/").map(Number);
			let pxx = cellToPx(x) * DPR;
			let pxy = cellToPx(y) * DPR;
			ctx.drawImage(tile.node, pxx, pxy);
			tile.node.remove();
		});

		ctx.restore();

		this._pendingTiles.clear();
	}

	_build() {
		this._pendingTiles = new Map();

		let node = html.node("div", {className:"board"});

		let canvas = html.node("canvas");
		node.appendChild(canvas);

		const SIZE = 2*(BCELL + BB) + BOARD*TILE + (BOARD-1)*BC;
		canvas.width = canvas.height = SIZE * DPR;
		canvas.style.width = canvas.style.height = `${SIZE}px`;

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.scale(DPR, DPR);
		this._ctx = ctx;

		this._drawGrid();

		return node;
	}

	_drawGrid() {
		const ctx = this._ctx;
		ctx.beginPath();

		let offsetOdd = 0, offsetEven = 0, lineWidth = BC;
		switch (DPR) {
			case 1:
				offsetOdd = offsetEven = 0.5;
			break;

			case 1.5:
				offsetOdd = 2/3;
				offsetEven = 1/3;
				lineWidth /= DPR;
			break;
		}
		ctx.lineWidth = lineWidth;

		let start = BCELL + BB;
		let length = BOARD*TILE + (BOARD-1)*BC;
		for (let i=0;i<BOARD-1;i++) {
			let x = start + TILE + i*(TILE+BC);
			let y = start + TILE + i*(TILE+BC);

			x += (x%2 ? offsetOdd : offsetEven);
			y += (y%2 ? offsetOdd : offsetEven);

			ctx.moveTo(start, y);
			ctx.lineTo(start+length, y);

			ctx.moveTo(x, start);
			ctx.lineTo(x, start+length);
		}
		ctx.stroke();

		ctx.lineWidth = BB;
		ctx.strokeRect(TILE + BB/2, TILE + BB/2, length+BB, length+BB);

		ctx.strokeStyle = "red";
		ctx.lineWidth = 3;
		ctx.strokeRect(cellToPx(3)-BC/2, cellToPx(3)-BC/2, 3*(TILE+BC), 3*(TILE+BC));

		ctx.fillStyle = "lime";
		ctx.fillRect(cellToPx(1), cellToPx(1), TILE, TILE);
		ctx.fillRect(cellToPx(1), cellToPx(2), TILE, TILE);
		ctx.fillRect(cellToPx(2), cellToPx(1), TILE, TILE);
		ctx.fillRect(cellToPx(1), cellToPx(3), TILE, TILE);
		ctx.fillRect(cellToPx(1), cellToPx(4), TILE, TILE);
	}

}
