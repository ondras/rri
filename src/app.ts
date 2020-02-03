import Board from "./board-canvas.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import { GameType } from "./rules.js";
import { SingleGame } from "./game.js";

const dataset = document.body.dataset;
let board: Board;
let blob: Blob | null = null;

function download(parent: HTMLElement) {
	if (!blob) { return; }

	const href = URL.createObjectURL(blob);

	let a = html.node("a", {href, download:"railroad-ink.png"});
	parent.appendChild(a);
	a.click();
	a.remove();
}

function goIntro() {
	dataset.stage = "intro";

	let newBoard = new Board();

	if (board) {
		board.node.replaceWith(newBoard.node);
	} else {
		const main = document.querySelector("main") as HTMLElement;
		main.appendChild(newBoard.node);
	}

	board = newBoard;
}

async function goGame(type: GameType) {
	const game = new SingleGame(type);
	await game.play(board);

	blob = null;
	blob = await board.toBlob();
}

function init() {
	(document.querySelector("[name=start-normal]") as HTMLElement).addEventListener(DOWN, () => goGame("normal"));
	(document.querySelector("[name=start-lake]") as HTMLElement).addEventListener(DOWN, () => goGame("lake"));
	(document.querySelector("[name=again]") as HTMLElement).addEventListener(DOWN, () => goIntro());
	(document.querySelector("[name=download]") as HTMLElement).addEventListener(DOWN, e => download(e.target as HTMLElement));
	goIntro();
}

init();
