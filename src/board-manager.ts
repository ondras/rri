import Board from "./board";

let current: Board | null = null;

export function showBoard(board: Board) {
	if (current) {
		current.node.replaceWith(board.node);
	} else {
		(document.querySelector("main") as HTMLElement).appendChild(board.node);
	}
	current = board;
}
