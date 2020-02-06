import Game from "./game.js";
import Round from "./round.js";
import { ROUNDS, createDiceDescriptors } from "./rules.js";
import * as score from "./score.js";
export default class SingleGame extends Game {
    constructor(_board, _type) {
        super(_board);
        this._type = _type;
    }
    async play() {
        super.play();
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        let num = 1;
        while (num <= ROUNDS[this._type]) {
            let round = new Round(num, this._board, this._bonusPool);
            let descriptors = createDiceDescriptors(this._type);
            this._node.appendChild(round.node);
            await round.play(descriptors);
            round.node.remove();
            num++;
        }
        this._outro();
        return true;
    }
    _outro() {
        super._outro();
        let s = this._board.getScore();
        this._board.showScore(s);
        const placeholder = document.querySelector("#outro div");
        placeholder.innerHTML = "";
        placeholder.appendChild(score.renderSingle(s));
    }
}
