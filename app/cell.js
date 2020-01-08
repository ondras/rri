import Tile from "./tile.js";
import * as html from "./html.js";
export class Cell {
    constructor(node, x, y) {
        this.node = node;
        this.x = x;
        this.y = y;
        this._round = html.node("div", { className: "round" });
        this.tile = null;
        this.isCenter && this._markCenter();
    }
    get tile() { return this._tile; }
    set tile(tile) {
        this._tile = tile;
        this.node.innerHTML = "";
        if (tile) {
            this.node.appendChild(tile.node);
            this.node.appendChild(this._round);
        }
        else {
            this._appendDummy();
        }
    }
    set signal(signal) { this.node.classList.toggle("signal", signal); }
    set round(round) { this._round.textContent = round; }
    get isCenter() {
        if (this.x < 3 || this.x > 5 || this.y < 3 || this.y > 5) {
            return false;
        }
        return true;
    }
    _markCenter() {
        this.node.classList.add("center");
        this.x == 3 && this.node.classList.add("left");
        this.x == 5 && this.node.classList.add("right");
        this.y == 3 && this.node.classList.add("top");
        this.y == 5 && this.node.classList.add("bottom");
    }
    _appendDummy() {
        this.node.appendChild(html.node("div", { className: "dummy" }));
    }
}
export class BorderCell extends Cell {
    constructor(node, x, y) {
        super(node, x, y);
        this._round.hidden = true;
        this._placeTile(x, y);
    }
    _placeTile(x, y) {
        switch (true) {
            case (x == 2 && y == 0):
            case (x == 6 && y == 0):
                this.tile = new Tile("road-half", "2");
                break;
            case (x == 2 && y == 8):
            case (x == 6 && y == 8):
                this.tile = new Tile("road-half", "0");
                break;
            case (x == 0 && y == 2):
            case (x == 0 && y == 6):
                this.tile = new Tile("rail-half", "1");
                break;
            case (x == 8 && y == 2):
            case (x == 8 && y == 6):
                this.tile = new Tile("rail-half", "-1");
                break;
            case (x == 4 && y == 0):
                this.tile = new Tile("rail-half", "2");
                break;
            case (x == 4 && y == 8):
                this.tile = new Tile("rail-half", "0");
                break;
            case (x == 0 && y == 4):
                this.tile = new Tile("road-half", "1");
                break;
            case (x == 8 && y == 4):
                this.tile = new Tile("road-half", "-1");
                break;
        }
    }
    _appendDummy() { }
}
