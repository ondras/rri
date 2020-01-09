import Board from "./board.js";
import Round from "./round.js";
import { BonusPool } from "./pool.js";
import * as score from "./score.js";
import * as html from "./html.js";

let board = new Board();
let bonusPool = new BonusPool();
let menu = html.node("div", {className:"menu"});

const MAX_ROUNDS = 7;

function gameOver() {
	let s = score.render(board.getScore());
	document.body.insertBefore(s, document.body.firstChild);
	while (s.nextSibling && s.nextSibling != board.node) { s.nextSibling.remove(); }
}

async function play() {
	bonusPool.enableAll();
	menu.remove();

	let num = 1;
	let parent = board.node.parentNode as HTMLElement;

	while (num <= MAX_ROUNDS) {
		let round = new Round(num, board, bonusPool);
		parent.insertBefore(round.node, board.node);
		await round.start("");
		round.node.remove();
		num++;
	}

	gameOver();
}

function init() {
	document.body.appendChild(bonusPool.node);
	document.body.appendChild(menu);
	document.body.appendChild(board.node);
	bonusPool.disableAll();

	let start = html.node("button", {}, "Start the game");
	menu.appendChild(start);
	start.addEventListener("pointerdown", () => play());

	menu.appendChild(html.node("span", {className:"rounds"}, `${MAX_ROUNDS}\xa0rounds`));

	menu.appendChild(html.node("span", {className:"dummy"}));
	menu.appendChild(html.node("span", {className:"dummy"}));

	menu.appendChild(html.node("a", {href:"#", target:"_blank"}, "Report issue"));
	menu.appendChild(html.node("a", {href:"#", target:"_blank"}, "Read rules"));
}

init();

/*
// import Tile from "./tile.js";
board.place(new Tile("rail-i", "1"), 1, 2, 0);
board.place(new Tile("road-i", "0"), 2, 1, 0);
board.place(new Tile("bridge", "0"), 2, 2, 0);
board.place(new Tile("cross-rail", "0"), 3, 2, 0);
board.place(new Tile("rail-road-l", "-3"), 2, 3, 0);
board.place(new Tile("cross-rail", "0"), 3, 3, 0);
board.place(new Tile("cross-road-rail-rail-rail", "2"), 4, 3, 0);
board.place(new Tile("cross-rail", "0"), 4, 2, 0);
board.place(new Tile("rail-i", "0"), 4, 1, 0);

board.place(new Tile("cross-road", "0"), 4, 4, 0);
board.place(new Tile("cross-road", "0"), 5, 4, 0);
board.place(new Tile("cross-road", "0"), 6, 4, 0);
board.place(new Tile("cross-road", "0"), 7, 4, 0);
board.place(new Tile("cross-road", "0"), 4, 5, 0);
board.place(new Tile("cross-road", "0"), 6, 5, 0);
board.place(new Tile("cross-road", "0"), 4, 6, 0);
board.place(new Tile("cross-road", "0"), 5, 6, 0);
board.place(new Tile("cross-road", "0"), 6, 6, 0);
board.place(new Tile("rail-road-i", "1"), 7, 6, 0);
*/
