import Dice from "./dice.js";
import * as html from "./html.js";
import { DOWN } from "./event.js";
import Tile from "./tile.js";
const MAX_BONUSES = 3;
export default class Pool {
    constructor() {
        this.node = html.node("div", { className: "pool" });
        this._dices = [];
    }
    get remaining() {
        return this._dices.filter(d => d.flag("mandatory") && !d.flag("disabled") && !d.flag("blocked")).length;
    }
    handleEvent(e) {
        let target = e.currentTarget;
        let dice = this._dices.filter(dice => dice.node == target)[0];
        if (!dice || dice.flag("disabled") || dice.flag("blocked")) {
            return;
        }
        this.onClick(dice);
    }
    add(dice) {
        this.node.appendChild(dice.node);
        dice.node.addEventListener(DOWN, this);
        this._dices.push(dice);
    }
    enable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.flag("disabled", false);
        return true;
    }
    disable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.flag("disabled", true);
        return true;
    }
    pending(dice) {
        this._dices.forEach(d => d.flag("pending", dice == d));
    }
    onClick(dice) { console.log(dice); }
    sync(board) {
        this._dices.filter(dice => !dice.flag("disabled")).forEach(dice => {
            let cells = board.getAvailableCells(dice.tile);
            dice.flag("blocked", cells.length == 0);
        });
    }
}
export class BonusPool extends Pool {
    constructor() {
        super();
        this._used = 0;
        this._locked = false;
        this.node.classList.add("bonus");
        ["cross-road-road-rail-road", "cross-road-rail-rail-rail", "cross-road",
            "cross-rail", "cross-road-rail-rail-road", "cross-road-rail-road-rail"].forEach(name => {
            this.add(new Dice(new Tile(name, "0")));
        });
    }
    handleEvent(e) {
        if (this._locked || this._used == MAX_BONUSES) {
            return;
        }
        super.handleEvent(e);
    }
    disable(dice) {
        let disabled = super.disable(dice);
        if (disabled) { // only if disabled, i.e. the tile was ours
            this._used++;
            this._locked = true;
        }
        return disabled;
    }
    enable(dice) {
        let enabled = super.enable(dice);
        if (enabled) {
            this._used--;
            this.unlock();
        }
        return enabled;
    }
    unlock() {
        this._locked = false;
    }
}
