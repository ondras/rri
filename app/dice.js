import Tile from "./tile.js";
import * as html from "./html.js";
export default class Dice {
    constructor(tile) {
        this.node = html.node("div", { className: "dice" });
        this.tile = tile;
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
export class LakeDice extends Dice {
    constructor(tile) {
        super(tile);
        this.node.classList.add("lake");
    }
}
export const DICE_REGULAR_1 = {
    tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
    ctor: Dice
};
export const DICE_REGULAR_2 = {
    tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
    ctor: Dice
};
export const DICE_LAKE = {
    tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
    ctor: LakeDice
};
export function create(template) {
    let names = template.tiles;
    let name = names[Math.floor(Math.random() * names.length)];
    return new template.ctor(new Tile(name, "0"));
}
