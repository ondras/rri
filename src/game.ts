import Board from "./board.js";
import Round from "./round.js";
import { BonusPool } from "./pool.js";
import Tile from "./tile.js";
import * as score from "./score.js";

let round: Round | null = null;
let board = new Board();
let bonusPool = new BonusPool();

const MAX_ROUNDS = 2;

document.body.appendChild(bonusPool.node);
document.body.appendChild(board.node);

function onRoundEnd(num: number) {
	board.lock();
	if (num == MAX_ROUNDS) {
		alert("Great! Scoring is currently not implemented. Please count your score yourself ;)");
	} else {
		startRound(num+1);
	}
}

function startRound(num: number) {
	if (round) { round.node.remove(); }
	round = new Round(num, board, bonusPool);

	let parent = board.node.parentNode as HTMLElement;
	parent.insertBefore(round.node, board.node);

	round.onEnd = onRoundEnd;
}

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

startRound(1);

let s = board.getScore();
document.body.appendChild(score.render(s));
