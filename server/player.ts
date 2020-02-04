import { WebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";
import Game from "./game.ts";
import JsonRpc, { IO } from "../../../projects/deno-json-rpc/mod.ts";
import { GameType } from "../src/rules.ts";

export default class Player {
	name = "";
	game: Game | null = null;
	roundEnded = false;
	jsonrpc: JsonRpc;

	constructor(ws: WebSocket) {
		const io = {
			sendData(str: string) { return ws.send(str); },
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
			roundEnded: this.roundEnded
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
		});

		jsonrpc.expose("join-game", (gameName: string, playerName: string) => {
			const game = Game.find(gameName);
			if (!game) { throw new Error(`Game "${gameName}" does not exist`); }

			this.name = playerName;
			game.addPlayer(this); // will notify others
			this._log("joined game", gameName);
		});

		jsonrpc.expose("start-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot start a non-joined game"); }
			if (game.owner != this) { throw new Error("Only the game owner can start it"); }
			this._log("starting the game");
			game.start(); // will notify all
		});

		// gameplay

		jsonrpc.expose("end-round", () => {
			const game = this.game;
			if (!game) { throw new Error("Not playing yet"); }
			this.roundEnded = true;
			this._log("round ended");
			game.checkRoundEnd(); // will notify all
		});

		jsonrpc.expose("quit-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot quit a non-joined game"); }
			game.removePlayer(this); // will notify others
			this._log("left the game");
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
					const game = this.game;
					this._log("disconnected");
					if (!game || game.state == "playing") { return; }
					game.removePlayer(this);
				}
			}
		} catch (e) {
			console.error("failed to receive frame", e);
			await ws.close(1000).catch(console.error);
		}
	}
}
