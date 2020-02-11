import { WebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";
import Game from "./game.ts";
import JsonRpc, { IO } from "../../../projects/deno-json-rpc/mod.ts";
import { GameType, NetworkScore } from "../src/rules.ts";

export default class Player {
	name = "";
	key = Math.random().toString().replace(/\D/g, "");
	game: Game | null = null;
	roundEnded = false;
	jsonrpc: JsonRpc;
	score: NetworkScore | null = null;

	constructor(ws: WebSocket) {
		const io = {
			sendData(str: string) { !ws.isClosed && ws.send(str); },
			onData(_str: string) {}
		}
		let jsonrpc = new JsonRpc(io);
		this.jsonrpc = jsonrpc;

		this._exposeInterface(jsonrpc);
		this._receive(ws, io);
	}

	toJSON() {
		return {
			name: this.name,
			roundEnded: this.roundEnded,
			score: this.score
		};
	}

	_log(msg: string, ...args: unknown[]) {
		return console.log(`[player ${this.name}] ${msg}`, ...args);
	}

	_exposeInterface(jsonrpc: JsonRpc) {
		// setup

		jsonrpc.expose("create-game", (gameType: GameType, gameName: string, playerName: string) => {
			this.name = playerName;
			this.game = Game.create(gameType, gameName, this);
			this._log("game", gameName, "created");
			return this.key;
		});

		jsonrpc.expose("join-game", (gameName: string, playerName: string) => {
			const game = Game.find(gameName);
			if (!game) { throw new Error(`Game "${gameName}" does not exist`); }

			this.name = playerName;
			this._log("joined game", gameName);
			game.addPlayer(this); // will notify all
			return this.key;
		});

		jsonrpc.expose("start-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot start a non-joined game"); }
			if (game.owner != this) { throw new Error("Only the game owner can start it"); }
			this._log("starting the game");
			game.start(); // notify all
		});

		jsonrpc.expose("continue-game", (gameName: string, key: string) => {
			const game = Game.find(gameName);
			if (!game) { throw new Error(`Game "${gameName}" does not exist`); }

			let previousPlayer = game.playerByKey(key);
			if (!previousPlayer) { throw new Error("The continuation key is invalid"); }

			game.replacePlayer(this, previousPlayer);
			this._log("continued game", gameName);
		});

		// gameplay

		jsonrpc.expose("end-round", (score: NetworkScore) => {
			const game = this.game;
			if (!game) { throw new Error("Not playing yet"); }
			this.roundEnded = true;
			this.score = score;
			this._log("round ended");
			game.checkRoundEnd(); // notify all
		});

		jsonrpc.expose("quit-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot quit a non-joined game"); }
			this._log("left the game");
			game.removePlayer(this); // notify others
		});

		jsonrpc.expose("game-info", () => {
			const game = this.game;
			return (game ? game.getInfo() : null);
		});
	}

	async _receive(ws: WebSocket, io: IO) {
		try {
			for await (const e of ws.receive()) {
				if (typeof(e) == "string") {
					io.onData(e);
				} else if (isWebSocketCloseEvent(e)) { // close
					this._log("disconnected");
					const game = this.game;
					if (game && game.state == "starting") {	game.removePlayer(this); }
				}
			}
		} catch (e) {
			console.error("failed to receive frame", e);
			await ws.close(1000).catch(console.error);
		}
	}
}
