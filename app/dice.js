import Tile from "./tile.js";
import * as html from "./html.js";
export default class Dice {
    constructor(tile) {
        this.node = html.node("div", { className: "dice" });
        this.tile = tile;
    }
    static fromTemplate(template) {
        let names = template.tiles;
        let name = names[Math.floor(Math.random() * names.length)];
        let instance = new this(new Tile(name, "0"));
        template.flags.forEach(flag => instance.flag(flag, true));
        return instance;
    }
    get tile() { return this._tile; }
    set tile(tile) {
        this._tile = tile;
        this.node.innerHTML = "";
        this.node.appendChild(tile.node);
    }
    flag(name, value) {
        if (arguments.length > 1) {
            this.node.classList.toggle(name, value);
        }
        return this.node.classList.contains(name);
    }
}
export const DICE_REGULAR_1 = {
    tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
    flags: ["mandatory"]
};
export const DICE_REGULAR_2 = {
    tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
    flags: ["mandatory"]
};
export const DICE_LAKE = {
    tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
    flags: ["lake"]
};
