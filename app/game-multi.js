import Game from "./game.js";
import JsonRpc from "./json-rpc.js";
import * as html from "./html.js";
import * as score from "./score.js";
import Round from "./round.js";
const template = document.querySelector("template");
function createRpc(ws) {
    let io = {
        onData(_s) { },
        sendData(s) { ws.send(s); }
    };
    ws.addEventListener("message", e => io.onData(e.data));
    return new JsonRpc(io);
}
function openWebSocket(url) {
    const ws = new WebSocket(url);
    return new Promise((resolve, reject) => {
        ws.addEventListener("open", e => resolve(e.target));
        ws.addEventListener("error", _ => reject(new Error("Cannot connect to server")));
    });
}
export default class MultiGame extends Game {
    constructor(board) {
        super(board);
        this._nodes = {};
        this._state = "";
        this._wait = html.node("p", { className: "wait", hidden: true });
        ["setup", "lobby"].forEach(id => {
            let node = template.content.querySelector(`#multi-${id}`);
            this._nodes[id] = node.cloneNode(true);
        });
        const setup = this._nodes["setup"];
        setup.querySelector("[name=join]").addEventListener("click", _ => this._joinOrCreate());
        setup.querySelector("[name=create-normal]").addEventListener("click", _ => this._joinOrCreate("normal"));
        setup.querySelector("[name=create-lake]").addEventListener("click", _ => this._joinOrCreate("lake"));
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").addEventListener("click", _ => this._start());
    }
    async play() {
        super.play();
        return new Promise(resolve => {
            this._resolve = resolve;
            this._setup();
        });
    }
    async _setup() {
        this._node.innerHTML = "";
        const setup = this._nodes["setup"];
        this._node.appendChild(setup);
        try {
            const ws = await openWebSocket("ws://localhost:1234"); // FIXME
            const rpc = createRpc(ws);
            ws.addEventListener("close", e => this._onClose(e));
            rpc.expose("game-change", () => this._sync());
            rpc.expose("game-destroy", () => {
                alert("The game owner has cancelled the game");
                ws.close();
                this._resolve(false);
            });
            rpc.expose("game-over", (...scores) => {
                this._outro();
                this._showScore(scores);
                ws.close();
                this._resolve(true);
            });
            let quit = html.node("button", {}, "Quit game");
            quit.addEventListener("click", async () => {
                if (!(confirm("Really quit the game?"))) {
                    return;
                }
                await rpc.call("quit-game", []);
                ws.close();
                this._resolve(false);
            });
            this._bonusPool.node.appendChild(quit);
            this._rpc = rpc;
        }
        catch (e) {
            alert(e.message);
            this._resolve(false);
        }
    }
    _onClose(e) {
        if (e.code != 0 && e.code != 1000 && e.code != 1001) {
            alert("Network connection closed");
        }
        this._resolve(false);
    }
    async _joinOrCreate(type) {
        if (!this._rpc) {
            return;
        }
        const setup = this._nodes["setup"];
        let playerName = setup.querySelector("[name=player-name]").value;
        if (!playerName) {
            return alert("Please provide your name");
        }
        let gameName = setup.querySelector("[name=game-name]").value;
        if (!gameName) {
            return alert("Please provide a game name");
        }
        const buttons = setup.querySelectorAll("button");
        buttons.forEach(b => b.disabled = true);
        let args = [gameName, playerName];
        if (type) {
            args.unshift(type);
        }
        try {
            const lobby = this._nodes["lobby"];
            lobby.querySelector("button").disabled = (!type);
            await this._rpc.call(type ? "create-game" : "join-game", args);
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            buttons.forEach(b => b.disabled = false);
        }
    }
    _start() {
        this._rpc && this._rpc.call("start-game", []);
    }
    async _sync() {
        if (!this._rpc) {
            return;
        }
        const response = await this._rpc.call("game-info", []);
        const state = response.state;
        if (state != this._state) {
            this._state = state;
            if (state == "starting") {
                this._node.innerHTML = "";
                this._node.appendChild(this._nodes["lobby"]);
            }
        }
        switch (response.state) {
            case "starting":
                this._updateLobby(response.players);
                break;
            case "playing":
                this._updateRound(response);
                break;
        }
    }
    _updateLobby(players) {
        const lobby = this._nodes["lobby"];
        const list = lobby.querySelector("ul");
        list.innerHTML = "";
        players.forEach(p => {
            let item = html.node("li", {}, p.name);
            list.appendChild(item);
        });
        const button = lobby.querySelector("button");
        button.textContent = (button.disabled ? `Wait for ${players[0].name} to start the game` : "Start the game");
    }
    async _updateRound(response) {
        let waiting = response.players.filter(p => !p.roundEnded).length;
        this._wait.textContent = `Waiting for ${waiting} player${waiting > 1 ? "s" : ""} to end round`;
        if (this._round && response.round == this._round.number) {
            return;
        }
        let number = (this._round ? this._round.number : 0) + 1;
        this._round = new MultiplayerRound(number, this._board, this._bonusPool);
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        this._node.appendChild(this._round.node);
        await this._round.play(response.dice);
        this._wait.hidden = false;
        this._node.appendChild(this._wait);
        let s = this._board.getScore();
        let ns = score.toNetworkScore(s);
        this._rpc && this._rpc.call("end-round", ns);
    }
    _showScore(scores) {
        let s = this._board.getScore();
        this._board.showScore(s);
        const placeholder = document.querySelector("#outro div");
        placeholder.innerHTML = "";
        placeholder.appendChild(score.renderMulti(scores));
    }
}
class MultiplayerRound extends Round {
    _end() {
        super._end();
        this._endButton.disabled = true;
    }
}
