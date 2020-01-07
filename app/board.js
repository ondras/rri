import { clamp, all as allDirections } from "./direction.js";
import { NONE } from "./edge.js";
import { get as getScore } from "./score.js";
import { BOARD } from "./conf.js";
import CellRepo from "./cell-repo.js";
const DIFFS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
];
function inBoard(x, y) {
    return (x > 0 && y > 0 && x <= BOARD && y <= BOARD);
}
export default class Board {
    constructor() {
        this.node = document.createElement("table");
        this.node.className = "board";
        this.node.addEventListener("pointerdown", this);
        this._cells = new CellRepo(this.node);
    }
    handleEvent(e) {
        switch (e.type) {
            case "pointerdown":
                let td = e.target.closest("td");
                if (!td) {
                    return;
                }
                let cell = this._cells.byNode(td);
                if (!cell || cell.locked) {
                    return;
                }
                if (!inBoard(cell.x, cell.y)) {
                    return;
                }
                this.onClick(cell.x, cell.y);
                break;
        }
    }
    onClick(x, y) { console.log(x, y); }
    lock() {
        this._cells.forEach(cell => {
            if (cell.tile) {
                cell.locked = true;
            }
        });
    }
    signalAvailable(tile) {
        this._cells.forEach(cell => {
            if (!inBoard(cell.x, cell.y)) {
                return;
            }
            cell.signal = tile ? this.wouldFit(tile, cell.x, cell.y) : false;
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
    place(tile, x, y, round) {
        let cell = this._cells.at(x, y);
        cell.tile = tile;
        cell.round = round.toString();
    }
    wouldFit(tile, x, y) {
        if (!inBoard(x, y)) {
            return false;
        }
        if (this._cells.at(x, y).tile) {
            return false;
        }
        let transforms = this._getTransforms(tile, x, y);
        return (transforms.length > 0);
    }
    getScore() { return getScore(this._cells); }
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
}
