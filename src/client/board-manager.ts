import Board from "../board";


let current: Board | null = null;

export function showBoard(board: Board) {
	if (!board.node) { return; }

	if (current) {
		current.node && current.node.replaceWith(board.node);
	} else {
		let next = document.querySelector("#score") as HTMLElement
		(next.parentNode as HTMLElement).insertBefore(board.node, next);
	}
	current = board;
}
