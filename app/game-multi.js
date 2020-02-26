import Game from "./game.js";
import JsonRpc from "./json-rpc.js";
import Round from "./round.js";
import BoardCanvas from "./board-canvas.js";
import * as html from "./html.js";
import * as score from "./score.js";
import * as conf from "./conf.js";
import * as boardManager from "./board-manager.js";
export default class MultiGame extends Game {
    constructor(board) {
        super(board);
        this._nodes = {};
        this._progress = {
            key: "",
            game: "",
            player: ""
        };
        this._wait = html.node("p", { className: "wait", hidden: true });
        const template = document.querySelector("template");
        ["setup", "lobby"].forEach(id => {
            let node = template.content.querySelector(`#multi-${id}`);
            this._nodes[id] = node.cloneNode(true);
        });
        const setup = this._nodes["setup"];
        setup.querySelector("[name=join]").addEventListener("click", _ => this._joinOrCreate());
        setup.querySelector("[name=continue]").addEventListener("click", _ => this._continue());
        setup.querySelector("[name=create-normal]").addEventListener("click", _ => this._joinOrCreate("normal"));
        setup.querySelector("[name=create-lake]").addEventListener("click", _ => this._joinOrCreate("lake"));
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").addEventListener("click", _ => this._rpc.call("start-game", []));
    }
    async play() {
        super.play();
        return new Promise(resolve => {
            this._resolve = resolve;
            this._setup();
        });
    }
    _setup() {
        const setup = this._nodes["setup"];
        this._node.innerHTML = "";
        this._node.appendChild(setup);
        ["player", "game"].forEach(key => {
            let value = load(key);
            if (value === null) {
                return;
            }
            let input = setup.querySelector(`[name=${key}-name]`);
            input.value = value;
        });
        let cont = setup.querySelector(`[name=continue]`);
        cont.parentNode.hidden = (load("progress") === null);
    }
    _onClose(e) {
        if (e.code != 0 && e.code != 1000 && e.code != 1001) {
            alert("Network connection closed");
        }
        this._resolve(false);
    }
    async _connectRPC() {
        const url = new URL(location.href).searchParams.get("url") || conf.SERVER;
        const ws = await openWebSocket(url);
        const rpc = createRpc(ws);
        ws.addEventListener("close", e => this._onClose(e));
        rpc.expose("game-change", () => this._sync());
        rpc.expose("game-destroy", () => {
            alert("The game has been cancelled");
            ws.close();
            this._resolve(false);
        });
        rpc.expose("game-over", (...players) => {
            save("progress", null);
            this._outro();
            this._showScore(players);
            ws.close();
            this._resolve(true);
        });
        let quit = html.node("button", {}, "Quit game");
        quit.addEventListener("click", async (_) => {
            if (!(confirm("Really quit the game?"))) {
                return;
            }
            save("progress", null);
            await rpc.call("quit-game", []);
            ws.close();
            this._resolve(false);
        });
        this._bonusPool.node.appendChild(quit);
        this._rpc = rpc;
        return rpc;
    }
    async _joinOrCreate(type) {
        const setup = this._nodes["setup"];
        const buttons = setup.querySelectorAll("button");
        let playerName = setup.querySelector("[name=player-name]").value;
        if (!playerName) {
            return alert("Please provide your name");
        }
        let gameName = setup.querySelector("[name=game-name]").value;
        if (!gameName) {
            return alert("Please provide a game name");
        }
        save("player", playerName);
        save("game", gameName);
        buttons.forEach(b => b.disabled = true);
        try {
            const rpc = await this._connectRPC();
            let args = [gameName, playerName];
            if (type) {
                args.unshift(type);
            }
            const key = await rpc.call(type ? "create-game" : "join-game", args);
            this._progress.player = playerName;
            this._progress.game = gameName;
            this._progress.key = key;
            this._enterLobby(type);
        }
        catch (e) {
            alert(e.message);
            this._resolve(false);
        }
        finally {
            buttons.forEach(b => b.disabled = false);
        }
    }
    async _continue() {
        const saved = JSON.parse(load("progress") || "");
        try {
            this._progress.player = saved.player;
            this._progress.game = saved.game;
            this._progress.key = saved.key;
            let rpc = await this._connectRPC();
            let state = await rpc.call("continue-game", [saved.game, saved.key]);
            state.board && this._board.fromJSON(state.board);
            state.bonusPool && this._bonusPool.fromJSON(state.bonusPool);
            this._sync();
        }
        catch (e) {
            save("progress", null);
            alert(e.message);
            this._resolve(false);
        }
    }
    async _sync() {
        const response = await this._rpc.call("game-info", []);
        switch (response.state) {
            case "starting":
                this._updateLobby(response.players);
                break;
            case "playing":
                this._updateRound(response);
                break;
        }
    }
    _enterLobby(type) {
        const lobby = this._nodes["lobby"];
        lobby.querySelector("button").disabled = (!type);
        this._node.innerHTML = "";
        this._node.appendChild(lobby);
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
    _updateRound(response) {
        let waiting = response.players.filter(p => !p.roundEnded).length;
        this._wait.textContent = `Waiting for ${waiting} player${waiting > 1 ? "s" : ""} to end round`;
        const ended = response.players.filter(p => p.name == this._progress.player)[0].roundEnded;
        this._wait.hidden = !ended;
        const round = this._progress.round;
        if (round && round.number == response.round) {
            ended && round.end();
        }
        else {
            this._newRound(response, ended);
        }
        this._saveProgress();
    }
    async _newRound(response, ended) {
        const round = new MultiplayerRound(response.round, this._board, this._bonusPool);
        this._progress.round = round;
        this._node.innerHTML = "";
        this._node.appendChild(this._bonusPool.node);
        this._node.appendChild(round.node);
        this._node.appendChild(this._wait);
        let promise = round.play(response.dice);
        if (ended) {
            round.end();
        }
        else {
            await promise;
            const state = {
                board: this._board.toJSON(),
                bonusPool: this._bonusPool.toJSON()
            };
            this._rpc.call("end-round", state);
        }
    }
    _showScore(players) {
        let s = this._board.getScore();
        this._board.showScore(s);
        const placeholder = document.querySelector("#outro div");
        placeholder.innerHTML = "";
        let names = players.map(p => p.name);
        let boards = players.map(p => new BoardCanvas().fromJSON(p.board));
        let scores = boards.map(b => b.getScore());
        boards.forEach((b, i) => b.showScore(scores[i]));
        const player = this._progress.player;
        function showByIndex(i) { boardManager.showBoard(boards[i]); }
        placeholder.appendChild(score.renderMulti(names, scores, showByIndex, player));
    }
    _saveProgress() {
        const progress = {
            key: this._progress.key,
            game: this._progress.game,
            player: this._progress.player
        };
        save("progress", JSON.stringify(progress));
    }
}
class MultiplayerRound extends Round {
    play(descriptors) {
        try {
            navigator.vibrate(200);
        }
        catch (e) { }
        return super.play(descriptors);
    }
    end() {
        this._endButton.disabled = true;
        this._pool.remaining.forEach(d => this._pool.disable(d));
    }
    _end() {
        super._end();
        this.end();
    }
}
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
function save(key, value) {
    key = `rri-${key}`;
    try {
        (value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
    }
    catch (e) {
        console.warn(e);
    }
}
function load(key) {
    try {
        return localStorage.getItem(`rri-${key}`);
    }
    catch (e) {
        console.warn(e);
        return null;
    }
}
