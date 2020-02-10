import Board from "./board-canvas.js";
import * as html from "./html.js";
import SingleGame from "./game-single.js";
import MultiGame from "./game-multi.js";
const dataset = document.body.dataset;
let board;
function download(parent) {
    if (!board.blob) {
        return;
    }
    const href = URL.createObjectURL(board.blob);
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
    const game = (type == "multi" ? new MultiGame(board) : new SingleGame(board, type));
    let played = await game.play();
    if (!played) {
        goIntro();
    }
}
function init() {
    document.querySelector("[name=start-normal]").addEventListener("click", _ => goGame("normal"));
    document.querySelector("[name=start-lake]").addEventListener("click", _ => goGame("lake"));
    document.querySelector("[name=start-multi]").addEventListener("click", _ => goGame("multi"));
    document.querySelector("[name=again]").addEventListener("click", _ => goIntro());
    document.querySelector("[name=download]").addEventListener("click", e => download(e.target));
    goIntro();
}
init();
