import Board from "../board.ts";


type HTMLBoard = Board & { node: HTMLElement };
let current: HTMLBoard | null = null;

export function showBoard(board: HTMLBoard) {
	if (!board.node) { return; }

	if (current) {
		current.node && current.node.replaceWith(board.node);
	} else {
		const next = document.querySelector("#score") as HTMLElement
		(next.parentNode as HTMLElement).insertBefore(board.node, next);
	}
	current = board;
}
