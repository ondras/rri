import Tile from "./tile.js";

export class Cell {
	node: HTMLTableCellElement;
	locked = false;
	x: number;
	y: number;

	_tile!: Tile | null;
	_round: HTMLElement;

	constructor(node: HTMLTableCellElement, x: number, y: number) {
		this.node = node;
		this.x = x;
		this.y = y;
		this._round = document.createElement("div");
		this._round.className = "round";
		this.tile = null;

		this.isCenter() && this._markCenter();
	}

	get tile() { return this._tile; }
	set tile(tile: Tile | null) {
		this._tile = tile;
		this.node.innerHTML = "";
		if (tile) {
			this.node.appendChild(tile.node);
			this.node.appendChild(this._round);
		} else {
			let dummy = document.createElement("div");
			dummy.className = "dummy";
			this.node.appendChild(dummy);
		}
	}

	set signal(signal: boolean) { this.node.classList.toggle("signal", signal); }
	set round(round: string) { this._round.textContent = round; }

	isCenter() {
		if (this.x < 3 || this.x > 5 || this.y < 3 || this.y > 5) { return false; }
		return true;
	}

	_markCenter() {
		this.node.classList.add("center");
		this.x == 3 && this.node.classList.add("left");
		this.x == 5 && this.node.classList.add("right");
		this.y == 3 && this.node.classList.add("top");
		this.y == 5 && this.node.classList.add("bottom");
	}
}

export class BorderCell extends Cell {
	constructor(node: HTMLTableCellElement, x: number, y: number) {
		super(node, x, y);
		this._round.hidden = true;

		this._placeTile(x, y);
	}

	_placeTile(x: number, y: number) {
		switch (true) {
			case (x==2 && y==0):
			case (x==6 && y==0):
				this.tile = new Tile("road-half", "2");
			break;

			case (x==2 && y==8):
			case (x==6 && y==8):
				this.tile = new Tile("road-half", "0");
			break;

			case (x==0 && y==2):
			case (x==0 && y==6):
				this.tile = new Tile("rail-half", "1");
			break;

			case (x==8 && y==2):
			case (x==8 && y==6):
				this.tile = new Tile("rail-half", "-1");
			break;

			case (x==4 && y==0): this.tile = new Tile("rail-half", "2"); break;
			case (x==4 && y==8): this.tile = new Tile("rail-half", "0"); break;
			case (x==0 && y==4): this.tile = new Tile("road-half", "1"); break;
			case (x==8 && y==4): this.tile = new Tile("road-half", "-1"); break;
		}
	}	
}
