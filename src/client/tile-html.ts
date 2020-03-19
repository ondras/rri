import Tile from "../tile.js";
import { get as getShape } from "../shapes.js";
import { get as getTransform } from "../transform.js";

import * as html from "./html.js";
import DrawContext from "./draw-context.js";


let cache = new Map<string, HTMLCanvasElement>();

function createCanvas(id:string) {
	if (!cache.has(id)) {
		let shape = getShape(id);
		let canvas = html.node("canvas");
		let ctx = new DrawContext(canvas);
		shape.render(ctx);
		cache.set(id, canvas);
	}

	return cache.get(id) as HTMLCanvasElement;
}

export default class HTMLTile extends Tile {
	node!: HTMLImageElement;

	set transform(transform: string) {
		super.transform = transform;
		if (!this.node) {
			let canvas = createCanvas(this._sid);
			this.node = html.node("img", {className:"tile", alt:"tile", src:canvas.toDataURL("image/png")});
		}
		this.node.style.transform = getTransform(transform).getCSS();
	}

	get transform() { return super.transform; }

	createCanvas() {
		const source = createCanvas(this._sid);

		const canvas = html.node("canvas", {width:source.width, height:source.height});

		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		getTransform(this._tid).applyToContext(ctx);
		ctx.drawImage(source, 0, 0);

		return canvas;
	}

	clone() { return new HTMLTile(this._sid, this.transform); }

}
