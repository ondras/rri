import Board from "./board.js";
import * as html from "./html.js";
import { DOWN, UP } from "./event.js";
import Tile from "./tile.js";
import { BOARD, TILE, HOLD } from "./conf.js";
import { Cell } from "./cell-repo.js";

const DPR = devicePixelRatio;
const BCELL = TILE;
const BORDER = 3;
const THIN = 1;


function pxToCell(px: number) {
	for (let i=0;i<BOARD+2;i++) {
		let cellPx = cellToPx(i);
		if (px >= cellPx && px < cellPx+TILE) { return i; }
	}
	return null;
}

function cellToPx(cell: number) {
	if (cell == 0) { return 0; }
	let offset = BCELL+BORDER;
	if (cell <= BOARD) { return offset + (cell-1) * (TILE+THIN); }

	return offset + BOARD*TILE + (BOARD-1)*THIN + BORDER;
}


export default class BoardCanvas extends Board {
	_ctx!: CanvasRenderingContext2D;
	_pendingTiles!: Map<string, Tile>; // FIXME fakt klicovat stringem?
	_signals = [] as HTMLElement[];

	constructor() {
		super();

		this.node.addEventListener(DOWN, this);
		this.node.addEventListener("contextmenu", this);
	}

	handleEvent(e: PointerEvent | TouchEvent) {
		switch (e.type) {
			case "contextmenu": e.preventDefault(); break;

			case DOWN:
				let pxx: number | null = null;
				let pxy: number | null = null;

				if ("touches" in e) {
					pxx = e.touches[0].clientX;
					pxy = e.touches[0].clientY;
				} else {
					pxx = e.clientX;
					pxy = e.clientY;
				}

				const rect = this.node.getBoundingClientRect();
				pxx -= rect.left;
				pxy -= rect.top;

				let x = pxToCell(pxx);
				let y = pxToCell(pxy);

				if (x === null || y === null) { return; }

				let cell = this._cells.at(x, y);
				this.onClick(cell);

				function removeEvent() { window.removeEventListener(UP, cancelHold); }

				function cancelHold() {
					clearTimeout(timeout);
					removeEvent();
				}

				let timeout = setTimeout(() => {
					this.onHold(cell);
					removeEvent();
				}, HOLD);

				window.addEventListener(UP, cancelHold);
			break;
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

		this._pendingTiles.forEach((tile, key) => {
			let [x, y] = key.split("/").map(Number);
			let pxx = cellToPx(x) * DPR;
			let pxy = cellToPx(y) * DPR;
			ctx.drawImage(tile.createCanvas(), pxx, pxy);
			tile.node.remove();
		});

		ctx.restore();

		this._pendingTiles.clear();
	}

	signal(cells: Cell[]) {
		this._signals.forEach(signal => signal.remove());

		this._signals = cells.map(cell => {
			let signal = html.node("div", {className:"signal"});
			let pxx = cellToPx(cell.x);
			let pxy = cellToPx(cell.y);
			signal.style.left = `${pxx}px`;
			signal.style.top = `${pxy}px`;
			this.node.appendChild(signal);
			return signal;
		});
	}

	_build() {
		this._pendingTiles = new Map();

		let node = html.node("div", {className:"board"});

		let canvas = html.node("canvas");
		node.appendChild(canvas);

		const SIZE = 2*(BCELL + BORDER) + BOARD*TILE + (BOARD-1)*THIN;
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

		let offsetOdd = 0, offsetEven = 0, lineWidth = THIN;
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

		let start = BCELL + BORDER;
		let length = BOARD*TILE + (BOARD-1)*THIN;
		for (let i=0;i<BOARD-1;i++) {
			let x = start + TILE + i*(TILE+THIN);
			let y = start + TILE + i*(TILE+THIN);

			x += (x%2 ? offsetOdd : offsetEven);
			y += (y%2 ? offsetOdd : offsetEven);

			ctx.moveTo(start, y);
			ctx.lineTo(start+length, y);

			ctx.moveTo(x, start);
			ctx.lineTo(x, start+length);
		}
		ctx.stroke();

		start = TILE + BORDER/2;
		length = length + BORDER;
		ctx.lineWidth = BORDER;
		ctx.strokeRect(start, start, length, length);

		ctx.strokeStyle = "red";
		ctx.lineWidth = BORDER;
		start = cellToPx(3) - THIN/2;
		length = 3*(TILE+THIN);
		ctx.strokeRect(start, start, length, length);
	}
}
