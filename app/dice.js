import Tile from "./tile.js";
import * as html from "./html.js";
export default class Dice {
    constructor(tile, type) {
        this.node = html.node("div", { className: "dice" });
        this.tile = tile;
        this.type = type;
        if (type == "lake") {
            this.node.classList.add("lake");
        }
    }
    static fromDescriptor(descriptor) {
        let tile = new Tile(descriptor.sid, descriptor.transform);
        return new this(tile, descriptor.type);
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
