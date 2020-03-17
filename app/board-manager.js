let current = null;
export function showBoard(board) {
    if (current) {
        current.node.replaceWith(board.node);
    }
    else {
        let next = document.querySelector("#score");
        next.parentNode.insertBefore(board.node, next);
    }
    current = board;
}
