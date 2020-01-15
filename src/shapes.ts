import { Transform, get as getTransform, all as allTransforms } from "./transform.js";
import { N, E, S, W, all as allDirections } from "./direction.js";
import { Edge, NONE, RAIL, ROAD } from "./edge.js";
import DrawContext from "./draw-context.js";
import * as html from "./html.js";

type Edges = [Edge, Edge, Edge, Edge];
interface Shape {
	edges: Edges;
	transforms: Transform[];
	image: HTMLImageElement;
	canvas: HTMLCanvasElement;
}

interface ShapeTemplate {
	edges: Edges;
	render(ctx: DrawContext): void;
}

const repo: {[id:string]: Shape} = {};
const templates: {[id:string]: ShapeTemplate} = {
	"rail-half": {
		edges: [
			{type:RAIL, connects: []},
			{type:NONE, connects: []},
			{type:NONE, connects: []},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 0.35);
			ctx.redGlow(N);
		}
	},

	"road-half": {
		edges: [
			{type:ROAD, connects: []},
			{type:NONE, connects: []},
			{type:NONE, connects: []},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.35);
			ctx.redGlow(N);
		}
	},

	"rail-i": {
		edges: [
			{type:RAIL, connects: [S]},
			{type:NONE, connects: []},
			{type:RAIL, connects: [N]},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 1);
		}
	},

	"road-i": {
		edges: [
			{type:ROAD, connects: [S]},
			{type:NONE, connects: []},
			{type:ROAD, connects: [N]},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.5);
			ctx.road(S, 0.5);
		}
	},

	"rail-t": {
		edges: [
			{type:RAIL, connects: [E, W]},
			{type:RAIL, connects: [N, W]},
			{type:NONE, connects: []},
			{type:RAIL, connects: [N, E]}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 0.5);
			ctx.rail(E, 0.5);
			ctx.rail(W, 0.5);
			ctx.railCross();
		}
	},

	"road-t": {
		edges: [
			{type:ROAD, connects: [E, W]},
			{type:ROAD, connects: [N, W]},
			{type:NONE, connects: []},
			{type:ROAD, connects: [N, E]}
		],

		render(ctx: DrawContext) {
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
			{type:RAIL, connects: [E]},
			{type:RAIL, connects: [N]},
			{type:NONE, connects: []},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.arc(E, 0);
			ctx.styleRailTicks([1, 7], -3);
			ctx.arc(E, 0);
		}
	},

	"road-l": {
		edges: [
			{type:ROAD, connects: [E]},
			{type:ROAD, connects: [N]},
			{type:NONE, connects: []},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.arc(E, -1);
			ctx.arc(E, 1);

			ctx.styleRoadTicks([7, 4], -3);
			ctx.arc(E, 0);
		}
	},

	"rail-road-l": {
		edges: [
			{type:RAIL, connects: [E]},
			{type:ROAD, connects: [N]},
			{type:NONE, connects: []},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 0.5);
			ctx.road(E, 0.5);
			ctx.station();
		}
	},

	"rail-road-i": {
		edges: [
			{type:RAIL, connects: [S]},
			{type:NONE, connects: []},
			{type:ROAD, connects: [N]},
			{type:NONE, connects: []}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 0.5);
			ctx.road(S, 0.5);
			ctx.station();
		}
	},

	"bridge": {
		edges: [
			{type:ROAD, connects: [S]},
			{type:RAIL, connects: [W]},
			{type:ROAD, connects: [N]},
			{type:RAIL, connects: [E]}
		],

		render(ctx: DrawContext) {
			ctx.rail(E, 0.5);
			ctx.rail(W, 0.5);
			ctx.road(N, 0.5);
			ctx.road(S, 0.5);
		}
	},

	"cross-road-road-rail-road": {
		edges: [
			{type:ROAD, connects: [S, E, W]},
			{type:ROAD, connects: [N, S, W]},
			{type:RAIL, connects: [N, E, W]},
			{type:ROAD, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.5);
			ctx.road(E, 0.5);
			ctx.rail(S, 0.5);
			ctx.road(W, 0.5);
			ctx.station();
		}
	},

	"cross-road-rail-rail-rail": {
		edges: [
			{type:ROAD, connects: [S, E, W]},
			{type:RAIL, connects: [N, S, W]},
			{type:RAIL, connects: [N, E, W]},
			{type:RAIL, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.5);
			ctx.rail(E, 0.5);
			ctx.rail(S, 0.5);
			ctx.rail(W, 0.5);
			ctx.station();
		}
	},

	"cross-road-rail-rail-road": {
		edges: [
			{type:ROAD, connects: [S, E, W]},
			{type:RAIL, connects: [N, S, W]},
			{type:RAIL, connects: [N, E, W]},
			{type:ROAD, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.5);
			ctx.rail(E, 0.5);
			ctx.rail(S, 0.5);
			ctx.road(W, 0.5);
			ctx.station();
		}
	},

	"cross-road-rail-road-rail": {
		edges: [
			{type:ROAD, connects: [S, E, W]},
			{type:RAIL, connects: [N, S, W]},
			{type:ROAD, connects: [N, E, W]},
			{type:RAIL, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.road(N, 0.5);
			ctx.rail(E, 0.5);
			ctx.road(S, 0.5);
			ctx.rail(W, 0.5);
			ctx.station();
		}
	},

	"cross-rail": {
		edges: [
			{type:RAIL, connects: [S, E, W]},
			{type:RAIL, connects: [N, S, W]},
			{type:RAIL, connects: [N, E, W]},
			{type:RAIL, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.rail(N, 0.5);
			ctx.rail(E, 0.5);
			ctx.rail(S, 0.5);
			ctx.rail(W, 0.5);
			ctx.railCross();
		}
	},

	"cross-road": {
		edges: [
			{type:ROAD, connects: [S, E, W]},
			{type:ROAD, connects: [N, S, W]},
			{type:ROAD, connects: [N, E, W]},
			{type:ROAD, connects: [N, E, S]}
		],

		render(ctx: DrawContext) {
			ctx.arc(N, -1);
			ctx.arc(E, -1);
			ctx.arc(S, -1);
			ctx.arc(W, -1);
			ctx.roadTicks(N, 0.5);
			ctx.roadTicks(E, 0.5);
			ctx.roadTicks(S, 0.5);
			ctx.roadTicks(W, 0.5);
		}
	}
};

export function get(id: string) {
	if (!(id in repo)) { throw new Error(`Shape ${id} not found`); }
	return repo[id];
}

function getTransforms(edges: Edges) {
	let cache = new Set();
	function filter(t: Transform) {
		let transform = getTransform(t);

		let key = allDirections.map(d => {
			d = transform.apply(d);
			return edges[d].type;
		}).join("/");

		if (cache.has(key)) { return false; }
		cache.add(key);
		return true;
	};
	return allTransforms.filter(filter);
}

function shapeFromTemplate(template: ShapeTemplate) {
	let canvas = html.node("canvas");
	let ctx = new DrawContext(canvas);
	template.render(ctx);

	let image = html.node("img", {src:canvas.toDataURL("image/png")});

	return {
		edges: template.edges,
		transforms: getTransforms(template.edges),
		canvas,
		image
	}
}


Object.entries(templates).forEach(([k, v]) => repo[k] = shapeFromTemplate(v));
