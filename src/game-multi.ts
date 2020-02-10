import Game from "./game.js";
import { GameType, DiceDescriptor, NetworkScore } from "./rules.js";
import JsonRpc from "./json-rpc.js";
import Board from "./board.js";
import * as html from "./html.js";
import * as score from "./score.js";
import Round from "./round.js";

type GameState = "" | "starting" | "playing";
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
interface HasScore {
	name: string;
	score: NetworkScore;
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
	_resolve!: (result: boolean) => void;
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

		return new Promise<boolean>(resolve => {
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

			rpc.expose("game-over", (...scores: HasScore[]) => {
				this._outro();
				this._showScore(scores);
				ws.close();
				this._resolve(true);
			});

			let quit = html.node("button", {}, "Quit game");
			quit.addEventListener("click", async _ => {
				if (!(confirm("Really quit the game?"))) { return; }
				await rpc.call("quit-game", []);
				ws.close();
				this._resolve(false);
			});
			this._bonusPool.node.appendChild(quit);

			this._rpc = rpc;
		} catch (e) {
			alert(e.message);
			this._resolve(false);
		}
	}

	_onClose(e: CloseEvent) {
		if (e.code != 0 && e.code != 1000 && e.code != 1001) { alert("Network connection closed"); }
		this._resolve(false);
	}

	async _joinOrCreate(type?: GameType) {
		if (!this._rpc) { return; }

		const setup = this._nodes["setup"];

		let playerName = (setup.querySelector("[name=player-name]") as HTMLInputElement).value;
		if (!playerName) { return alert("Please provide your name"); }

		let gameName = (setup.querySelector("[name=game-name]") as HTMLInputElement).value;
		if (!gameName) { return alert("Please provide a game name"); }

		const buttons = setup.querySelectorAll<HTMLButtonElement>("button");
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
		this._rpc && this._rpc.call("start-game", []);
	}

	async _sync() {
		if (!this._rpc) { return; }

		const response: Response = await this._rpc.call("game-info", []);
		const state = response.state;
		if (state != this._state) {
			this._state = state;
			if (state == "starting") {
				this._node.innerHTML = "";
				this._node.appendChild(this._nodes["lobby"]);
			}
		}

		switch (response.state) {
			case "starting": this._updateLobby(response.players); break;
			case "playing": this._updateRound(response); break;
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

		let number = (this._round ? this._round.number : 0)+1;
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

	_showScore(scores: HasScore[]) {
		let s = this._board.getScore();
		this._board.showScore(s);

		const placeholder = document.querySelector("#outro div") as HTMLElement;
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
