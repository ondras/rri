import Board from "../board.ts";
import { Score } from "../score.ts";
import { Cell, BOARD } from "../cell-repo.ts";
import { N, E, S, W, Vector } from "../direction.ts";

import * as html from "./html.ts";
import HTMLTile from "./html-tile.ts";
import { TILE, DOWN_EVENT } from "./conf.ts";


const DPR = devicePixelRatio;
const BTILE = TILE/2;
const bodyStyle = getComputedStyle(document.body);
const BORDER = Number(bodyStyle.getPropertyValue("--border-thick"));
const THIN = Number(bodyStyle.getPropertyValue("--border-thin"));

function pxToCell(px: number) {
	for (let i=0;i<BOARD+2;i++) {
		let cellPx = cellToPx(i);
		if (px >= cellPx && px < cellPx+TILE) { return i; }
	}
	return null;
}

function cellToPx(cell: number) {
	if (cell == 0) { return BTILE-TILE; }
	let offset = BTILE+BORDER;
	if (cell <= BOARD) { return offset + (cell-1) * (TILE+THIN); }

	return offset + BOARD*TILE + (BOARD-1)*THIN + BORDER;
}

interface PendingCell {
	tile: HTMLTile;
	node: HTMLElement;
	round: number;
	x: number;
	y: number;
}

export default class BoardCanvas extends Board {
	_ctx!: CanvasRenderingContext2D;
	_pendingCells: PendingCell[] = [];
	_signals = [] as HTMLElement[];
	node: HTMLElement;

	constructor() {
		super(HTMLTile);

		this.node = this._build();
		this._placeInitialTiles();
		this.node.addEventListener(DOWN_EVENT, this);
	}

	handleEvent(e: PointerEvent | TouchEvent) {
		switch (e.type) {
			case DOWN_EVENT:
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
			break;
		}
	}

	place(tile: HTMLTile, x: number, y: number, round: number) {
		super.place(tile, x, y, round);

		let index = this._pendingCells.findIndex(cell => cell.x == x && cell.y == y);
		if (index > -1) {
			this._pendingCells[index].node.remove();
			this._pendingCells.splice(index, 1);
		}

		if (!tile) { return; }

		let node = html.node("div", {className:"cell"});
		node.style.left = `${cellToPx(x)}px`;
		node.style.top = `${cellToPx(y)}px`;
		node.appendChild(tile.node);

		round && node.appendChild(html.node("div", {className:"round"}, round.toString()));

		this.node.appendChild(node);
		this._pendingCells.push({x, y, node, tile, round});
	}

	commit(round: number) {
		super.commit(round);

		const ctx = this._ctx;

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		this._pendingCells.forEach(cell => {
			let pxx = cellToPx(cell.x) * DPR;
			let pxy = cellToPx(cell.y) * DPR;
			ctx.drawImage(cell.tile.createCanvas(), pxx, pxy);
			cell.node.remove();
		});

		ctx.restore();

		ctx.font = bodyStyle.getPropertyValue("--round-font");
		const size = Number(bodyStyle.getPropertyValue("--round-size"));
		const bg = bodyStyle.getPropertyValue("--round-bg");
		this._pendingCells.forEach(cell => {
			if (!cell.round) { return; }
			const pxx = cellToPx(cell.x) + TILE;
			const pxy = cellToPx(cell.y);

			ctx.fillStyle = bg;
			ctx.fillRect(pxx - size, pxy, size, size);

			ctx.fillStyle = "#000";
			ctx.fillText(cell.round.toString(), pxx - size/2, pxy + size/2);
		});

		this._pendingCells = [];
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

	showScore(score: Score) {
		const ctx = this._ctx;

		ctx.lineWidth = 4;

		ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
		this._drawPolyline(score.rail);

		ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
		this._drawPolyline(score.road);

		ctx.font = "14px sans-serif";
		ctx.fillStyle = "red";

		score.deadends.forEach(deadend => {
			let pxx = cellToPx(deadend.cell.x) + TILE/2;
			let pxy = cellToPx(deadend.cell.y) + TILE/2;
			const offset = TILE/2 + 10;
			let vec = Vector[deadend.direction];
			pxx += vec[0]*offset;
			pxy += vec[1]*offset;
			ctx.fillText("✘", pxx, pxy);
		});

		ctx.globalCompositeOperation = "destination-over";
		ctx.fillStyle = "rgba(200, 255, 100, 0.2)";
		score.forests.forEach(cell => {
			let pxx = cellToPx(cell.x);
			let pxy = cellToPx(cell.y);
			ctx.fillRect(pxx, pxy, TILE, TILE);
		})

		if (ctx.canvas.toBlob) {
			ctx.canvas.toBlob(blob => this.blob = blob);
		} else if ("msToBlob" in ctx.canvas) {
			// @ts-ignore
			this.blob = ctx.canvas.msToBlob();
		}
	}

	_build() {
		let node = html.node("div", {className:"board"});

		let canvas = html.node("canvas");
		node.appendChild(canvas);

		const SIZE = 2*(BTILE + BORDER) + BOARD*TILE + (BOARD-1)*THIN;
		canvas.width = canvas.height = SIZE * DPR;
		const PX = `${SIZE}px`;
		canvas.style.width = canvas.style.height = PX;
		document.body.style.setProperty("--board-width", PX);

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.scale(DPR, DPR);
		this._ctx = ctx;

		this._drawGrid();

		return node;
	}

	_drawGrid() {
		const ctx = this._ctx;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// fill center
		ctx.fillStyle = bodyStyle.getPropertyValue("--center-bg");
		let start = cellToPx(3) - THIN/2;
		let length = 3*(TILE+THIN);
		ctx.fillRect(start, start, length, length);

		// grid
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

		start = BTILE + BORDER;
		length = BOARD*TILE + (BOARD-1)*THIN;
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

		// grid border
		start = BTILE + BORDER/2;
		length = length + BORDER;
		ctx.lineWidth = BORDER;
		ctx.strokeRect(start, start, length, length);

		// center border
		ctx.strokeStyle = "red";
		ctx.lineWidth = BORDER;
		start = cellToPx(3) - THIN/2;
		length = 3*(TILE+THIN);
		ctx.strokeRect(start, start, length, length);
	}

	_drawPolyline(cells: Cell[]) {
		if (cells.length < 2) { return; }

		const ctx = this._ctx;
		ctx.beginPath();

		cells.forEach((cell, i, all) => {
			let cx = cellToPx(cell.x) + TILE/2;
			let cy = cellToPx(cell.y) + TILE/2;

			if (i == 0) { // first
				ctx.moveTo(cx, cy);
			} else if (i == all.length-1) { // last
				ctx.lineTo(cx, cy);
			} else { // midpoint
				let inDir = this._getDirectionBetweenCells(all[i-1], cell);
				let outDir = this._getDirectionBetweenCells(cell, all[i+1]);
				if (inDir == outDir) {
					ctx.lineTo(cx, cy);
				} else if (outDir !== null) {
					let vec = Vector[outDir];
					let endpoint = [cx + TILE/2*vec[0], cy + TILE/2*vec[1]];
					ctx.arcTo(cx, cy, endpoint[0], endpoint[1], 12);
				}
			}
		});

		ctx.stroke();
	}

	_getDirectionBetweenCells(c1: Cell, c2: Cell) {
		if (c1.y > c2.y) { return N; }
		if (c1.x > c2.x) { return W; }
		if (c1.y < c2.y) { return S; }
		if (c1.x < c2.x) { return E; }
		return null;
	}
}
