import { WebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";
import Game from "./game.ts";
import JsonRpc from "../../../projects/deno-json-rpc/mod.ts";
import { IO } from "../../../projects/deno-json-rpc/types.d.ts";
import { GameType } from "../src/rules.ts";

export default class Player {
	name = "";
	game: Game | null = null;
	roundEnded = false;
	jsonrpc: JsonRpc;

	constructor(ws: WebSocket) {
		const io = {
			sendData(str: string) { ws.send(str); },
			onData(str: string) { console.log(str); }
		}
		let jsonrpc = new JsonRpc(io);
		this.jsonrpc = jsonrpc;

		this._exposeInterface(jsonrpc);
		this._receive(ws, io);
	}

	_exposeInterface(jsonrpc: JsonRpc) {
		// setup

		jsonrpc.expose("create-game", (gameName: string, gameType: GameType, playerName: string) => {
			this.name = playerName;
			this.game = Game.create(gameName, gameType, this);
		});

		jsonrpc.expose("join-game", (gameName: string, playerName: string) => {
			const game = Game.find(gameName);
			if (!game) { throw new Error(`Game "${gameName}" does not exist`); }

			this.name = playerName;
			game.addPlayer(this); // will notify others
		});

		jsonrpc.expose("start-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot start a non-joined game"); }
			if (game.owner != this) { throw new Error("Only the game owner can start it"); }
			game.start(); // will notify all
		});

		// gameplay

		jsonrpc.expose("end-round", () => {
			const game = this.game;
			if (!game) { throw new Error("Not playing yet"); }
			this.roundEnded = true;
			game.checkRoundEnd(); // will notify all
		});

		jsonrpc.expose("quit-game", () => {
			const game = this.game;
			if (!game) { throw new Error("Cannot quit a non-joined game"); }
			game.removePlayer(this); // will notify others
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
