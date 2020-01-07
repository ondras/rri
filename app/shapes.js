import { get as getTransform, all as allTransforms } from "./transform.js";
import { N, E, S, W, all as allDirections } from "./direction.js";
import { NONE, RAIL, ROAD } from "./edge.js";
import * as draw from "./draw.js";
import { TILE } from "./conf.js";
const repo = {};
const templates = {
    "rail-half": {
        edges: [
            { type: RAIL, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] },
            { type: NONE, connects: [] }
        ],
        render(ctx) {
            draw.rail(ctx, N, 0.35);
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
            draw.road(ctx, N, 0.35);
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
            draw.rail(ctx, N, 1);
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
            draw.road(ctx, N, 0.5);
            draw.road(ctx, S, 0.5);
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
            draw.rail(ctx, N, 0.5);
            draw.rail(ctx, E, 0.5);
            draw.rail(ctx, W, 0.5);
            draw.railCross(ctx);
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
            draw.arc(ctx, N, E, -1);
            draw.arc(ctx, N, W, -1);
            draw.roadTicks(ctx, N, 0.5);
            draw.roadTicks(ctx, E, 0.5);
            draw.roadTicks(ctx, W, 0.5);
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
            draw.arc(ctx, N, E, 0);
            draw.railTicks(ctx, N, 0.5);
            draw.railTicks(ctx, E, 0.5);
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
            draw.arc(ctx, N, E, -1);
            draw.arc(ctx, N, E, 1);
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
            draw.rail(ctx, N, 0.5);
            draw.road(ctx, E, 0.5);
            draw.station(ctx);
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
            draw.rail(ctx, N, 0.5);
            draw.road(ctx, S, 0.5);
            draw.station(ctx);
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
            draw.rail(ctx, E, 0.5);
            draw.rail(ctx, W, 0.5);
            draw.road(ctx, N, 0.5);
            draw.road(ctx, S, 0.5);
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
            draw.road(ctx, N, 0.5);
            draw.road(ctx, E, 0.5);
            draw.rail(ctx, S, 0.5);
            draw.road(ctx, W, 0.5);
            draw.station(ctx);
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
            draw.road(ctx, N, 0.5);
            draw.rail(ctx, E, 0.5);
            draw.rail(ctx, S, 0.5);
            draw.rail(ctx, W, 0.5);
            draw.station(ctx);
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
            draw.road(ctx, N, 0.5);
            draw.rail(ctx, E, 0.5);
            draw.rail(ctx, S, 0.5);
            draw.road(ctx, W, 0.5);
            draw.station(ctx);
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
            draw.road(ctx, N, 0.5);
            draw.rail(ctx, E, 0.5);
            draw.road(ctx, S, 0.5);
            draw.rail(ctx, W, 0.5);
            draw.station(ctx);
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
            draw.rail(ctx, N, 0.5);
            draw.rail(ctx, E, 0.5);
            draw.rail(ctx, S, 0.5);
            draw.rail(ctx, W, 0.5);
            draw.railCross(ctx);
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
            draw.arc(ctx, N, E, -1);
            draw.arc(ctx, N, W, -1);
            draw.arc(ctx, S, E, -1);
            draw.arc(ctx, S, W, -1);
            draw.roadTicks(ctx, N, 0.5);
            draw.roadTicks(ctx, E, 0.5);
            draw.roadTicks(ctx, S, 0.5);
            draw.roadTicks(ctx, W, 0.5);
        }
    }
};
export function get(id) {
    if (!(id in repo)) {
        throw new Error(`Shape ${id} not found`);
    }
    return repo[id];
}
function getTransforms(edges) {
    let cache = new Set();
    function filter(t) {
        let transform = getTransform(t);
        let key = allDirections.map(d => {
            d = transform.apply(d);
            return edges[d].type;
        }).join("/");
        if (cache.has(key)) {
            return false;
        }
        cache.add(key);
        return true;
    }
    ;
    return allTransforms.filter(filter);
}
function shapeFromTemplate(template) {
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = TILE * devicePixelRatio;
    let ctx = canvas.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);
    template.render(ctx);
    let node = new Image();
    node.src = canvas.toDataURL("image/png");
    return {
        edges: template.edges,
        transforms: getTransforms(template.edges),
        node
    };
}
Object.entries(templates).forEach(([k, v]) => repo[k] = shapeFromTemplate(v));
document.body.style.setProperty("--cell-size", TILE.toString());
window.repo = repo;
