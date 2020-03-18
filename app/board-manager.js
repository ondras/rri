let current = null;
export function showBoard(board) {
    if (!board.node) {
        return;
    }
    if (current) {
        current.node && current.node.replaceWith(board.node);
    }
    else {
        let next = document.querySelector("#score");
        next.parentNode.insertBefore(board.node, next);
    }
    current = board;
}
