import Tile from "../tile.ts";
import { get as getShape } from "../shapes.ts";
import { get as getTransform } from "../transform.ts";

import * as html from "./html.ts";
import DrawContext from "./draw-context.ts";


interface Visual {
	canvas: HTMLCanvasElement;
	data: string;
}
let cache = new Map<string, Visual>();

function createVisual(id:string) {
	let result: Visual;

	if (cache.has(id)) {
		result = cache.get(id) as Visual;
	} else {
		let shape = getShape(id);
		let canvas = html.node("canvas");
		let ctx = new DrawContext(canvas);
		shape.render(ctx);
		let data = canvas.toDataURL("image/png");
		result = {canvas, data};
		if (id != "forest") { cache.set(id, result); }
	}

	return result;
}

export default class HTMLTile extends Tile {
	node!: HTMLImageElement;
	_visual: Visual;

	constructor(sid: string, tid: string, visual: Visual | null = null) {
		super(sid, tid);

		this._visual = visual || createVisual(this._data.sid);
		this.node = html.node("img", {className:"tile", alt:"tile", src:this._visual.data});
		this._applyTransform();
	}

	get transform() { return super.transform; }
	set transform(transform: string) {
		super.transform = transform;
		this._applyTransform();
	}

	clone() { return new HTMLTile(this._data.sid, this._data.tid, this._visual); }

	createCanvas() {
		const source = this._visual.canvas;

		const canvas = html.node("canvas", {width:source.width, height:source.height});

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		getTransform(this._data.tid).applyToContext(ctx);
		ctx.drawImage(source, 0, 0);

		return canvas;
	}

	_applyTransform() {
		this.node.style.transform = getTransform(this._data.tid).getCSS();
	}
}
