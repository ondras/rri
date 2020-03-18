import Tile from "./tile.js";
import { get as getShape } from "./shapes.js";
import { get as getTransform } from "./transform.js";
import * as html from "./html.js";
export default class HTMLTile extends Tile {
    set transform(transform) {
        super.transform = transform;
        if (!this.node) {
            this.node = getShape(this._sid).image.cloneNode(true);
            this.node.classList.add("tile");
        }
        this.node.style.transform = getTransform(transform).getCSS();
    }
    get transform() { return super.transform; }
    createCanvas() {
        const shape = getShape(this._sid);
        const source = shape.canvas;
        const canvas = html.node("canvas", { width: source.width, height: source.height });
        const ctx = canvas.getContext("2d");
        getTransform(this._tid).applyToContext(ctx);
        ctx.drawImage(shape.canvas, 0, 0);
        return canvas;
    }
    clone() { return new HTMLTile(this._sid, this.transform); }
}
