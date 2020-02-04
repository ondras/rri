import Board from "./board-canvas.js";
import * as html from "./html.js";
import { GameType } from "./rules.js";
import SingleGame from "./game-single.js";
import MultiGame from "./game-multi.js";

const dataset = document.body.dataset;
let board: Board;

function download(parent: HTMLElement) {
	if (!board.blob) { return; }

	const href = URL.createObjectURL(board.blob);

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

async function goGame(type: GameType | "multi") {
	const game = (type == "multi" ? new MultiGame() : new SingleGame(type));

	try {
		await game.play(board);
	} catch (e) {
		alert(e.message);
		goIntro();
	}
}

function init() {
	(document.querySelector("[name=start-normal]") as HTMLElement).addEventListener("click", () => goGame("normal"));
	(document.querySelector("[name=start-lake]") as HTMLElement).addEventListener("click", () => goGame("lake"));
	(document.querySelector("[name=start-multi]") as HTMLElement).addEventListener("click", () => goGame("multi"));
	(document.querySelector("[name=again]") as HTMLElement).addEventListener("click", () => goIntro());
	(document.querySelector("[name=download]") as HTMLElement).addEventListener("click", e => download(e.target as HTMLElement));
	goIntro();
}

init();
