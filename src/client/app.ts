import Board from "./board-canvas.js";
import * as html from "./html.js";
import * as boardManager from "./board-manager.js";
import { GameType } from "../rules.js";
import SingleGame from "./game-single.js";
import MultiGame, { load, save } from "./game-multi.js";

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
	delete dataset.mode;

	board = new Board();
	boardManager.showBoard(board);
}

async function goGame(type: GameType | "multi") {
	if (type != "multi") { dataset.mode = type; }
	const game = (type == "multi" ? new MultiGame(board) : new SingleGame(board, type));
	let played = await game.play();
	if (!played) { goIntro(); }
}

function onClick(name: string, cb: () => void | Promise<void>) {
	(document.querySelector(`[name=${name}]`) as HTMLElement).addEventListener("click", cb);
}

function toggleLiveScore(on: boolean) {
	dataset.liveScore = (on ? "on" : "off");
	save("live-score", on ? "1" : null);
}

function init() {
	const liveScore = document.querySelector("[name=live-score]") as HTMLInputElement;
	liveScore.checked = (load("live-score") == "1");
	liveScore.addEventListener("change", _ => toggleLiveScore(liveScore.checked));
	toggleLiveScore(liveScore.checked);

	onClick("start-normal", () => goGame("normal"));
	onClick("start-lake", () => goGame("lake"));
	onClick("start-river", () => goGame("river"));
	onClick("start-forest", () => goGame("forest"));
	onClick("start-lava", () => goGame("lava"));
	onClick("start-multi", () => goGame("multi"));
	onClick("again", () => goIntro());
	onClick("download", () => download());
	goIntro();
}

init();
