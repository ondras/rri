import Board from "./board-canvas.js";
import * as html from "./html.js";
import * as boardManager from "./board-manager.js";
import { GameType } from "./rules.js";
import SingleGame from "./game-single.js";
import MultiGame from "./game-multi.js";

const dataset = document.body.dataset;
let board: Board;

function download() {
	if (!board.blob) { return; }

	const href = URL.createObjectURL(board.blob);

	let a = html.node("a", {href, download:"railroad-ink.png"});
	document.body.appendChild(a);
	a.click();
	a.remove();
}

function goIntro() {
	dataset.stage = "intro";

	board = new Board();
	boardManager.showBoard(board);
}

async function goGame(type: GameType | "multi") {
	const game = (type == "multi" ? new MultiGame(board) : new SingleGame(board, type));
	let played = await game.play();
	if (!played) { goIntro(); }
}

function init() {
	(document.querySelector("[name=start-normal]") as HTMLElement).addEventListener("click", _ => goGame("normal"));
	(document.querySelector("[name=start-lake]") as HTMLElement).addEventListener("click", _ => goGame("lake"));
	(document.querySelector("[name=start-multi]") as HTMLElement).addEventListener("click", _ => goGame("multi"));
	(document.querySelector("[name=again]") as HTMLElement).addEventListener("click", _ => goIntro());
	(document.querySelector("[name=download]") as HTMLElement).addEventListener("click", _ => download());
	goIntro();
}

init();
