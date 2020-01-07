import Tile from "./tile.js";
import * as html from "./html.js";
export default class Dice {
    constructor(tile) {
        this.node = html.node("div", { className: "dice" });
        this.tile = tile;
    }
    static withTile(name, transform) {
        return new this(new Tile(name, transform));
    }
    get tile() { return this._tile; }
    set tile(tile) {
        this._tile = tile;
        this.node.innerHTML = "";
        this.node.appendChild(tile.node);
    }
    set signal(signal) { this.node.classList.toggle("signal", signal); }
    get disabled() { return this.node.classList.contains("disabled"); }
    set disabled(disabled) { this.node.classList.toggle("disabled", disabled); }
}
