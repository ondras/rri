const N = 0;
const E = 1;
const S = 2;
const W = 3;
function clamp(direction) {
    direction = direction % 4;
    return (direction >= 0 ? direction : direction + 4);
}
const all = [N, E, S, W];
const Vector = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const repo = {};
class Transform {
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
    applyToContext(ctx) {
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        if (this._direction == -1) {
            ctx.scale(-1, 1);
        }
        const deg = this._offset * 90;
        const rad = deg * Math.PI / 180;
        ctx.rotate(rad);
        ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    }
}
function create(id) {
    let offset = Math.abs(Number(id));
    let direction = (id.startsWith("-") ? -1 : 1);
    repo[id] = new Transform(direction, offset);
    return get(id);
}
function get(id) {
    if (!(id in repo)) {
        throw new Error(`Transform ${id} not found`);
    }
    return repo[id];
}
const all$1 = ["0", "1", "2", "3", "-0", "-1", "-2", "-3"];
all$1.forEach(create);

const NONE = 0;
const RAIL = 1;
const ROAD = 2;
const LAKE = 3;

const BOARD = 7;
const TILE = Number(getComputedStyle(document.body).getPropertyValue("--tile-size"));
const DBLCLICK = 400;
const DOWN_EVENT = ("onpointerdown" in window ? "pointerdown" : "touchstart");

function node(name, attrs = {}, content) {
    let node = document.createElement(name);
    Object.assign(node, attrs);
    content && (node.textContent = content);
    return node;
}

const RAIL_TICK_WIDTH = 1;
const LINE_WIDTH = 2;
const STATION = 18;
const RADIUS = 16;
const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;
const RAIL_TICK_SMALL = [RAIL_TICK_WIDTH, 6];
const RAIL_TICK_LARGE = [RAIL_TICK_WIDTH, 8];
const ROAD_TICK = [6, 4];
const STARTS = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const TO_CENTER = Vector.map((_, i, all) => all[clamp(i + 2)]);
function toAbs(p) {
    return p.map($ => $ * TILE);
}
function computeControlPoint(p1, p2) {
    if (p1[0] == p2[0]) {
        return [1 - p1[0], 0.5];
    }
    else {
        return [0.5, 1 - p1[1]];
    }
}
function createLakeCanvas() {
    const N = 4;
    const PX = 2;
    const canvas = node("canvas");
    canvas.width = canvas.height = N * PX;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const H = 200 + ~~(Math.random() * (240 - 200));
            const S = 100;
            const V = 70 + ~~(Math.random() * (90 - 70));
            ctx.fillStyle = `hsl(${H}, ${S}%, ${V}%)`;
            ctx.fillRect(i * PX, j * PX, PX, PX);
        }
    }
    return canvas;
}
const lakeCanvas = createLakeCanvas();
class DrawContext {
    constructor(canvas) {
        canvas.width = canvas.height = TILE * devicePixelRatio;
        this._ctx = canvas.getContext("2d");
        this._ctx.scale(devicePixelRatio, devicePixelRatio);
        this._ctx.lineWidth = LINE_WIDTH;
    }
    styleLine() {
        const ctx = this._ctx;
        ctx.lineWidth = LINE_WIDTH;
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
    styleRoadTicks(dash, offset) {
        const ctx = this._ctx;
        ctx.lineWidth = LINE_WIDTH;
        ctx.setLineDash(dash);
        ctx.lineDashOffset = offset;
    }
    styleRailTicks(dash, offset) {
        const ctx = this._ctx;
        ctx.lineWidth = RAIL_WIDTH;
        ctx.setLineDash(dash);
        ctx.lineDashOffset = offset;
    }
    styleLake() {
        const ctx = this._ctx;
        ctx.fillStyle = ctx.createPattern(lakeCanvas, "repeat");
    }
    station() {
        const ctx = this._ctx;
        let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
        ctx.fillStyle = "#000";
        ctx.fillRect(size[0] / 2 - STATION / 2, size[1] / 2 - STATION / 2, STATION, STATION);
    }
    railCross() {
        const ctx = this._ctx;
        this.styleLine();
        ctx.lineWidth = RAIL_TICK_WIDTH;
        ctx.beginPath();
        let c = [TILE / 2, TILE / 2];
        let d = RAIL_WIDTH / 2;
        ctx.moveTo(c[0] - d, c[1] - d);
        ctx.lineTo(c[0] + d, c[1] + d);
        ctx.moveTo(c[0] - d, c[1] + d);
        ctx.lineTo(c[0] + d, c[1] - d);
        ctx.stroke();
    }
    roadTicks(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let start = toAbs(STARTS[edge]);
        let vec = TO_CENTER[edge];
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        this.styleRoadTicks(ROAD_TICK, -3);
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    railTicks(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let start = toAbs(STARTS[edge]);
        let vec = TO_CENTER[edge];
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        if (length > 0.5) {
            this.styleRailTicks(RAIL_TICK_LARGE, 5);
        }
        else {
            this.styleRailTicks(RAIL_TICK_SMALL, 3);
        }
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    rail(edge, length) {
        const ctx = this._ctx;
        this.styleLine();
        let pxLength = length * TILE;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
        let ticksLength = length;
        if (length <= 0.5) {
            ticksLength = Math.min(ticksLength, 0.35);
        } // short rail segments have a max of .35 ticks
        this.railTicks(edge, ticksLength);
    }
    roadLine(edge, length, diff) {
        const ctx = this._ctx;
        this.styleLine();
        let pxLength = length * TILE;
        diff *= ROAD_WIDTH / 2;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        ctx.beginPath();
        switch (edge) {
            case N:
            case S:
                ctx.moveTo(start[0] + diff, start[1]);
                ctx.lineTo(end[0] + diff, end[1]);
                break;
            case W:
            case E:
                ctx.moveTo(start[0], start[1] + diff);
                ctx.lineTo(end[0], end[1] + diff);
                break;
        }
        ctx.stroke();
    }
    road(edge, length) {
        const ctx = this._ctx;
        let pxLength = length * TILE;
        let vec = TO_CENTER[edge];
        let start = toAbs(STARTS[edge]);
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        switch (edge) {
            case N:
                ctx.clearRect(start[0] - ROAD_WIDTH / 2, start[1], ROAD_WIDTH, pxLength);
                break;
            case S:
                ctx.clearRect(end[0] - ROAD_WIDTH / 2, end[1], ROAD_WIDTH, pxLength);
                break;
            case W:
                ctx.clearRect(start[0], start[1] - ROAD_WIDTH / 2, pxLength, ROAD_WIDTH);
                break;
            case E:
                ctx.clearRect(end[0], end[1] - ROAD_WIDTH / 2, pxLength, ROAD_WIDTH);
                break;
        }
        this.roadLine(edge, length, -1);
        this.roadLine(edge, length, +1);
        this.roadTicks(edge, length);
    }
    arc(quadrant, diff) {
        const ctx = this._ctx;
        diff *= ROAD_WIDTH / 2;
        let R = RADIUS + diff;
        ctx.beginPath();
        let start = [0, 0]; // N/S edge
        let end = [0, 0]; // E/W edge
        switch (quadrant) {
            case N: // top-left
                start[0] = end[1] = TILE / 2 + diff;
                break;
            case E: // top-right
                start[0] = TILE / 2 - diff;
                end[0] = TILE;
                end[1] = TILE / 2 + diff;
                break;
            case S: // bottom-right
                start[0] = TILE / 2 - diff;
                start[1] = TILE;
                end[0] = TILE;
                end[1] = TILE / 2 - diff;
                break;
            case W: // bottom-left
                end[1] = TILE / 2 - diff;
                start[0] = TILE / 2 + diff;
                start[1] = TILE;
                break;
        }
        ctx.moveTo(...start);
        ctx.arcTo(start[0], end[1], end[0], end[1], R);
        ctx.lineTo(...end);
        ctx.stroke();
    }
    redGlow(direction) {
        const ctx = this._ctx;
        let point = toAbs(STARTS[direction]);
        const R = 12;
        ctx.beginPath();
        ctx.arc(point[0], point[1], R, 0, Math.PI, false);
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fill();
    }
    lake(points) {
        points.push(points[0]); // implicitly closed
        const ctx = this._ctx;
        const fillPath = new Path2D();
        const strokePath = new Path2D();
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const absPoint = toAbs(point);
            if (i == 0) {
                fillPath.moveTo(...absPoint);
                strokePath.moveTo(...absPoint);
                continue;
            }
            const prevPoint = points[i - 1];
            if (point[0] == 0.5) { // arc
                let nextPoint = points[i + 1];
                let cp = computeControlPoint(prevPoint, nextPoint);
                cp = toAbs(cp);
                nextPoint = toAbs(nextPoint);
                fillPath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
                strokePath.quadraticCurveTo(cp[0], cp[1], ...nextPoint);
                i++;
            }
            else { // straight line
                fillPath.lineTo(...absPoint);
                // only diagonals are stroked
                if (point[0] == prevPoint[0] || point[1] == prevPoint[1]) {
                    strokePath.moveTo(...absPoint);
                }
                else {
                    strokePath.lineTo(...absPoint);
                }
            }
        }
        this.styleLake();
        ctx.fill(fillPath);
        this.styleLine();
        ctx.stroke(strokePath);
    }
}

const repo$1 = {};
const templates = {
    "rail-half": {
        edges: [
            { type: RAIL, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.rail(N, 0.35);
            ctx.redGlow(N);
        }
    },
    "road-half": {
        edges: [
            { type: ROAD, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.road(N, 0.35);
            ctx.redGlow(N);
        }
    },
    "rail-i": {
        edges: [
            { type: RAIL, connects: [S] },
            { type: NONE, connects: [] },
            { type: RAIL, connects: [N] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.rail(N, 1);
        }
    },
    "road-i": {
        edges: [
            { type: ROAD, connects: [S] },
            { type: NONE, connects: [] },
            { type: ROAD, connects: [N] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.road(N, 0.5);
            ctx.road(S, 0.5);
        }
    },
    "rail-t": {
        edges: [
            { type: RAIL, connects: [E, W] },
            { type: RAIL, connects: [N, W] },
            { type: NONE, connects: [] },
            { type: RAIL, connects: [N, E] }
        ],
        render(ctx) {
            ctx.rail(N, 0.5);
            ctx.rail(E, 0.5);
            ctx.rail(W, 0.5);
            ctx.railCross();
        }
    },
    "road-t": {
        edges: [
            { type: ROAD, connects: [E, W] },
            { type: ROAD, connects: [N, W] },
            { type: NONE, connects: [] },
            { type: ROAD, connects: [N, E] }
        ],
        render(ctx) {
            ctx.arc(N, -1);
            ctx.arc(E, -1);
            ctx.roadTicks(N, 0.5);
            ctx.roadTicks(E, 0.5);
            ctx.roadTicks(W, 0.5);
            ctx.roadLine(E, 0.5, 1);
            ctx.roadLine(W, 0.5, 1);
        }
    },
    "rail-l": {
        edges: [
            { type: RAIL, connects: [E] },
            { type: RAIL, connects: [N] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.arc(E, 0);
            ctx.styleRailTicks([1, 7], -3);
            ctx.arc(E, 0);
        }
    },
    "road-l": {
        edges: [
            { type: ROAD, connects: [E] },
            { type: ROAD, connects: [N] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.arc(E, -1);
            ctx.arc(E, 1);
            ctx.styleRoadTicks([7, 4], -3);
            ctx.arc(E, 0);
        }
    },
    "rail-road-l": {
        edges: [
            { type: RAIL, connects: [E] },
            { type: ROAD, connects: [N] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.rail(N, 0.5);
            ctx.road(E, 0.5);
            ctx.station();
        }
    },
    "rail-road-i": {
        edges: [
            { type: RAIL, connects: [S] },
            { type: NONE, connects: [] },
            { type: ROAD, connects: [N] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.rail(N, 0.5);
            ctx.road(S, 0.5);
            ctx.station();
        }
    },
    "bridge": {
        edges: [
            { type: ROAD, connects: [S] },
            { type: RAIL, connects: [W] },
            { type: ROAD, connects: [N] },
            { type: RAIL, connects: [E] }
        ],
        render(ctx) {
            ctx.rail(E, 0.5);
            ctx.rail(W, 0.5);
            ctx.road(N, 0.5);
            ctx.road(S, 0.5);
        }
    },
    "cross-road-road-rail-road": {
        edges: [
            { type: ROAD, connects: [S, E, W] },
            { type: ROAD, connects: [N, S, W] },
            { type: RAIL, connects: [N, E, W] },
            { type: ROAD, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.road(N, 0.5);
            ctx.road(E, 0.5);
            ctx.rail(S, 0.5);
            ctx.road(W, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-rail-rail": {
        edges: [
            { type: ROAD, connects: [S, E, W] },
            { type: RAIL, connects: [N, S, W] },
            { type: RAIL, connects: [N, E, W] },
            { type: RAIL, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.road(N, 0.5);
            ctx.rail(E, 0.5);
            ctx.rail(S, 0.5);
            ctx.rail(W, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-rail-road": {
        edges: [
            { type: ROAD, connects: [S, E, W] },
            { type: RAIL, connects: [N, S, W] },
            { type: RAIL, connects: [N, E, W] },
            { type: ROAD, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.road(N, 0.5);
            ctx.rail(E, 0.5);
            ctx.rail(S, 0.5);
            ctx.road(W, 0.5);
            ctx.station();
        }
    },
    "cross-road-rail-road-rail": {
        edges: [
            { type: ROAD, connects: [S, E, W] },
            { type: RAIL, connects: [N, S, W] },
            { type: ROAD, connects: [N, E, W] },
            { type: RAIL, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.road(N, 0.5);
            ctx.rail(E, 0.5);
            ctx.road(S, 0.5);
            ctx.rail(W, 0.5);
            ctx.station();
        }
    },
    "cross-rail": {
        edges: [
            { type: RAIL, connects: [S, E, W] },
            { type: RAIL, connects: [N, S, W] },
            { type: RAIL, connects: [N, E, W] },
            { type: RAIL, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.rail(N, 0.5);
            ctx.rail(E, 0.5);
            ctx.rail(S, 0.5);
            ctx.rail(W, 0.5);
            ctx.railCross();
        }
    },
    "cross-road": {
        edges: [
            { type: ROAD, connects: [S, E, W] },
            { type: ROAD, connects: [N, S, W] },
            { type: ROAD, connects: [N, E, W] },
            { type: ROAD, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.arc(N, -1);
            ctx.arc(E, -1);
            ctx.arc(S, -1);
            ctx.arc(W, -1);
            ctx.roadTicks(N, 0.5);
            ctx.roadTicks(E, 0.5);
            ctx.roadTicks(S, 0.5);
            ctx.roadTicks(W, 0.5);
        }
    },
    "lake-1": {
        edges: [
            { type: LAKE, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [.5, .5]]);
        }
    },
    "lake-2": {
        edges: [
            { type: LAKE, connects: [E] },
            { type: LAKE, connects: [N] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [1, 1]]);
        }
    },
    "lake-3": {
        edges: [
            { type: LAKE, connects: [E, S] },
            { type: LAKE, connects: [N, S] },
            { type: LAKE, connects: [N, E] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [1, 1], [0, 1], [.5, .5]]);
        }
    },
    "lake-4": {
        edges: [
            { type: LAKE, connects: [E, S, W] },
            { type: LAKE, connects: [N, S, W] },
            { type: LAKE, connects: [N, E, W] },
            { type: LAKE, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [1, 1], [0, 1]]);
        }
    },
    "lake-rail": {
        edges: [
            { type: LAKE, connects: [S] },
            { type: NONE, connects: [] },
            { type: RAIL, connects: [N] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [.5, .5]]);
            ctx.rail(S, 0.5);
            ctx.station();
        }
    },
    "lake-road": {
        edges: [
            { type: LAKE, connects: [S] },
            { type: NONE, connects: [] },
            { type: ROAD, connects: [N] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [.5, .5]]);
            ctx.road(S, 0.5);
            ctx.station();
        }
    },
    "lake-rail-road": {
        edges: [
            { type: LAKE, connects: [E, S, W] },
            { type: LAKE, connects: [N, S, W] },
            { type: ROAD, connects: [N, E, W] },
            { type: RAIL, connects: [N, E, S] }
        ],
        render(ctx) {
            ctx.lake([[0, 0], [1, 0], [1, 1]]);
            ctx.road(S, 0.5);
            ctx.rail(W, 0.5);
            ctx.station();
        }
    }
};
function get$1(id) {
    if (!(id in repo$1)) {
        throw new Error(`Shape ${id} not found`);
    }
    return repo$1[id];
}
function getTransforms(edges) {
    let cache = new Set();
    function filter(t) {
        let transform = get(t);
        let key = all.map(d => {
            d = transform.apply(d);
            return edges[d].type;
        }).join("/");
        if (cache.has(key)) {
            return false;
        }
        cache.add(key);
        return true;
    }
    return all$1.filter(filter);
}
function shapeFromTemplate(template) {
    let canvas = node("canvas");
    let ctx = new DrawContext(canvas);
    template.render(ctx);
    let image = node("img", { alt: "tile", src: canvas.toDataURL("image/png") });
    return {
        edges: template.edges,
        transforms: getTransforms(template.edges),
        canvas,
        image
    };
}
Object.entries(templates).forEach(([k, v]) => repo$1[k] = shapeFromTemplate(v));

class Tile {
    constructor(sid, transform) {
        this._sid = sid;
        this.node = get$1(sid).image.cloneNode(true);
        this.node.classList.add("tile");
        this.transform = transform;
    }
    clone() {
        return new Tile(this._sid, this.transform);
    }
    createCanvas() {
        const shape = get$1(this._sid);
        const source = shape.canvas;
        const canvas = node("canvas", { width: source.width, height: source.height });
        const ctx = canvas.getContext("2d");
        get(this._tid).applyToContext(ctx);
        ctx.drawImage(shape.canvas, 0, 0);
        return canvas;
    }
    get transform() { return this._tid; }
    set transform(transform) {
        this._tid = transform;
        this.node.style.transform = get(transform).getCSS();
    }
    getEdge(direction) {
        let transform = get(this.transform);
        direction = transform.invert(direction);
        let edge = get$1(this._sid).edges[direction];
        return {
            type: edge.type,
            connects: edge.connects.map(d => transform.apply(d))
        };
    }
    getTransforms() { return get$1(this._sid).transforms; }
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

function getNeighbor(cell, direction, cells) {
    let x = cell.x + Vector[direction][0];
    let y = cell.y + Vector[direction][1];
    return cells.at(x, y);
}
function getCenterCount(cells) {
    return cells.filter(cell => cell.center && cell.tile).length;
}
function getEdgeKey(a, b) {
    if (a.x > b.x || a.y > b.y) {
        [a, b] = [b, a];
    }
    return [a.x, a.y, b.x, b.y].join("/");
}
function getSubgraph(start, cells) {
    let subgraph = [];
    let queue = [{ cell: start, from: null }];
    let lockedEdges = new Set();
    while (queue.length) {
        let current = queue.shift();
        let cell = current.cell;
        if (!cell.tile) {
            continue;
        }
        subgraph.push(cell);
        let tile = cell.tile;
        let outDirections = (current.from === null ? all : tile.getEdge(current.from).connects);
        outDirections.forEach(d => {
            let edgeType = tile.getEdge(d).type;
            if (edgeType == NONE) {
                return;
            }
            let neighbor = getNeighbor(cell, d, cells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
            if (neighborEdgeType != edgeType) {
                return;
            }
            let edgeKey = getEdgeKey(cell, neighbor);
            if (lockedEdges.has(edgeKey)) {
                return;
            }
            lockedEdges.add(edgeKey);
            queue.push({ cell: neighbor, from: neighborEdge });
        });
    }
    return subgraph;
}
function getConnectedExits(start, cells) {
    return getSubgraph(start, cells).filter(cell => cell.border);
}
function getExits(cells) {
    let results = [];
    let exitsArr = cells.filter(cell => cell.border && cell.tile);
    let exits = new Set(exitsArr);
    while (exits.size > 0) {
        let cell = exits.values().next().value;
        let connected = getConnectedExits(cell, cells);
        if (connected.length > 1) {
            results.push(connected.length);
        }
        connected.forEach(cell => exits.delete(cell));
    }
    return results;
}
function getLongestFrom(cell, from, ctx) {
    if (!cell.tile) {
        return [];
    }
    let path = [];
    let tile = cell.tile;
    let outDirections = (from === null ? all : tile.getEdge(from).connects);
    ctx.lockedCells.add(cell);
    outDirections
        .filter(d => tile.getEdge(d).type == ctx.edgeType)
        .forEach(d => {
        let neighbor = getNeighbor(cell, d, ctx.cells);
        if (neighbor.border || !neighbor.tile) {
            return;
        }
        if (ctx.lockedCells.has(neighbor)) {
            return;
        }
        let neighborEdge = clamp(d + 2);
        let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
        if (neighborEdgeType != ctx.edgeType) {
            return;
        }
        let subpath = getLongestFrom(neighbor, neighborEdge, ctx);
        if (subpath.length > path.length) {
            path = subpath;
        }
    });
    ctx.lockedCells.delete(cell);
    path.unshift(cell);
    return path;
}
function getLongest(edgeType, cells) {
    function contains(cell) {
        if (cell.border || !cell.tile) {
            return;
        }
        let tile = cell.tile;
        return all.some(d => tile.getEdge(d).type == edgeType);
    }
    let starts = cells.filter(contains);
    let bestPath = [];
    starts.forEach(cell => {
        let lockedCells = new Set();
        let ctx = { cells, edgeType, lockedCells };
        let path = getLongestFrom(cell, null, ctx);
        if (path.length > bestPath.length) {
            bestPath = path;
        }
    });
    return bestPath;
}
function isDeadend(deadend, cells) {
    const cell = deadend.cell;
    const tile = cell.tile;
    if (!tile) {
        return false;
    }
    let edge = tile.getEdge(deadend.direction).type;
    if (edge != RAIL && edge != ROAD) {
        return false;
    }
    let neighbor = getNeighbor(cell, deadend.direction, cells);
    if (neighbor.border) {
        return false;
    }
    if (!neighbor.tile) {
        return true;
    }
    let neighborEdge = clamp(deadend.direction + 2);
    return (neighbor.tile.getEdge(neighborEdge).type != edge);
}
function getDeadends(cells) {
    let deadends = [];
    cells.filter(cell => !cell.border).forEach(cell => {
        all.forEach(direction => {
            let deadend = { cell, direction };
            isDeadend(deadend, cells) && deadends.push(deadend);
        });
    });
    return deadends;
}
function extractLake(lakeCells, allCells) {
    let pending = [lakeCells.shift()];
    let processed = [];
    while (pending.length) {
        const current = pending.shift();
        processed.push(current);
        const tile = current.tile;
        if (!tile) {
            continue;
        }
        all.filter(d => tile.getEdge(d).type == LAKE).forEach(d => {
            let neighbor = getNeighbor(current, d, allCells);
            if (!neighbor.tile) {
                return;
            }
            let neighborEdge = clamp(d + 2);
            let neighborEdgeType = neighbor.tile.getEdge(neighborEdge).type;
            if (neighborEdgeType != LAKE) {
                return;
            }
            let index = lakeCells.indexOf(neighbor);
            if (index == -1) {
                return;
            }
            lakeCells.splice(index, 1);
            pending.push(neighbor);
        });
    }
    return processed;
}
function getLakes(cells) {
    function isLake(cell) {
        if (!cell.tile) {
            return;
        }
        let tile = cell.tile;
        return all.some(d => tile.getEdge(d).type == LAKE);
    }
    let lakeCells = cells.filter(isLake);
    let sizes = [];
    while (lakeCells.length) {
        sizes.push(extractLake(lakeCells, cells).length);
    }
    return sizes;
}
function get$2(cells) {
    return {
        exits: getExits(cells),
        center: getCenterCount(cells),
        rail: getLongest(RAIL, cells),
        road: getLongest(ROAD, cells),
        deadends: getDeadends(cells),
        lakes: getLakes(cells)
    };
}
function buildTable() {
    const table = node("table", { className: "score" });
    table.appendChild(node("thead"));
    table.appendChild(node("tbody"));
    table.tHead.insertRow().insertCell();
    const body = table.tBodies[0];
    ["Connected exists", "Longest road", "Longest rail", "Center tiles", "Dead ends", "Smallest lake"].forEach(label => {
        body.insertRow().insertCell().textContent = label;
    });
    body.rows[body.rows.length - 1].hidden = true;
    table.appendChild(node("tfoot"));
    table.tFoot.insertRow().insertCell().textContent = "Score";
    return table;
}
function addColumn(table, score, name = "") {
    if (name) {
        table.tHead.rows[0].insertCell().textContent = name;
    }
    const body = table.tBodies[0];
    let exits = score.exits.map(count => count == 12 ? 45 : (count - 1) * 4);
    let exitScore = exits.reduce((a, b) => a + b, 0);
    body.rows[0].insertCell().textContent = (exitScore ? `${score.exits.join("+")} → ${exitScore}` : "0");
    body.rows[1].insertCell().textContent = score.road.toString();
    body.rows[2].insertCell().textContent = score.rail.toString();
    body.rows[3].insertCell().textContent = score.center.toString();
    body.rows[4].insertCell().textContent = (-score.deadends).toString();
    let lakeRow = body.rows[5];
    let lakeScore = 0;
    if (score.lakes.length > 0) {
        lakeScore = score.lakes.sort((a, b) => a - b)[0];
        lakeRow.insertCell().textContent = lakeScore.toString();
        lakeRow.hidden = false;
    }
    else {
        lakeRow.insertCell();
    }
    let total = exitScore
        + score.road
        + score.rail
        + score.center
        - score.deadends
        + lakeScore;
    table.tFoot.rows[0].insertCell().textContent = total.toString();
}
function toNetworkScore(score) {
    return {
        exits: score.exits,
        road: score.road.length,
        rail: score.rail.length,
        center: score.center,
        deadends: score.deadends.length,
        lakes: score.lakes
    };
}
function renderSingle(score) {
    const table = buildTable();
    addColumn(table, toNetworkScore(score));
    return table;
}
function renderMulti(players) {
    const table = buildTable();
    players.forEach(p => p.score && addColumn(table, p.score, p.name));
    return table;
}

function inBoard(x, y) {
    return (x > 0 && y > 0 && x <= BOARD && y <= BOARD);
}
class CellRepo {
    constructor() {
        this._cells = [];
        const tile = null;
        const round = 0;
        for (let y = 0; y < BOARD + 2; y++) {
            let row = [];
            this._cells.push(row);
            for (let x = 0; x < BOARD + 2; x++) {
                let border = !inBoard(x, y);
                let center = (x >= 3 && x <= 5 && y >= 3 && y <= 5);
                let cell = { x, y, border, center, tile, round };
                row.push(cell);
            }
        }
    }
    forEach(cb) {
        this._cells.forEach(row => {
            row.forEach(cell => cb(cell));
        });
    }
    filter(test) {
        let results = [];
        this._cells.forEach(row => {
            row.forEach(cell => {
                test(cell) && results.push(cell);
            });
        });
        return results;
    }
    at(x, y) {
        return this._cells[y][x];
    }
}

class Board {
    constructor() {
        this.blob = null;
        this._cells = new CellRepo();
        this.node = this._build();
        this._placeInitialTiles();
    }
    showScore(_score) { }
    onClick(_cell) { }
    getScore() { return get$2(this._cells); }
    commit(round) {
        this._surroundLakes(round);
    }
    cycleTransform(x, y) {
        let tile = this._cells.at(x, y).tile;
        if (!tile) {
            return;
        }
        let avail = this._getTransforms(tile, x, y);
        let index = avail.indexOf(tile.transform);
        if (index == -1 || avail.length <= 1) {
            return;
        }
        index = (index + 1) % avail.length;
        tile.transform = avail[index];
    }
    placeBest(tile, x, y, round) {
        let avail = this._getTransforms(tile, x, y);
        if (!avail.length) {
            return false;
        }
        tile.transform = avail[0];
        this.place(tile, x, y, round);
        return true;
    }
    place(tile, x, y, round) {
        let cell = this._cells.at(x, y);
        cell.tile = tile;
        cell.round = round;
    }
    getAvailableCells(tile) {
        return this._cells.filter(cell => {
            if (cell.border || cell.tile) {
                return false;
            }
            let transforms = this._getTransforms(tile, cell.x, cell.y);
            return (transforms.length > 0);
        });
    }
    _getTransforms(tile, x, y) {
        let neighborEdges = this._getNeighborEdges(x, y);
        let clone = tile.clone();
        function compare(t1, t2) {
            clone.transform = t1;
            let c1 = clone.fitsNeighbors(neighborEdges);
            clone.transform = t2;
            let c2 = clone.fitsNeighbors(neighborEdges);
            return c2 - c1;
        }
        return tile.getTransforms().filter(t => {
            clone.transform = t;
            return clone.fitsNeighbors(neighborEdges);
        }).sort(compare);
    }
    _getNeighborEdges(x, y) {
        return all.map(dir => {
            let vector = Vector[dir];
            let neighbor = this._cells.at(x + vector[0], y + vector[1]).tile;
            if (!neighbor) {
                return NONE;
            }
            return neighbor.getEdge(clamp(dir + 2)).type;
        });
    }
    _placeInitialTiles() {
        this._cells.forEach(cell => {
            const x = cell.x;
            const y = cell.y;
            let tile = null;
            switch (true) {
                case (x == 2 && y == 0):
                case (x == 6 && y == 0):
                    tile = new Tile("road-half", "2");
                    break;
                case (x == 2 && y == 8):
                case (x == 6 && y == 8):
                    tile = new Tile("road-half", "0");
                    break;
                case (x == 0 && y == 2):
                case (x == 0 && y == 6):
                    tile = new Tile("rail-half", "1");
                    break;
                case (x == 8 && y == 2):
                case (x == 8 && y == 6):
                    tile = new Tile("rail-half", "-1");
                    break;
                case (x == 4 && y == 0):
                    tile = new Tile("rail-half", "2");
                    break;
                case (x == 4 && y == 8):
                    tile = new Tile("rail-half", "0");
                    break;
                case (x == 0 && y == 4):
                    tile = new Tile("road-half", "1");
                    break;
                case (x == 8 && y == 4):
                    tile = new Tile("road-half", "-1");
                    break;
            }
            this.place(tile, x, y, 0);
        });
        this.commit(0);
    }
    _surroundLakes(round) {
        const isSurrounded = (cell) => {
            if (cell.tile || cell.border) {
                return false;
            }
            let neighborEdges = this._getNeighborEdges(cell.x, cell.y);
            return neighborEdges.filter(e => e == LAKE).length >= 3;
        };
        let surrounded = this._cells.filter(isSurrounded);
        surrounded.forEach(cell => {
            let tile = new Tile("lake-4", "0");
            this.place(tile, cell.x, cell.y, round);
        });
        surrounded.length && this.commit(round);
    }
}

const DPR = devicePixelRatio;
const BTILE = TILE / 2;
const bodyStyle = getComputedStyle(document.body);
const BORDER = Number(bodyStyle.getPropertyValue("--border-thick"));
const THIN = Number(bodyStyle.getPropertyValue("--border-thin"));
function pxToCell(px) {
    for (let i = 0; i < BOARD + 2; i++) {
        let cellPx = cellToPx(i);
        if (px >= cellPx && px < cellPx + TILE) {
            return i;
        }
    }
    return null;
}
function cellToPx(cell) {
    if (cell == 0) {
        return BTILE - TILE;
    }
    let offset = BTILE + BORDER;
    if (cell <= BOARD) {
        return offset + (cell - 1) * (TILE + THIN);
    }
    return offset + BOARD * TILE + (BOARD - 1) * THIN + BORDER;
}
class BoardCanvas extends Board {
    constructor() {
        super();
        this._signals = [];
        this.node.addEventListener(DOWN_EVENT, this);
    }
    handleEvent(e) {
        switch (e.type) {
            case DOWN_EVENT:
                let pxx = null;
                let pxy = null;
                if ("touches" in e) {
                    pxx = e.touches[0].clientX;
                    pxy = e.touches[0].clientY;
                }
                else {
                    pxx = e.clientX;
                    pxy = e.clientY;
                }
                const rect = this.node.getBoundingClientRect();
                pxx -= rect.left;
                pxy -= rect.top;
                let x = pxToCell(pxx);
                let y = pxToCell(pxy);
                if (x === null || y === null) {
                    return;
                }
                let cell = this._cells.at(x, y);
                this.onClick(cell);
                break;
        }
    }
    place(tile, x, y, round) {
        super.place(tile, x, y, round);
        let index = this._pendingCells.findIndex(cell => cell.x == x && cell.y == y);
        if (index > -1) {
            this._pendingCells[index].node.remove();
            this._pendingCells.splice(index, 1);
        }
        if (!tile) {
            return;
        }
        let node$1 = node("div", { className: "cell" });
        node$1.style.left = `${cellToPx(x)}px`;
        node$1.style.top = `${cellToPx(y)}px`;
        node$1.appendChild(tile.node);
        round && node$1.appendChild(node("div", { className: "round" }, round.toString()));
        this.node.appendChild(node$1);
        this._pendingCells.push({ x, y, node: node$1, tile, round });
    }
    commit(round) {
        super.commit(round);
        const ctx = this._ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        this._pendingCells.forEach(cell => {
            let pxx = cellToPx(cell.x) * DPR;
            let pxy = cellToPx(cell.y) * DPR;
            ctx.drawImage(cell.tile.createCanvas(), pxx, pxy);
            cell.node.remove();
        });
        ctx.restore();
        ctx.font = bodyStyle.getPropertyValue("--round-font");
        const size = Number(bodyStyle.getPropertyValue("--round-size"));
        const bg = bodyStyle.getPropertyValue("--round-bg");
        this._pendingCells.forEach(cell => {
            if (!cell.round) {
                return;
            }
            const pxx = cellToPx(cell.x) + TILE;
            const pxy = cellToPx(cell.y);
            ctx.fillStyle = bg;
            ctx.fillRect(pxx - size, pxy, size, size);
            ctx.fillStyle = "#000";
            ctx.fillText(cell.round.toString(), pxx - size / 2, pxy + size / 2);
        });
        this._pendingCells = [];
    }
    signal(cells) {
        this._signals.forEach(signal => signal.remove());
        this._signals = cells.map(cell => {
            let signal = node("div", { className: "signal" });
            let pxx = cellToPx(cell.x);
            let pxy = cellToPx(cell.y);
            signal.style.left = `${pxx}px`;
            signal.style.top = `${pxy}px`;
            this.node.appendChild(signal);
            return signal;
        });
    }
    showScore(score) {
        const ctx = this._ctx;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
        this._drawPolyline(score.rail);
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
        this._drawPolyline(score.road);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "red";
        score.deadends.forEach(deadend => {
            let pxx = cellToPx(deadend.cell.x) + TILE / 2;
            let pxy = cellToPx(deadend.cell.y) + TILE / 2;
            const offset = TILE / 2 + 10;
            let vec = Vector[deadend.direction];
            pxx += vec[0] * offset;
            pxy += vec[1] * offset;
            ctx.fillText("✘", pxx, pxy);
        });
        ctx.canvas.toBlob(blob => this.blob = blob);
    }
    _build() {
        this._pendingCells = [];
        let node$1 = node("div", { className: "board" });
        let canvas = node("canvas");
        node$1.appendChild(canvas);
        const SIZE = 2 * (BTILE + BORDER) + BOARD * TILE + (BOARD - 1) * THIN;
        canvas.width = canvas.height = SIZE * DPR;
        const PX = `${SIZE}px`;
        canvas.style.width = canvas.style.height = PX;
        document.body.style.setProperty("--board-width", PX);
        const ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.scale(DPR, DPR);
        this._ctx = ctx;
        this._drawGrid();
        return node$1;
    }
    _drawGrid() {
        const ctx = this._ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // fill center
        ctx.fillStyle = bodyStyle.getPropertyValue("--center-bg");
        let start = cellToPx(3) - THIN / 2;
        let length = 3 * (TILE + THIN);
        ctx.fillRect(start, start, length, length);
        // grid
        ctx.beginPath();
        let offsetOdd = 0, offsetEven = 0, lineWidth = THIN;
        switch (DPR) {
            case 1:
                offsetOdd = offsetEven = 0.5;
                break;
            case 1.5:
                offsetOdd = 2 / 3;
                offsetEven = 1 / 3;
                lineWidth /= DPR;
                break;
        }
        ctx.lineWidth = lineWidth;
        start = BTILE + BORDER;
        length = BOARD * TILE + (BOARD - 1) * THIN;
        for (let i = 0; i < BOARD - 1; i++) {
            let x = start + TILE + i * (TILE + THIN);
            let y = start + TILE + i * (TILE + THIN);
            x += (x % 2 ? offsetOdd : offsetEven);
            y += (y % 2 ? offsetOdd : offsetEven);
            ctx.moveTo(start, y);
            ctx.lineTo(start + length, y);
            ctx.moveTo(x, start);
            ctx.lineTo(x, start + length);
        }
        ctx.stroke();
        // grid border
        start = BTILE + BORDER / 2;
        length = length + BORDER;
        ctx.lineWidth = BORDER;
        ctx.strokeRect(start, start, length, length);
        // center border
        ctx.strokeStyle = "red";
        ctx.lineWidth = BORDER;
        start = cellToPx(3) - THIN / 2;
        length = 3 * (TILE + THIN);
        ctx.strokeRect(start, start, length, length);
    }
    _drawPolyline(cells) {
        if (cells.length < 2) {
            return;
        }
        const ctx = this._ctx;
        ctx.beginPath();
        cells.forEach((cell, i, all) => {
            let cx = cellToPx(cell.x) + TILE / 2;
            let cy = cellToPx(cell.y) + TILE / 2;
            if (i == 0) { // first
                ctx.moveTo(cx, cy);
            }
            else if (i == all.length - 1) { // last
                ctx.lineTo(cx, cy);
            }
            else { // midpoint
                let inDir = this._getDirectionBetweenCells(all[i - 1], cell);
                let outDir = this._getDirectionBetweenCells(cell, all[i + 1]);
                if (inDir == outDir) {
                    ctx.lineTo(cx, cy);
                }
                else if (outDir !== null) {
                    let vec = Vector[outDir];
                    let endpoint = [cx + TILE / 2 * vec[0], cy + TILE / 2 * vec[1]];
                    ctx.arcTo(cx, cy, endpoint[0], endpoint[1], 12);
                }
            }
        });
        ctx.stroke();
    }
    _getDirectionBetweenCells(c1, c2) {
        if (c1.y > c2.y) {
            return N;
        }
        if (c1.x > c2.x) {
            return W;
        }
        if (c1.y < c2.y) {
            return S;
        }
        if (c1.x < c2.x) {
            return E;
        }
        return null;
    }
}

class Dice {
    constructor(tile, type) {
        this.node = node("div", { className: "dice" });
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

const MAX_BONUSES = 3;
class Pool {
    constructor() {
        this.node = node("div", { className: "pool" });
        this._dices = [];
    }
    get remaining() {
        return this._dices.filter(d => d.type == "plain" && !d.disabled && !d.blocked);
    }
    handleEvent(e) {
        let target = e.currentTarget;
        let dice = this._dices.filter(dice => dice.node == target)[0];
        if (!dice || dice.disabled || dice.blocked) {
            return;
        }
        this.onClick(dice);
    }
    add(dice) {
        this.node.appendChild(dice.node);
        dice.node.addEventListener(DOWN_EVENT, this);
        this._dices.push(dice);
    }
    enable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = false;
        return true;
    }
    disable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = true;
        return true;
    }
    pending(dice) {
        this._dices.forEach(d => d.pending = (dice == d));
    }
    onClick(_dice) { }
    sync(board) {
        this._dices.filter(dice => !dice.disabled).forEach(dice => {
            let cells = board.getAvailableCells(dice.tile);
            dice.blocked = (cells.length == 0);
        });
    }
}
class BonusPool extends Pool {
    constructor() {
        super();
        this._used = 0;
        this._locked = false;
        this.node.classList.add("bonus");
        ["cross-road-road-rail-road", "cross-road-rail-rail-rail", "cross-road",
            "cross-rail", "cross-road-rail-rail-road", "cross-road-rail-road-rail"].forEach(name => {
            let descriptor = { sid: name, transform: "0", type: "plain" };
            this.add(Dice.fromDescriptor(descriptor));
        });
    }
    handleEvent(e) {
        if (this._locked || this._used == MAX_BONUSES) {
            return;
        }
        super.handleEvent(e);
    }
    disable(dice) {
        let disabled = super.disable(dice);
        if (disabled) { // only if disabled, i.e. the tile was ours
            this._used++;
            this._locked = true;
        }
        return disabled;
    }
    enable(dice) {
        let enabled = super.enable(dice);
        if (enabled) {
            this._used--;
            this.unlock();
        }
        return enabled;
    }
    unlock() {
        this._locked = false;
    }
}

const dataset = document.body.dataset;
class Game {
    constructor(_board) {
        this._board = _board;
        this._node = document.querySelector("#game");
        this._bonusPool = new BonusPool();
    }
    async play() {
        dataset.stage = "game";
        return true;
    }
    _outro() {
        dataset.stage = "outro";
    }
}

class Round {
    constructor(number, _board, _bonusPool) {
        this.number = number;
        this._board = _board;
        this._bonusPool = _bonusPool;
        this._pending = null;
        this._endButton = node("button");
        this._placedTiles = new Map();
        this._lastClickTs = 0;
        this._pool = new Pool();
        this.node = this._pool.node;
        this._endButton.textContent = `End round #${this.number}`;
        window.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key == "a") { // FIXME!
                e.preventDefault();
                while (true) {
                    let r = this._pool.remaining;
                    if (!r.length)
                        break;
                    let d = r.shift();
                    this._onPoolClick(d);
                    let avail = this._board.getAvailableCells(d.tile);
                    if (!avail.length)
                        break;
                    let cell = avail[Math.floor(Math.random() * avail.length)];
                    this._onBoardClick(cell);
                }
            }
        });
    }
    play(descriptors) {
        descriptors.map(d => Dice.fromDescriptor(d)).forEach(dice => this._pool.add(dice));
        this.node.appendChild(this._endButton);
        this._pool.onClick = dice => this._onPoolClick(dice);
        this._bonusPool.onClick = dice => this._onPoolClick(dice);
        this._board.onClick = cell => this._onBoardClick(cell);
        this._syncEnd();
        this._bonusPool.unlock();
        return new Promise(resolve => {
            this._endButton.addEventListener("click", _ => {
                this._end();
                resolve();
            });
        });
    }
    _end() {
        this._board.commit(this.number);
        function noop() { }
        this._pool.onClick = noop;
        this._bonusPool.onClick = noop;
        this._board.onClick = noop;
    }
    _onPoolClick(dice) {
        if (this._pending == dice) {
            this._pending = null;
            this._board.signal([]);
            this._pool.pending(null);
            this._bonusPool.pending(null);
        }
        else {
            this._pending = dice;
            let available = this._board.getAvailableCells(dice.tile);
            this._board.signal(available);
            this._pool.pending(dice);
            this._bonusPool.pending(dice);
        }
    }
    _onBoardClick(cell) {
        const ts = Date.now();
        if (ts - this._lastClickTs < DBLCLICK) {
            this._tryToRemove(cell);
        }
        else if (this._pending) {
            this._tryToAdd(cell);
        }
        else {
            this._tryToCycle(cell);
            this._lastClickTs = ts;
        }
    }
    _tryToRemove(cell) {
        let tile = cell.tile;
        if (!tile) {
            return;
        }
        let dice = this._placedTiles.get(tile);
        if (!dice) {
            return;
        }
        this._placedTiles.delete(tile);
        this._board.place(null, cell.x, cell.y, 0);
        this._pool.enable(dice);
        this._bonusPool.enable(dice);
        this._syncEnd();
    }
    _tryToAdd(cell) {
        if (!this._pending) {
            return;
        }
        let tile = this._pending.tile;
        let available = this._board.getAvailableCells(tile);
        if (!available.includes(cell)) {
            return false;
        }
        const x = cell.x;
        const y = cell.y;
        const clone = tile.clone();
        this._board.placeBest(clone, x, y, this.number);
        this._board.signal([]);
        this._pool.pending(null);
        this._bonusPool.pending(null);
        this._pool.disable(this._pending);
        this._bonusPool.disable(this._pending);
        this._placedTiles.set(clone, this._pending);
        this._pending = null;
        this._syncEnd();
    }
    _tryToCycle(cell) {
        let tile = cell.tile;
        if (!tile) {
            return;
        }
        if (!this._placedTiles.has(tile)) {
            return;
        }
        this._board.cycleTransform(cell.x, cell.y);
        this._syncEnd();
    }
    _syncEnd() {
        this._pool.sync(this._board);
        this._endButton.disabled = (this._pool.remaining.length > 0);
    }
}

const ROUNDS = {
    "normal": 7,
    "lake": 6,
    "demo": 1
};
function expandTemplate(template) {
    let names = template.tiles;
    let sid = names[Math.floor(Math.random() * names.length)];
    return { sid, transform: "0", type: template.type };
}
function createDiceDescriptors(type) {
    switch (type) {
        case "demo":
            return DEMO.map(type => ({ sid: type, transform: "0", type: "plain" }));
        case "lake":
            return [...createDiceDescriptors("normal"), expandTemplate(DICE_LAKE), expandTemplate(DICE_LAKE)];
        default:
            let result = [];
            let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
            while (templates.length) {
                let index = Math.floor(Math.random() * templates.length);
                let template = templates.splice(index, 1)[0];
                result.push(expandTemplate(template));
            }
            return result;
    }
}
const DEMO = [
    "bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t",
    "lake-1", "lake-2", "lake-3", "lake-4", "lake-rail", "lake-road", "lake-rail-road"
];
const DICE_REGULAR_1 = {
    tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
    type: "plain"
};
const DICE_REGULAR_2 = {
    tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
    type: "plain"
};
const DICE_LAKE = {
    tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
    type: "lake"
};

class SingleGame extends Game {
    constructor(_board, _type) {
        super(_board);
        this._type = _type;
    }
    async play() {
        super.play();
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        let num = 1;
        while (num <= ROUNDS[this._type]) {
            let round = new Round(num, this._board, this._bonusPool);
            let descriptors = createDiceDescriptors(this._type);
            this._node.appendChild(round.node);
            await round.play(descriptors);
            round.node.remove();
            num++;
        }
        this._outro();
        return true;
    }
    _outro() {
        super._outro();
        let s = this._board.getScore();
        this._board.showScore(s);
        const placeholder = document.querySelector("#outro div");
        placeholder.innerHTML = "";
        placeholder.appendChild(renderSingle(s));
    }
}

const V = "2.0";
function debug(msg, ...args) {
    console.debug(`[jsonrpc] ${msg}`, ...args);
}
function warn(msg, ...args) {
    console.warn(`[jsonrpc] ${msg}`, ...args);
}
function createErrorMessage(id, code, message, data) {
    let error = { code, message };
    if (data) {
        error.data = data;
    }
    return { id, error, jsonrpc: V };
}
function createResultMessage(id, result) {
    return { id, result, jsonrpc: V };
}
function createCallMessage(method, params, id) {
    let message = { method, params, jsonrpc: V };
    if (id) {
        message.id = id;
    }
    return message;
}
class JsonRpc {
    constructor(_io) {
        this._io = _io;
        this._interface = new Map();
        this._pendingPromises = new Map();
        _io.onData = (m) => this._onData(m);
    }
    expose(name, method) {
        this._interface.set(name, method);
    }
    async call(method, params) {
        let id = Math.random().toString();
        let message = createCallMessage(method, params, id);
        return new Promise((resolve, reject) => {
            this._pendingPromises.set(id, { resolve, reject });
            this._send(message);
        });
    }
    notify(method, params) {
        let message = createCallMessage(method, params);
        this._send(message);
    }
    _send(message) {
        const str = JSON.stringify(message);
        debug("sending", str);
        this._io.sendData(str);
    }
    _onData(str) {
        debug("received", str);
        let message;
        try {
            message = JSON.parse(str);
        }
        catch (e) {
            let reply = createErrorMessage(null, -32700, e.message);
            this._send(reply);
            return;
        }
        let reply;
        if (message instanceof Array) {
            let mapped = message.map(m => this._processMessage(m)).filter(m => m);
            reply = (mapped.length ? mapped : null);
        }
        else {
            reply = this._processMessage(message);
        }
        reply && this._send(reply);
    }
    _processMessage(message) {
        if ("method" in message) { // call
            const method = this._interface.get(message.method);
            if (!method) {
                return (message.id ? createErrorMessage(message.id, -32601, "method not found") : null);
            }
            try {
                const result = (message.params instanceof Array ? method(...message.params) : method(message.params));
                return (message.id ? createResultMessage(message.id, result) : null);
            }
            catch (e) {
                warn("caught", e);
                return (message.id ? createErrorMessage(message.id, -32000, e.message) : null);
            }
        }
        else if (message.id) { // result/error
            let promise = this._pendingPromises.get(message.id);
            if (!promise) {
                throw new Error(`Received a non-matching response id "${message.id}"`);
            }
            this._pendingPromises.delete(message.id);
            ("error" in message ? promise.reject(message.error) : promise.resolve(message.result));
        }
        else {
            throw new Error("Received a non-call non-id JSON-RPC message");
        }
        return null;
    }
}

const template = document.querySelector("template");
function createRpc(ws) {
    let io = {
        onData(_s) { },
        sendData(s) { ws.send(s); }
    };
    ws.addEventListener("message", e => io.onData(e.data));
    return new JsonRpc(io);
}
function openWebSocket(url) {
    const ws = new WebSocket(url);
    return new Promise((resolve, reject) => {
        ws.addEventListener("open", e => resolve(e.target));
        ws.addEventListener("error", _ => reject(new Error("Cannot connect to server")));
    });
}
class MultiGame extends Game {
    constructor(board) {
        super(board);
        this._nodes = {};
        this._state = "";
        this._wait = node("p", { className: "wait", hidden: true });
        ["setup", "lobby"].forEach(id => {
            let node = template.content.querySelector(`#multi-${id}`);
            this._nodes[id] = node.cloneNode(true);
        });
        const setup = this._nodes["setup"];
        setup.querySelector("[name=join]").addEventListener("click", _ => this._joinOrCreate());
        setup.querySelector("[name=create-normal]").addEventListener("click", _ => this._joinOrCreate("normal"));
        setup.querySelector("[name=create-lake]").addEventListener("click", _ => this._joinOrCreate("lake"));
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").addEventListener("click", _ => this._start());
    }
    async play() {
        super.play();
        return new Promise(resolve => {
            this._resolve = resolve;
            this._setup();
        });
    }
    async _setup() {
        this._node.innerHTML = "";
        const setup = this._nodes["setup"];
        this._node.appendChild(setup);
        try {
            const ws = await openWebSocket("ws://localhost:1234"); // FIXME
            const rpc = createRpc(ws);
            ws.addEventListener("close", e => this._onClose(e));
            rpc.expose("game-change", () => this._sync());
            rpc.expose("game-destroy", () => {
                alert("The game owner has cancelled the game");
                ws.close();
                this._resolve(false);
            });
            rpc.expose("game-over", (...scores) => {
                this._outro();
                this._showScore(scores);
                ws.close();
                this._resolve(true);
            });
            let quit = node("button", {}, "Quit game");
            quit.addEventListener("click", async (_) => {
                if (!(confirm("Really quit the game?"))) {
                    return;
                }
                await rpc.call("quit-game", []);
                ws.close();
                this._resolve(false);
            });
            this._bonusPool.node.appendChild(quit);
            this._rpc = rpc;
        }
        catch (e) {
            alert(e.message);
            this._resolve(false);
        }
    }
    _onClose(e) {
        if (e.code != 0 && e.code != 1000 && e.code != 1001) {
            alert("Network connection closed");
        }
        this._resolve(false);
    }
    async _joinOrCreate(type) {
        if (!this._rpc) {
            return;
        }
        const setup = this._nodes["setup"];
        let playerName = setup.querySelector("[name=player-name]").value;
        if (!playerName) {
            return alert("Please provide your name");
        }
        let gameName = setup.querySelector("[name=game-name]").value;
        if (!gameName) {
            return alert("Please provide a game name");
        }
        const buttons = setup.querySelectorAll("button");
        buttons.forEach(b => b.disabled = true);
        let args = [gameName, playerName];
        if (type) {
            args.unshift(type);
        }
        try {
            const lobby = this._nodes["lobby"];
            lobby.querySelector("button").disabled = (!type);
            await this._rpc.call(type ? "create-game" : "join-game", args);
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            buttons.forEach(b => b.disabled = false);
        }
    }
    _start() {
        this._rpc && this._rpc.call("start-game", []);
    }
    async _sync() {
        if (!this._rpc) {
            return;
        }
        const response = await this._rpc.call("game-info", []);
        const state = response.state;
        if (state != this._state) {
            this._state = state;
            if (state == "starting") {
                this._node.innerHTML = "";
                this._node.appendChild(this._nodes["lobby"]);
            }
        }
        switch (response.state) {
            case "starting":
                this._updateLobby(response.players);
                break;
            case "playing":
                this._updateRound(response);
                break;
        }
    }
    _updateLobby(players) {
        const lobby = this._nodes["lobby"];
        const list = lobby.querySelector("ul");
        list.innerHTML = "";
        players.forEach(p => {
            let item = node("li", {}, p.name);
            list.appendChild(item);
        });
        const button = lobby.querySelector("button");
        button.textContent = (button.disabled ? `Wait for ${players[0].name} to start the game` : "Start the game");
    }
    async _updateRound(response) {
        let waiting = response.players.filter(p => !p.roundEnded).length;
        this._wait.textContent = `Waiting for ${waiting} player${waiting > 1 ? "s" : ""} to end round`;
        if (this._round && response.round == this._round.number) {
            return;
        }
        let number = (this._round ? this._round.number : 0) + 1;
        this._round = new MultiplayerRound(number, this._board, this._bonusPool);
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        this._node.appendChild(this._round.node);
        await this._round.play(response.dice);
        this._wait.hidden = false;
        this._node.appendChild(this._wait);
        let s = this._board.getScore();
        let ns = toNetworkScore(s);
        this._rpc && this._rpc.call("end-round", ns);
    }
    _showScore(scores) {
        let s = this._board.getScore();
        this._board.showScore(s);
        const placeholder = document.querySelector("#outro div");
        placeholder.innerHTML = "";
        placeholder.appendChild(renderMulti(scores));
    }
}
class MultiplayerRound extends Round {
    _end() {
        super._end();
        this._endButton.disabled = true;
    }
}

const dataset$1 = document.body.dataset;
let board;
function download(parent) {
    if (!board.blob) {
        return;
    }
    const href = URL.createObjectURL(board.blob);
    let a = node("a", { href, download: "railroad-ink.png" });
    parent.appendChild(a);
    a.click();
    a.remove();
}
function goIntro() {
    dataset$1.stage = "intro";
    let newBoard = new BoardCanvas();
    if (board) {
        board.node.replaceWith(newBoard.node);
    }
    else {
        const main = document.querySelector("main");
        main.appendChild(newBoard.node);
    }
    board = newBoard;
}
async function goGame(type) {
    const game = (type == "multi" ? new MultiGame(board) : new SingleGame(board, type));
    let played = await game.play();
    if (!played) {
        goIntro();
    }
}
function init() {
    document.querySelector("[name=start-normal]").addEventListener("click", _ => goGame("normal"));
    document.querySelector("[name=start-lake]").addEventListener("click", _ => goGame("lake"));
    document.querySelector("[name=start-multi]").addEventListener("click", _ => goGame("multi"));
    document.querySelector("[name=again]").addEventListener("click", _ => goIntro());
    document.querySelector("[name=download]").addEventListener("click", e => download(e.target));
    goIntro();
}
init();
