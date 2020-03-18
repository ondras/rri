import Tile from "./tile.js";
import { clamp, all as allDirections, Vector } from "./direction.js";
import { NONE } from "./edge.js";
import { get as getScore } from "./score.js";
import CellRepo from "./cell-repo.js";
import { LAKE } from "./edge.js";
export default class Board {
    constructor(_tileCtor = Tile) {
        this._tileCtor = _tileCtor;
        this.blob = null;
        this._cells = new CellRepo();
        this.node = this._build();
        this._placeInitialTiles();
    }
    _build() { return null; }
    ;
    signal(_cells) { }
    ;
    showScore(_score) { }
    onClick(_cell) { }
    getScore() { return getScore(this._cells); }
    fromJSON(cells) {
        this._cells.forEach(cell => {
            if (!cell.border) {
                cell.tile = null;
            }
        });
        cells.forEach(cell => {
            let tile = Tile.fromJSON(cell.tile);
            this.place(tile, cell.x, cell.y, cell.round);
        });
        this.commit(0);
        return this;
    }
    toJSON() {
        let result = [];
        this._cells.forEach(cell => {
            const tile = cell.tile;
            if (cell.border || !tile) {
                return;
            }
            result.push({
                x: cell.x,
                y: cell.y,
                round: cell.round,
                tile: tile.toJSON()
            });
        });
        return result;
    }
    commit(round) {
        round && this._surroundLakes(round);
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
        cell.round = round;
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
        let neighborEdges = this._getNeighborEdges(x, y);
        let clone = tile.clone();
        function compare(t1, t2) {
            clone.transform = t1;
            let c1 = clone.fitsNeighbors(neighborEdges);
            clone.transform = t2;
            let c2 = clone.fitsNeighbors(neighborEdges);
            return c2 - c1;
        }
        return tile.getTransforms().filter(t => {
            clone.transform = t;
            return clone.fitsNeighbors(neighborEdges);
        }).sort(compare);
    }
    _getNeighborEdges(x, y) {
        return allDirections.map(dir => {
            let vector = Vector[dir];
            let neighbor = this._cells.at(x + vector[0], y + vector[1]).tile;
            if (!neighbor) {
                return NONE;
            }
            return neighbor.getEdge(clamp(dir + 2)).type;
        });
    }
    _placeInitialTiles() {
        const Tile = this._tileCtor;
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
            this.place(tile, x, y, 0);
        });
        this.commit(0);
    }
    _surroundLakes(round) {
        const isSurrounded = (cell) => {
            if (cell.tile || cell.border) {
                return false;
            }
            let neighborEdges = this._getNeighborEdges(cell.x, cell.y);
            return neighborEdges.filter(e => e == LAKE).length >= 3;
        };
        let surrounded = this._cells.filter(isSurrounded);
        surrounded.forEach(cell => {
            let tile = new Tile("lake-4", "0");
            this.place(tile, cell.x, cell.y, round);
        });
        surrounded.length && this.commit(round);
    }
}
