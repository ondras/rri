import { GameType } from "../rules.ts";
import Board, { SerializedBoard } from "../board.ts";
import { DiceData } from "../dice.ts";
import { sum as sumScore } from "../score.ts";

import Game from "./game.ts";
import JsonRpc from "./json-rpc.ts";
import Round from "./round.ts";
import BoardCanvas from "./board-canvas.ts";
import HTMLDice from "./html-dice.ts";
import * as html from "./html.ts";
import * as scoreTable from "./score-table.ts";
import * as conf from "./conf.ts";
import * as boardManager from "./board-manager.ts";


type GameState = "" | "starting" | "playing";

interface Player {
	name: string;
	roundEnded: boolean;
	board: SerializedBoard;
}

interface Response {
	state: GameState;
	round: number;
	dice: DiceData[];
	players: Player[];
}

interface Progress {
	key: string;
	game: string;
	player: string;
	round?: MultiplayerRound
}

export default class MultiGame extends Game {
	_nodes: Record<string, Element> = {};
	_rpc!: JsonRpc;
	_resolve!: (result: boolean) => void;
	_progress: Progress = {
		key: "",
		game: "",
		player: ""
	};
	_wait = html.node("p", {className:"wait", hidden:true});
	_currentScore = html.node("span");

	constructor(board: Board) {
		super(board);

		const template = document.querySelector("template") as HTMLTemplateElement;
		["setup", "lobby"].forEach(id => {
			let node = template.content.querySelector(`#multi-${id}`) as HTMLElement;
			this._nodes[id] = node.cloneNode(true) as HTMLElement;
		});

		const setup = this._nodes["setup"];
		(setup.querySelector("[name=join]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate());
		(setup.querySelector("[name=continue]") as HTMLElement).addEventListener("click", _ => this._continue());
		(setup.querySelector("[name=create-normal]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate("normal"));
		(setup.querySelector("[name=create-lake]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate("lake"));
		(setup.querySelector("[name=create-forest]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate("forest"));

		const lobby = this._nodes["lobby"];
		(lobby.querySelector("button") as HTMLElement).addEventListener("click", _ => this._rpc.call("start-game", []));
	}

	async play() {
		super.play();

		return new Promise<boolean>(resolve => {
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
			if (value === null) { return; }
			let input = setup.querySelector(`[name=${key}-name]`) as HTMLInputElement;
			input.value = value;
		});

		let cont = setup.querySelector(`[name=continue]`) as HTMLElement;
		(cont.parentNode as HTMLElement).hidden = (load("progress") === null);
	}

	_onClose(e: CloseEvent) {
		if (e.code != 0 && e.code != 1000 && e.code != 1001) { alert("Network connection closed"); }
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

		rpc.expose("game-over", (...players: Player[]) => {
			save("progress", null);
			this._outro();
			this._showScore(players);
			ws.close();
			this._resolve(true);
		});

		let quit = html.node("button", {}, "Quit game");
		quit.addEventListener("click", async _ => {
			if (!(confirm("Really quit the game?"))) { return; }
			save("progress", null);
			await rpc.call("quit-game", []);
			ws.close();
			this._resolve(false);
		});
		this._bonusPool.node.appendChild(quit);

		this._rpc = rpc;
		return rpc;
	}

	async _joinOrCreate(type?: GameType) {
		const setup = this._nodes["setup"];
		const buttons = setup.querySelectorAll<HTMLButtonElement>("button");

		let playerName = (setup.querySelector("[name=player-name]") as HTMLInputElement).value;
		if (!playerName) { return alert("Please provide your name"); }
		let gameName = (setup.querySelector("[name=game-name]") as HTMLInputElement).value;
		if (!gameName) { return alert("Please provide a game name"); }

		save("player", playerName);
		save("game", gameName);

		buttons.forEach(b => b.disabled = true);
		try {
			const rpc = await this._connectRPC();

			let args = [gameName, playerName];
			if (type) { args.unshift(type); }
			const key = await rpc.call(type ? "create-game" : "join-game", args);

			this._progress.player = playerName;
			this._progress.game = gameName;
			this._progress.key = key;

			this._enterLobby(type);
		} catch (e) {
			alert(e.message);
			this._resolve(false);
		} finally {
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
		} catch (e) {
			save("progress", null);
			alert(e.message);
			this._resolve(false);
		}
	}

	async _sync() {
		const response: Response = await this._rpc.call("game-info", []);
		switch (response.state) {
			case "starting": this._updateLobby(response.players); break;
			case "playing": this._updateRound(response); break;
		}
	}

	_enterLobby(type?: GameType) {
		const lobby = this._nodes["lobby"];

		(lobby.querySelector("button") as HTMLButtonElement).disabled = (!type);
		this._node.innerHTML = "";
		this._node.appendChild(lobby);
	}

	_updateLobby(players: Player[]) {
		const lobby = this._nodes["lobby"];
		const list = lobby.querySelector("ul") as HTMLElement;
		list.innerHTML = "";
		players.forEach(p => {
			let item = html.node("li", {}, p.name);
			list.appendChild(item);
		});

		const button = lobby.querySelector("button") as HTMLButtonElement;
		button.textContent = (button.disabled ? `Wait for ${players[0].name} to start the game` : "Start the game");
	}

	_updateRound(response: Response) {
		let waiting = response.players.filter(p => !p.roundEnded).length;
		let suffix = (waiting>1 ? "s" : "");
		this._wait.textContent = `Waiting for ${waiting} player${suffix} to end round. `;
		this._wait.appendChild(this._currentScore);

		const ended = response.players.filter(p => p.name == this._progress.player)[0].roundEnded;
		this._wait.hidden = !ended;

		const round = this._progress.round;

		if (round && round.number == response.round) {
			ended && round.end();
		} else {
			this._newRound(response, ended);
		}
		this._saveProgress();
	}

	async _newRound(response: Response, ended: boolean) {
		const round = new MultiplayerRound(response.round, this._board, this._bonusPool);
		this._progress.round = round;

		this._node.innerHTML = "";
		this._node.appendChild(this._bonusPool.node);
		this._node.appendChild(round.node);
		this._node.appendChild(this._wait);

		let dice = response.dice.map(data => HTMLDice.fromJSON(data));
		let promise = round.play(dice);
		if (ended) {
			round.end();
		} else {
			await promise;
			const state = {
				board: this._board.toJSON(),
				bonusPool: this._bonusPool.toJSON()
			}
			this._rpc.call("end-round", state);

			let button = html.node("button", {}, "Show my current score");
			button.addEventListener("click", _ => {
				let s = this._board.getScore();
				this._currentScore.innerHTML = `My current score is <strong>${sumScore(s)}<strong>.`;
			});
			this._currentScore.innerHTML = "";
			this._currentScore.appendChild(button);
		}
	}

	_showScore(players: Player[]) {
		let s = this._board.getScore();
		this._board.showScore(s);

		const parent = document.querySelector("#score") as HTMLElement;
		parent.innerHTML = "";

		let names  = players.map(p => p.name);
		let boards = players.map(p => new BoardCanvas().fromJSON(p.board));
		let scores = boards.map(b => b.getScore());
		boards.forEach((b, i) => b.showScore(scores[i]));

		const player = this._progress.player;
		function showByIndex(i: number) { boardManager.showBoard(boards[i]); }
		parent.appendChild(scoreTable.renderMulti(names, scores, showByIndex, player));
	}

	_saveProgress() {
		const progress = {
			key: this._progress.key,
			game: this._progress.game,
			player: this._progress.player
		}
		save("progress", JSON.stringify(progress));
	}
}

class MultiplayerRound extends Round {
	play(dice: HTMLDice[]) {
		try { navigator.vibrate(200); } catch (e) {}
		return super.play(dice);
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

function createRpc(ws: WebSocket) {
	let io = {
		onData(_s:string) {},
		sendData(s:string) { ws.send(s); }
	}
	ws.addEventListener("message", e => io.onData(e.data));
	return new JsonRpc(io);
}

function openWebSocket(url: string): Promise<WebSocket> {
	const ws = new WebSocket(url);
	return new Promise((resolve, reject) => {
		ws.addEventListener("open", e => resolve(e.target as WebSocket));
		ws.addEventListener("error", _ => reject(new Error("Cannot connect to server")));
	});
}

function save(key: string, value: string | null) {
	key = `rri-${key}`;
	try {
		(value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
	} catch (e) { console.warn(e); }
}

function load(key: string) {
	try {
		return localStorage.getItem(`rri-${key}`);
	} catch (e) {
		console.warn(e);
		return null;
	}
}
