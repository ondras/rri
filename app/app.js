import Board from "./board-canvas.js";
import Round from "./round.js";
import { BonusPool } from "./pool.js";
import * as score from "./score.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
// import Tile from "./tile.js";
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
async function goOutro() {
    dataset.stage = "outro";
    if (!board) {
        return;
    }
    let s = board.getScore();
    board.showScore(s);
    const placeholder = document.querySelector("#outro div");
    placeholder.innerHTML = "";
    placeholder.appendChild(score.render(s));
    blob = null;
    blob = await board.toBlob();
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
    dataset.stage = "game";
    if (!board) {
        return;
    }
    const maxRounds = (type == "normal" ? 7 : 6);
    const parent = document.querySelector("#game");
    parent.innerHTML = "";
    const bonusPool = new BonusPool();
    parent.appendChild(bonusPool.node);
    let num = 1;
    while (num <= maxRounds) {
        let round = new Round(num, board, bonusPool);
        parent.appendChild(round.node);
        await round.start(type);
        round.end();
        round.node.remove();
        num++;
    }
    goOutro();
}
function init() {
    document.querySelector("[name=start-normal]").addEventListener(DOWN, () => goGame("normal"));
    document.querySelector("[name=start-lake]").addEventListener(DOWN, () => goGame("lake"));
    document.querySelector("[name=again]").addEventListener(DOWN, () => goIntro());
    document.querySelector("[name=download]").addEventListener(DOWN, e => download(e.target));
    goIntro();
    /**
    if (!board) return;

    board.place(new Tile("lake-rail", "1"), 1, 2, 0);
    board.place(new Tile("lake-road", "2"), 2, 1, 0);
    board.place(new Tile("lake-3", "0"), 2, 2, 0);
    /*
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
    //board.place(new Tile("cross-road", "0"), 4, 6, 0);
    board.place(new Tile("road-l", "0"), 4, 6, 0);
    board.place(new Tile("cross-road", "0"), 5, 6, 0);
    board.place(new Tile("cross-road", "0"), 6, 6, 0);
    board.place(new Tile("rail-road-i", "1"), 7, 6, 0);
    *
    board.commit(0);

    console.log(board.getScore());
    /**/
}
init();
