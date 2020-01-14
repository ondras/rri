import { Vector, clamp, N, E, S, W } from "./direction.js";
import { TILE } from "./conf.js";
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
export default class DrawContext {
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
    station() {
        const ctx = this._ctx;
        let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
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
        let start = STARTS[edge].map($ => $ * TILE);
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
        let start = STARTS[edge].map($ => $ * TILE);
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
        let start = STARTS[edge].map($ => $ * TILE);
        let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
        this.railTicks(edge, length > 0.5 ? 1 : 0.35);
    }
    roadLine(edge, length, diff) {
        const ctx = this._ctx;
        this.styleLine();
        let pxLength = length * TILE;
        diff *= ROAD_WIDTH / 2;
        let vec = TO_CENTER[edge];
        let start = STARTS[edge].map($ => $ * TILE);
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
        let start = STARTS[edge].map($ => $ * TILE);
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
        let point = STARTS[direction].map($ => $ * TILE);
        const R = 12;
        ctx.beginPath();
        ctx.arc(point[0], point[1], R, 0, Math.PI, false);
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fill();
    }
}
