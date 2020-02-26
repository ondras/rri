let current = null;
export function showBoard(board) {
    if (current) {
        current.node.replaceWith(board.node);
    }
    else {
        document.querySelector("main").appendChild(board.node);
    }
    current = board;
}
