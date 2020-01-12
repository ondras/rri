import Tile from "./tile.js";
import * as html from "./html.js";
export const DICE_1 = ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"];
export const DICE_2 = DICE_1;
export const DICE_3 = DICE_1;
export const DICE_4 = ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"];
export default class Dice {
    constructor(tile) {
        this.node = html.node("div", { className: "dice" });
        this.tile = tile;
    }
    static withRandomTile(names) {
        let name = names[Math.floor(Math.random() * names.length)];
        return this.withTile(name, "0");
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
}
["blocked", "pending", "disabled"].forEach(prop => {
    Object.defineProperty(Dice.prototype, prop, {
        get() { return this.node.classList.contains(prop); },
        set(flag) { this.node.classList.toggle(prop, flag); }
    });
});
