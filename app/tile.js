import { get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { NONE, LAKE } from "./edge.js";
import * as html from "./html.js";
export default class Tile {
    constructor(sid, transform) {
        this._sid = sid;
        this.node = getShape(sid).image.cloneNode(true);
        this.node.classList.add("tile");
        this.transform = transform;
    }
    clone() {
        return new Tile(this._sid, this.transform);
    }
    createCanvas() {
        const shape = getShape(this._sid);
        const source = shape.canvas;
        const canvas = html.node("canvas", { width: source.width, height: source.height });
        const ctx = canvas.getContext("2d");
        getTransform(this._tid).applyToContext(ctx);
        ctx.drawImage(shape.canvas, 0, 0);
        return canvas;
    }
    get transform() { return this._tid; }
    set transform(transform) {
        this._tid = transform;
        this.node.style.transform = getTransform(transform).getCSS();
    }
    getEdge(direction) {
        let transform = getTransform(this.transform);
        direction = transform.invert(direction);
        let edge = getShape(this._sid).edges[direction];
        return {
            type: edge.type,
            connects: edge.connects.map(d => transform.apply(d))
        };
    }
    getTransforms() { return getShape(this._sid).transforms; }
    fitsNeighbors(neighborEdges) {
        let connections = 0;
        let errors = 0;
        neighborEdges.forEach((nEdge, dir) => {
            let ourEdge = this.getEdge(dir).type;
            if (ourEdge == LAKE) {
                connections++;
                return;
            }
            if (nEdge == NONE || ourEdge == NONE) {
                return;
            }
            if (nEdge == ourEdge) {
                connections++;
            }
            else {
                errors++;
            }
        });
        if (errors > 0) {
            return 0;
        }
        return connections;
    }
}
