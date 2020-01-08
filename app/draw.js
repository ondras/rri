import { N, E, S, W } from "./direction.js";
import { TILE } from "./conf.js";
const LINE_WIDTH = 2;
const RAIL_WIDTH = 12;
const ROAD_WIDTH = 14;
const RAIL_TICK_SMALL = [2, 5];
const RAIL_TICK_LARGE = [2, 7];
const ROAD_TICK = [6, 4];
const STATION = 18;
const RADIUS = 16;
export function station(ctx) {
    let size = [ctx.canvas.width, ctx.canvas.height].map($ => $ / devicePixelRatio);
    ctx.fillRect(size[0] / 2 - STATION / 2, size[1] / 2 - STATION / 2, STATION, STATION);
}
const STARTS = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
const VECTORS = [[0, 1], [-1, 0], [0, -1], [1, 0]];
export function railCross(ctx) {
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    let c = [TILE / 2, TILE / 2];
    let d = RAIL_WIDTH / 2;
    ctx.moveTo(c[0] - d, c[1] - d);
    ctx.lineTo(c[0] + d, c[1] + d);
    ctx.moveTo(c[0] - d, c[1] + d);
    ctx.lineTo(c[0] + d, c[1] - d);
    ctx.stroke();
}
export function roadTicks(ctx, edge, length) {
    ctx.save();
    let pxLength = length * TILE;
    let start = STARTS[edge].map($ => $ * TILE);
    let vec = VECTORS[edge];
    let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
    ctx.lineWidth = LINE_WIDTH;
    ctx.setLineDash(ROAD_TICK);
    ctx.lineDashOffset = -3;
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.lineTo(...end);
    ctx.stroke();
    ctx.restore();
}
export function railTicks(ctx, edge, length) {
    let pxLength = length * TILE;
    let start = STARTS[edge].map($ => $ * TILE);
    let vec = VECTORS[edge];
    let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
    ctx.save();
    if (length > 0.5) {
        ctx.setLineDash(RAIL_TICK_LARGE);
        ctx.lineDashOffset = 5;
    }
    else {
        ctx.setLineDash(RAIL_TICK_SMALL);
        ctx.lineDashOffset = 3;
    }
    ctx.lineWidth = RAIL_WIDTH;
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.lineTo(...end);
    ctx.stroke();
    ctx.restore();
}
export function rail(ctx, edge, length) {
    let pxLength = length * TILE;
    let vec = VECTORS[edge];
    let start = STARTS[edge].map($ => $ * TILE);
    let end = [start[0] + vec[0] * pxLength, start[1] + vec[1] * pxLength];
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.lineTo(...end);
    ctx.stroke();
    railTicks(ctx, edge, length > 0.5 ? 1 : 0.35);
}
export function road(ctx, edge, length) {
    let pxLength = length * TILE;
    let vec = VECTORS[edge];
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
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    [-ROAD_WIDTH / 2, ROAD_WIDTH / 2].forEach(diff => {
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
    });
    ctx.stroke();
    roadTicks(ctx, edge, length);
}
export function arc(ctx, edge1, edge2, diff) {
    diff *= ROAD_WIDTH / 2;
    let R = RADIUS + diff;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    let start = STARTS[edge1].map($ => $ * TILE);
    let end = STARTS[edge2].map($ => $ * TILE);
    let mid = [0, 0];
    switch (edge1) {
        case N:
        case S:
            start[0] += (edge2 == W ? 1 : -1) * diff;
            mid[0] = start[0];
            break;
        case E:
        case W:
            start[1] += (edge2 == N ? 1 : -1) * diff;
            mid[1] = start[1];
            break;
    }
    switch (edge2) {
        case N:
        case S:
            end[0] += (edge1 == W ? 1 : -1) * diff;
            mid[0] = end[0];
            break;
        case E:
        case W:
            end[1] += (edge1 == N ? 1 : -1) * diff;
            mid[1] = end[1];
            break;
    }
    ctx.moveTo(...start);
    ctx.arcTo(mid[0], mid[1], end[0], end[1], R);
    ctx.lineTo(...end);
    ctx.stroke();
}
