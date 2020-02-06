import Dice from "./dice.js";
import * as html from "./html.js";
import { DOWN_EVENT } from "./conf.js";
const MAX_BONUSES = 3;
export default class Pool {
    constructor() {
        this.node = html.node("div", { className: "pool" });
        this._dices = [];
    }
    get remaining() {
        return this._dices.filter(d => d.type == "plain" && !d.disabled && !d.blocked);
    }
    handleEvent(e) {
        let target = e.currentTarget;
        let dice = this._dices.filter(dice => dice.node == target)[0];
        if (!dice || dice.disabled || dice.blocked) {
            return;
        }
        this.onClick(dice);
    }
    add(dice) {
        this.node.appendChild(dice.node);
        dice.node.addEventListener(DOWN_EVENT, this);
        this._dices.push(dice);
    }
    enable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = false;
        return true;
    }
    disable(dice) {
        if (!this._dices.includes(dice)) {
            return false;
        }
        dice.disabled = true;
        return true;
    }
    pending(dice) {
        this._dices.forEach(d => d.pending = (dice == d));
    }
    onClick(_dice) { }
    sync(board) {
        this._dices.filter(dice => !dice.disabled).forEach(dice => {
            let cells = board.getAvailableCells(dice.tile);
            dice.blocked = (cells.length == 0);
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
            let descriptor = { sid: name, transform: "0", type: "plain" };
            this.add(Dice.fromDescriptor(descriptor));
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
