import Tile from "./tile.js";
import { clamp, all as allDirections } from "./direction.js";
import { NONE } from "./edge.js";
import { get as getScore } from "./score.js";
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
export class Board {
    constructor() {
        this._cells = new CellRepo();
        this.node = this._build();
        this._placeInitialTiles();
    }
    onClick(cell) { console.log(cell); }
    onHold(cell) { console.log(cell); }
    commit() { }
    getScore() { return getScore(this._cells); }
    cycleTransform(x, y) {
        let tile = this._cells.at(x, y).tile;
        if (!tile) {
            return;
        }
        let avail = this._getTransforms(tile, x, y);
        let index = avail.indexOf(tile.transform);
        if (index == -1 || avail.length <= 1) {
            return;
        }
        index = (index + 1) % avail.length;
        tile.transform = avail[index];
    }
    placeBest(tile, x, y, round) {
        let avail = this._getTransforms(tile, x, y);
        if (!avail.length) {
            return false;
        }
        tile.transform = avail[0];
        this.place(tile, x, y, round);
        return true;
    }
    place(tile, x, y, round = 0) {
        let cell = this._cells.at(x, y);
        cell.tile = tile;
        cell.round = round;
    }
    signal(cells) {
        this._cells.forEach(cell => cell.signal = cells.includes(cell));
    }
    getAvailableCells(tile) {
        return this._cells.filter(cell => {
            if (cell.border || cell.tile) {
                return false;
            }
            let transforms = this._getTransforms(tile, cell.x, cell.y);
            return (transforms.length > 0);
        });
    }
    _getTransforms(tile, x, y) {
        let neighborEdges = allDirections.map(dir => {
            let diff = DIFFS[dir];
            let neighbor = this._cells.at(x + diff[0], y + diff[1]).tile;
            if (!neighbor) {
                return NONE;
            }
            return neighbor.getEdge(clamp(dir + 2)).type;
        });
        let clone = tile.clone();
        return tile.getTransforms().filter(t => {
            clone.transform = t;
            return clone.fitsNeighbors(neighborEdges);
        });
    }
    _placeInitialTiles() {
        this._cells.forEach(cell => {
            const x = cell.x;
            const y = cell.y;
            let tile = null;
            switch (true) {
                case (x == 2 && y == 0):
                case (x == 6 && y == 0):
                    tile = new Tile("road-half", "2");
                    break;
                case (x == 2 && y == 8):
                case (x == 6 && y == 8):
                    tile = new Tile("road-half", "0");
                    break;
                case (x == 0 && y == 2):
                case (x == 0 && y == 6):
                    tile = new Tile("rail-half", "1");
                    break;
                case (x == 8 && y == 2):
                case (x == 8 && y == 6):
                    tile = new Tile("rail-half", "-1");
                    break;
                case (x == 4 && y == 0):
                    tile = new Tile("rail-half", "2");
                    break;
                case (x == 4 && y == 8):
                    tile = new Tile("rail-half", "0");
                    break;
                case (x == 0 && y == 4):
                    tile = new Tile("road-half", "1");
                    break;
                case (x == 8 && y == 4):
                    tile = new Tile("road-half", "-1");
                    break;
            }
            this.place(tile, x, y);
        });
        this.commit();
    }
}
export class BoardTable extends Board {
    constructor() {
        super();
        this.node.addEventListener(DOWN, this);
        this.node.addEventListener("contextmenu", this);
    }
    handleEvent(e) {
        switch (e.type) {
            case "contextmenu":
                e.preventDefault();
                break;
            case DOWN:
                let td = e.target.closest("td");
                if (!td) {
                    return;
                }
                let cell = this._cellByNode(td);
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
    place(tile, x, y, round = 0) {
        super.place(tile, x, y, round);
        let td = this._tableCellAt(x, y);
        td.innerHTML = "";
        if (tile) {
            td.appendChild(tile.node);
            round && td.appendChild(html.node("div", { className: "round" }, round.toString()));
        }
        else {
            td.appendChild(html.node("div", { className: "dummy" }));
        }
    }
    signal(cells) {
        super.signal(cells);
        this._cells.forEach(cell => {
            let td = this._tableCellAt(cell.x, cell.y);
            td.classList.toggle("signal", cell.signal);
        });
    }
    _build() {
        let table = html.node("table", { className: "board" });
        this._cells.forEach(cell => {
            while (table.rows.length <= cell.y) {
                table.insertRow();
            }
            let row = table.rows[cell.y];
            while (row.cells.length <= cell.x) {
                row.insertCell();
            }
            let td = row.cells[cell.x];
            if (cell.center) {
                td.classList.add("center");
                td.classList.toggle("left", cell.x == 3);
                td.classList.toggle("right", cell.x == 5);
                td.classList.toggle("top", cell.y == 3);
                td.classList.toggle("bottom", cell.y == 5);
            }
        });
        return table;
    }
    _tableCellAt(x, y) {
        return this.node.rows[y].cells[x];
    }
    _cellByNode(node) {
        return this._cells.filter(cell => {
            let td = this._tableCellAt(cell.x, cell.y);
            return (td == node);
        })[0];
    }
}
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
function cellToPx(cell) {
    if (cell == 0) {
        return 0;
    }
    let offset = BCELL + BB;
    if (cell <= BOARD) {
        return offset + (cell - 1) * (TILE + BC);
    }
    return offset + BOARD * TILE + (BOARD - 1) * BC + BB;
}
export class BoardCanvas extends Board {
    handleEvent(e) {
        switch (e.type) {
            case "contextmenu":
                e.preventDefault();
                break;
            case DOWN: break;
        }
    }
    _build() {
        let node = html.node("div", { className: "board" });
        let canvas = html.node("canvas");
        canvas.addEventListener(DOWN, this);
        canvas.addEventListener("contextmenu", this);
        const SIZE = 2 * (BCELL + BB) + BOARD * TILE + (BOARD - 1) * BC;
        canvas.width = canvas.height = SIZE * DPR;
        canvas.style.width = canvas.style.height = `${SIZE}px`;
        const ctx = canvas.getContext("2d");
        ctx.scale(DPR, DPR);
        ctx.beginPath();
        let start = BCELL + BB;
        let length = BOARD * TILE + (BOARD - 1) * BC;
        for (let i = 0; i < BOARD - 1; i++) {
            let x = start + TILE + i * (TILE + BC);
            let y = start + TILE + i * (TILE + BC);
            x += (x % 2 ? .667 : .333);
            y += (y % 2 ? .667 : .333);
            ctx.moveTo(start, y);
            ctx.lineTo(start + length, y);
            ctx.moveTo(x, start);
            ctx.lineTo(x, start + length);
        }
        ctx.lineWidth = BC / 1.5;
        ctx.stroke();
        ctx.lineWidth = BB;
        ctx.strokeRect(TILE + BB / 2, TILE + BB / 2, length + BB, length + BB);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(cellToPx(3) - BC / 2, cellToPx(3) - BC / 2, 3 * (TILE + BC), 3 * (TILE + BC));
        ctx.fillStyle = "lime";
        ctx.fillRect(cellToPx(1), cellToPx(1), TILE, TILE);
        ctx.fillRect(cellToPx(1), cellToPx(2), TILE, TILE);
        ctx.fillRect(cellToPx(2), cellToPx(1), TILE, TILE);
        ctx.fillRect(cellToPx(1), cellToPx(3), TILE, TILE);
        ctx.fillRect(cellToPx(1), cellToPx(4), TILE, TILE);
        node.appendChild(canvas);
        return node;
    }
}
