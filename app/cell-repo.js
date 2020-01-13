import { BOARD } from "./conf.js";
function inBoard(x, y) {
    return (x > 0 && y > 0 && x <= BOARD && y <= BOARD);
}
export default class CellRepo {
    constructor() {
        this._cells = [];
        const tile = null;
        const round = 0;
        for (let y = 0; y < BOARD + 2; y++) {
            let row = [];
            this._cells.push(row);
            for (let x = 0; x < BOARD + 2; x++) {
                let border = !inBoard(x, y);
                let center = (x >= 3 && x <= 5 && y >= 3 && y <= 5);
                let cell = { x, y, border, center, tile, round };
                row.push(cell);
            }
        }
    }
    forEach(cb) {
        this._cells.forEach(row => {
            row.forEach(cell => cb(cell));
        });
    }
    filter(test) {
        let results = [];
        this._cells.forEach(row => {
            row.forEach(cell => {
                test(cell) && results.push(cell);
            });
        });
        return results;
    }
    at(x, y) {
        return this._cells[y][x];
    }
}
