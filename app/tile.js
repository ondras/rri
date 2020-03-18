import { get as getTransform } from "./transform.js";
import { get as getShape } from "./shapes.js";
import { NONE, LAKE } from "./edge.js";
export default class Tile {
    constructor(sid, transform) {
        this._sid = sid;
        this.transform = transform;
    }
    static fromJSON(data) {
        return new this(data.sid, data.tid);
    }
    toJSON() {
        return {
            sid: this._sid,
            tid: this._tid
        };
    }
    clone() { return new Tile(this._sid, this.transform); }
    get transform() { return this._tid; }
    set transform(transform) {
        this._tid = transform;
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
