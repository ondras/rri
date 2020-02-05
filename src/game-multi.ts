import Game from "./game.js";
import { GameType, DiceDescriptor } from "./rules.js";
import JsonRpc from "./json-rpc.js";
import Board from "./board.js";
import * as html from "./html.js";
import Round from "./round.js";

type GameState = "" | "starting" | "playing" | "over";
interface Player {
	name: string;
	roundEnded: boolean;
}
interface Response {
	state: GameState;
	round: number;
	dice: DiceDescriptor[];
	players: Player[];
}

const template = document.querySelector("template") as HTMLTemplateElement;

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

export default class MultiGame extends Game {
	_rpc?: JsonRpc;
	_round?: MultiplayerRound;
	_reject!: (e: Error) => void;
	_board!: Board;
	_nodes: {[key:string]:HTMLElement} = {};
	_state = "";
	_wait = html.node("p", {className:"wait", hidden:true});

	constructor(board: Board) {
		super(board);

		["setup", "lobby"].forEach(id => {
			let node = template.content.querySelector(`#multi-${id}`) as HTMLElement;
			this._nodes[id] = node.cloneNode(true) as HTMLElement;
		});

		const setup = this._nodes["setup"];
		(setup.querySelector("[name=join]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate());
		(setup.querySelector("[name=create-normal]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate("normal"));
		(setup.querySelector("[name=create-lake]") as HTMLElement).addEventListener("click", _ => this._joinOrCreate("lake"));

		const lobby = this._nodes["lobby"];
		(lobby.querySelector("button") as HTMLElement).addEventListener("click", _ => this._start());
	}

	async play() {
		super.play();

		return new Promise((_, reject) => {
			this._reject = reject;
			this._setup();
		});
	}

	async _setup() {
		this._rpc = undefined;
		this._node.innerHTML = "";

		const setup = this._nodes["setup"];
		this._node.appendChild(setup);

		try {
			const ws = await openWebSocket("ws://localhost:1234"); // FIXME
			ws.addEventListener("close", e => this._onClose(e));

			const rpc = createRpc(ws);
			rpc.expose("game-change", () => this._sync());
			rpc.expose("game-destroy", () => this._sync()); // FIXME
			this._rpc = rpc;
		} catch (e) {
			this._reject(e);
		}
	}

	_onClose(_e: CloseEvent) {
		this._reject(new Error("Network connection closed"));
	}

	async _joinOrCreate(type?: GameType) {
		if (!this._rpc) { return; }

		const setup = this._nodes["setup"];

		let playerName = (setup.querySelector("[name=player-name]") as HTMLInputElement).value;
		if (!playerName) { return alert("Please provide your name"); }

		let gameName = (setup.querySelector("[name=game-name]") as HTMLInputElement).value;
		if (!gameName) { return alert("Please provide a game name"); }

		const buttons = setup.querySelectorAll<HTMLButtonElement>("button")
		buttons.forEach(b => b.disabled = true);

		let args = [gameName, playerName];
		if (type) { args.unshift(type); }

		try {
			const lobby = this._nodes["lobby"];
			(lobby.querySelector("button") as HTMLButtonElement).disabled = (!type);
			await this._rpc.call(type ? "create-game" : "join-game", args);
		} catch (e) {
			alert(e.message);
		} finally {
			buttons.forEach(b => b.disabled = false);
		}
	}

	_start() {
		if (!this._rpc) { return; }

		this._rpc.call("start-game", []);
	}

	async _sync() {
		if (!this._rpc) { return; }

		let response: Response = await this._rpc.call("game-info", []);
		this._setState(response.state);

		switch (response.state) {
			case "starting": this._updateLobby(response.players); break;
			case "playing": this._updateRound(response); break;
		}
	}

	_setState(state: string) {
		if (this._state == state) { return; }
		this._state = state;

		this._node.innerHTML = "";

		switch (state) {
			case "starting":
				this._node.appendChild(this._nodes["lobby"]);
			break;

			case "over":
				// FIXME send score
			break;
		}
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

	async _updateRound(response: Response) {
		let waiting = response.players.filter(p => !p.roundEnded).length;
		this._wait.textContent = `Waiting for ${waiting} player${waiting>1?"s":""} to end round`;

		if (this._round && response.round == this._round.number) { return; }

		// switch to a new round
		let number = (this._round ? this._round.number : 0)+1;
		this._round = new MultiplayerRound(number, this._board, this._bonusPool);

		this._node.innerHTML = "";
		this._node.appendChild(this._bonusPool.node);
		this._node.appendChild(this._round.node);

		await this._round.play(response.dice);
		this._wait.hidden = false;
		this._node.appendChild(this._wait);
		this._rpc && this._rpc.call("end-round", []);
	}
}

class MultiplayerRound extends Round {
	_end() {
		super._end();
		this._endButton.disabled = true;
	}
}
