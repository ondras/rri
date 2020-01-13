import Board from "./board-canvas.js";
import Round from "./round.js";
import { BonusPool } from "./pool.js";
import * as score from "./score.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
//import Tile from "./tile.js";
const main = document.querySelector("main");
let board = new Board();
let bonusPool = new BonusPool();
let menu = html.node("div", { className: "menu" });
const MAX_ROUNDS = 7;
function gameOver() {
    let s = score.render(board.getScore());
    main.insertBefore(s, main.firstChild);
    while (s.nextSibling && s.nextSibling != board.node) {
        s.nextSibling.remove();
    }
}
async function play() {
    bonusPool.enableAll();
    menu.remove();
    let num = 1;
    let parent = board.node.parentNode;
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
    main.appendChild(bonusPool.node);
    main.appendChild(menu);
    main.appendChild(board.node);
    bonusPool.disableAll();
    let start = html.node("button", {}, "Start the game");
    menu.appendChild(start);
    start.addEventListener(DOWN, () => play());
    menu.appendChild(html.node("span", { className: "rounds" }, `Rounds: ${MAX_ROUNDS}`));
    menu.appendChild(html.node("span", { className: "dummy" }));
    menu.appendChild(html.node("span", { className: "dummy" }));
    menu.appendChild(html.node("a", { href: "https://github.com/ondras/rri/issues", target: "_blank" }, "Report issue"));
    menu.appendChild(html.node("a", { href: "https://www.horrible-games.com/wp-content/uploads/2018/07/RRI_BLU_Rulebook_ENG_v05_light.pdf", target: "_blank" }, "Read rules"));
}
init();
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
board.place(new Tile("cross-road", "0"), 4, 6, 0);
board.place(new Tile("cross-road", "0"), 5, 6, 0);
board.place(new Tile("cross-road", "0"), 6, 6, 0);
board.place(new Tile("rail-road-i", "1"), 7, 6, 0);
*/
