import Board from "./board.js";
import Round from "./round.js";
import { BonusPool } from "./pool.js";
// import Tile from "./tile.js";
import * as score from "./score.js";
let board = new Board();
let bonusPool = new BonusPool();
const MAX_ROUNDS = 2;
function gameOver() {
    let s = score.render(board.getScore());
    document.body.insertBefore(s, document.body.firstChild);
    while (s.nextSibling && s.nextSibling != board.node) {
        s.nextSibling.remove();
    }
}
async function play() {
    document.body.appendChild(bonusPool.node);
    document.body.appendChild(board.node);
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
play();
