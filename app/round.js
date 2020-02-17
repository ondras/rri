import Pool from "./pool.js";
import Dice from "./dice.js";
import * as html from "./html.js";
import { DBLCLICK } from "./conf.js";
export default class Round {
    constructor(number, _board, _bonusPool) {
        this.number = number;
        this._board = _board;
        this._bonusPool = _bonusPool;
        this._pending = null;
        this._endButton = html.node("button");
        this._placedTiles = new Map();
        this._lastClickTs = 0;
        this._pool = new Pool();
        this.node = this._pool.node;
        this._endButton.textContent = `End round #${this.number}`;
        /*
                window.addEventListener("keydown", e => {
                    if (e.ctrlKey && e.key == "a") {
                        e.preventDefault();
                        while (true) {
                            let r = this._pool.remaining;
                            if (!r.length) break;
                            let d = r.shift() as Dice;
                            this._onPoolClick(d);
                            let avail = this._board.getAvailableCells(d.tile);
                            if (!avail.length) break;
                            let cell = avail[Math.floor(Math.random() * avail.length)];
                            this._onBoardClick(cell);
                        }
                    }
                });
        */
    }
    play(descriptors) {
        descriptors.map(d => Dice.fromDescriptor(d)).forEach(dice => this._pool.add(dice));
        this.node.appendChild(this._endButton);
        this._pool.onClick = dice => this._onPoolClick(dice);
        this._bonusPool.onClick = dice => this._onPoolClick(dice);
        this._board.onClick = cell => this._onBoardClick(cell);
        this._syncEnd();
        this._bonusPool.unlock();
        return new Promise(resolve => {
            this._endButton.addEventListener("click", _ => {
                this._end();
                resolve();
            });
        });
    }
    _end() {
        this._board.commit(this.number);
        function noop() { }
        ;
        this._pool.onClick = noop;
        this._bonusPool.onClick = noop;
        this._board.onClick = noop;
    }
    _onPoolClick(dice) {
        if (this._pending == dice) {
            this._pending = null;
            this._board.signal([]);
            this._pool.pending(null);
            this._bonusPool.pending(null);
        }
        else {
            this._pending = dice;
            let available = this._board.getAvailableCells(dice.tile);
            this._board.signal(available);
            this._pool.pending(dice);
            this._bonusPool.pending(dice);
        }
    }
    _onBoardClick(cell) {
        const ts = Date.now();
        if (ts - this._lastClickTs < DBLCLICK) {
            this._tryToRemove(cell);
        }
        else if (this._pending) {
            this._tryToAdd(cell);
        }
        else {
            this._tryToCycle(cell);
            this._lastClickTs = ts;
        }
    }
    _tryToRemove(cell) {
        let tile = cell.tile;
        if (!tile) {
            return;
        }
        let dice = this._placedTiles.get(tile);
        if (!dice) {
            return;
        }
        this._placedTiles.delete(tile);
        this._board.place(null, cell.x, cell.y, 0);
        this._pool.enable(dice);
        this._bonusPool.enable(dice);
        this._syncEnd();
    }
    _tryToAdd(cell) {
        if (!this._pending) {
            return;
        }
        let tile = this._pending.tile;
        let available = this._board.getAvailableCells(tile);
        if (!available.includes(cell)) {
            return false;
        }
        const x = cell.x;
        const y = cell.y;
        const clone = tile.clone();
        this._board.placeBest(clone, x, y, this.number);
        this._board.signal([]);
        this._pool.pending(null);
        this._bonusPool.pending(null);
        this._pool.disable(this._pending);
        this._bonusPool.disable(this._pending);
        this._placedTiles.set(clone, this._pending);
        this._pending = null;
        this._syncEnd();
    }
    _tryToCycle(cell) {
        let tile = cell.tile;
        if (!tile) {
            return;
        }
        if (!this._placedTiles.has(tile)) {
            return;
        }
        this._board.cycleTransform(cell.x, cell.y);
        this._syncEnd();
    }
    _syncEnd() {
        this._pool.sync(this._board);
        this._endButton.disabled = (this._pool.remaining.length > 0);
    }
}
