import Board from "./board-canvas.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import { SingleGame, MultiGame } from "./game.js";
const dataset = document.body.dataset;
let board;
let blob = null;
function download(parent) {
    if (!blob) {
        return;
    }
    const href = URL.createObjectURL(blob);
    let a = html.node("a", { href, download: "railroad-ink.png" });
    parent.appendChild(a);
    a.click();
    a.remove();
}
function goIntro() {
    dataset.stage = "intro";
    let newBoard = new Board();
    if (board) {
        board.node.replaceWith(newBoard.node);
    }
    else {
        const main = document.querySelector("main");
        main.appendChild(newBoard.node);
    }
    board = newBoard;
}
async function goGame(type) {
    let game;
    switch (type) {
        case "multi":
            game = new MultiGame();
            break;
        default:
            game = new SingleGame(type);
            break;
    }
    await game.play(board);
    blob = null;
    blob = await board.toBlob();
}
function init() {
    document.querySelector("[name=start-normal]").addEventListener(DOWN, () => goGame("normal"));
    document.querySelector("[name=start-lake]").addEventListener(DOWN, () => goGame("lake"));
    document.querySelector("[name=start-multi]").addEventListener(DOWN, () => goGame("multi"));
    document.querySelector("[name=again]").addEventListener(DOWN, () => goIntro());
    document.querySelector("[name=download]").addEventListener(DOWN, e => download(e.target));
    goIntro();
}
init();
