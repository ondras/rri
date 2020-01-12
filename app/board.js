import Tile from "./tile.js";
import { clamp, all as allDirections } from "./direction.js";
import { NONE } from "./edge.js";
import { get as getScore } from "./score.js";
import CellRepo from "./cell-repo.js";
import * as html from "./html.js";
import { DOWN, UP } from "./event.js";
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
        // FIXME this.commit();
    }
    onClick(cell) { console.log(cell); }
    onHold(cell) { console.log(cell); }
    signalAvailable(tile) {
        this._cells.forEach(cell => {
            cell.signal = (tile ? this.wouldFit(tile, cell.x, cell.y) : false);
        });
    }
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
    wouldFit(tile, x, y) {
        let cell = this._cells.at(x, y);
        if (cell.border || cell.tile) {
            return false;
        }
        let transforms = this._getTransforms(tile, x, y);
        return (transforms.length > 0);
    }
    getScore() { return getScore(this._cells); }
    commit() { }
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
    signalAvailable(tile) {
        super.signalAvailable(tile);
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
