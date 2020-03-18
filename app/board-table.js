import Tile from "./tile-html.js";
import Board from "./board.js";
import * as html from "./html.js";
import { TILE, DOWN_EVENT } from "./conf.js";
export default class BoardTable extends Board {
    constructor() {
        super(Tile);
        this.node.addEventListener(DOWN_EVENT, this);
    }
    handleEvent(e) {
        switch (e.type) {
            case DOWN_EVENT:
                let td = e.target.closest("td");
                if (!td) {
                    return;
                }
                let cell = this._cellByNode(td);
                cell && this.onClick(cell);
                break;
        }
    }
    place(tile, x, y, round) {
        super.place(tile, x, y, round);
        let td = this._tableCellAt(x, y);
        td.innerHTML = "";
        if (tile) {
            td.appendChild(tile.node);
            round && td.appendChild(html.node("div", { className: "round" }, round.toString()));
        }
        else {
            td.appendChild(html.node("div", { className: "dummy" }));
        }
    }
    signal(cells) {
        this._cells.forEach(cell => {
            let td = this._tableCellAt(cell.x, cell.y);
            td.classList.toggle("signal", cells.includes(cell));
        });
    }
    _build() {
        let table = html.node("table", { className: "board" });
        this._cells.forEach(cell => {
            while (table.rows.length <= cell.y) {
                table.insertRow();
            }
            let row = table.rows[cell.y];
            while (row.cells.length <= cell.x) {
                row.insertCell();
            }
            let td = row.cells[cell.x];
            if (cell.center) {
                td.classList.add("center");
                td.classList.toggle("left", cell.x == 3);
                td.classList.toggle("right", cell.x == 5);
                td.classList.toggle("top", cell.y == 3);
                td.classList.toggle("bottom", cell.y == 5);
            }
        });
        const width = 9 * TILE + 8 + 2 * 3;
        document.body.style.setProperty("--board-width", `${width}px`);
        return table;
    }
    _tableCellAt(x, y) {
        return this.node.rows[y].cells[x];
    }
    _cellByNode(node) {
        return this._cells.filter(cell => {
            let td = this._tableCellAt(cell.x, cell.y);
            return (td == node);
        })[0];
    }
}
