import { clamp } from "./direction.js";
const repo = {};
class TransformImpl {
    constructor(direction, offset) {
        this._direction = direction;
        this._offset = offset;
    }
    apply(direction) {
        return clamp(this._direction * (direction + this._offset));
    }
    invert(direction) {
        return clamp(this._direction * direction - this._offset);
    }
    getCSS() {
        let scale = "";
        if (this._direction == -1) {
            scale = "scale(-1, 1) ";
        }
        return `${scale}rotate(${this._offset * 90}deg)`;
    }
}
function create(id) {
    let offset = Math.abs(Number(id));
    let direction = (id.startsWith("-") ? -1 : 1);
    repo[id] = new TransformImpl(direction, offset);
    return get(id);
}
export function get(id) {
    if (!(id in repo)) {
        throw new Error(`Transform ${id} not found`);
    }
    return repo[id];
}
export const all = ["0", "1", "2", "3", "-0", "-1", "-2", "-3"];
all.forEach(create);
