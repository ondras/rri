import JsonRpc from "https://deno.land/x/json_rpc/mod.ts";

import Game, { InfoOptions } from "./game.ts";

import { GameType } from "../src/rules.ts";
import Board from "../src/board.ts";
import { sum } from "../src/score.ts";


export default class Player {
	name = "";
	score = 0;
	key = Math.random().toString().replace(/\D/g, "");
	game: Game | null = null;
	roundEnded = false;
	board: any | null = null;
	bonusPool: any | null = null;
	jsonrpc: JsonRpc;

	constructor(ws: WebSocket) {
		const io = {
			sendData(str: string) { ws.send(str); },
			onData(_str: string) {}
		}
		let jsonrpc = new JsonRpc(io);
		this.jsonrpc = jsonrpc;

		this._exposeInterface(jsonrpc);

		ws.addEventListener("message", e => io.onData(e.data));
		ws.addEventListener("close", () => {
			const { game } = this;
			this._log("disconnected");
			if (game && game.state == "starting") {	game.removePlayer(this); }
		});
	}

	toJSON(options: InfoOptions) {
		let data = {
			name: this.name,
			roundEnded: this.roundEnded,
			board: null
		};
		if (options.board) { data.board = this.board; }
		return data;
	}

	_log(msg: string, ...args: unknown[]) {
		return console.log(`[player ${this.name}] ${msg}`, ...args);
	}

	_exposeInterface(jsonrpc: JsonRpc) {
		// setup

		jsonrpc.expose("create-game", (gameType: GameType, gameName: string, playerName: string) => {
			this.name = playerName;
			this.game = new Game(gameType, gameName, this);
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

			return {
				board: this.board,
				bonusPool: this.bonusPool
			};
		});

		// gameplay

		jsonrpc.expose("end-round", (data:any) => {
			const game = this.game;
			if (!game) { throw new Error("Not playing yet"); }
			this.roundEnded = true;
			this.board = data.board;
			this.bonusPool = data.bonusPool;
			let score = new Board().fromJSON(this.board).getScore();
			this.score = sum(score);
			this._log("round ended, score", this.score);
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
			return (game ? game.getInfo({board:false}) : null);
		});
	}
}
