import * as colors from "https://deno.land/std/fmt/colors.ts";
import { GameType, DiceDescriptor, ROUNDS, createDiceDescriptors } from "../src/rules.ts";
import Player from "./player.ts";

type State = "starting" | "playing";

const games = new Map<string, Game>();
const GARBAGE_THRESHOLD = 1000*60*10;

export interface InfoOptions {
	board: boolean;
}

export default class Game {
	_players: Player[] = [];
	_round = 0;
	_diceDescriptors: DiceDescriptor[] = [];
	state: State;
	ts = performance.now();

	static find(name: string) {
		return games.get(name);
	}

	static create(type: GameType, name: string, owner: Player) {
		if (this.find(name)) { throw new Error(`The game "${name}" already exists`); }
		let game = new this(type, owner);
		games.set(name, game);
		return game;
	}

	constructor(readonly _type: GameType, readonly owner: Player) {
		this.state = "starting";
		this.addPlayer(owner);
	}

	playerByKey(key: string) {
		return this._players.filter(p => p.key == key)[0];
	}

	addPlayer(player: Player) {
		this._players.forEach(p => {
			if (p.name == player.name) { throw new Error(`Player "${player.name}" already exists in this game`); }
		});
		this._players.push(player);
		this.ts = performance.now();
		player.game = this;

		this._notifyGameChange();
	}

	// either by explicit game-quit, or by disconnecting during setup
	removePlayer(player: Player) {
		let index = this._players.indexOf(player);
		if (index == -1) { return; }

		this._players.splice(index, 1);
		this.ts = performance.now();
		player.game = null;

		// owner left during setup
		if (player == this.owner && this.state != "playing") { return this.close("destroy"); }

		if (this._players.length) {
			this._notifyGameChange();
		} else {
			this.close("destroy");
		}
	}

	replacePlayer(newPlayer: Player, oldPlayer: Player) {
		newPlayer.name = oldPlayer.name;
		newPlayer.board = oldPlayer.board;
		newPlayer.bonusPool = oldPlayer.bonusPool;
		newPlayer.roundEnded = oldPlayer.roundEnded;
		newPlayer.key = oldPlayer.key;
		newPlayer.game = this;
		oldPlayer.game = null;

		const index = this._players.indexOf(oldPlayer);
		this._players[index] = newPlayer;
	}

	checkRoundEnd() {
		if (this._players.every(p => p.roundEnded)) {
			this._advanceRound();
		} else {
			this._notifyGameChange();
		}
	}

	start() {
		if (this.state != "starting") { throw new Error("Too late to start this game"); }
		this.state = "playing";
		this._advanceRound();
	}

	getInfo(options: InfoOptions) {
		return {
			dice: this._diceDescriptors,
			state: this.state,
			round: this._round,
			players: this._players.map(p => p.toJSON(options))
		};
	}

	_advanceRound() {
		if (this._round < ROUNDS[this._type]) {
			this._round++;
			this._diceDescriptors = createDiceDescriptors(this._type);
			this._players.forEach(p => p.roundEnded = false);
			this.ts = performance.now();
			this._notifyGameChange();
		} else {
			this.close("over");
		}
	}

	close(reason: "destroy" | "over") {
		let name = "";
		games.forEach((g, n) => {
			if (g == this) { name = n; }
		});
		console.log(`[game ${name}] closed, reason:`, reason);

		let players = this.getInfo({board:true}).players;
		while (this._players.length) {
			let p = this._players.shift() as Player;
			p.game = null;
			p.jsonrpc.notify(`game-${reason}`, reason == "over" ? players : []);
		}

		games.delete(name);
	}

	_notifyGameChange() {
		this._players.forEach(player => player.jsonrpc.notify("game-change", []));
	}
}

function logStats() {
	console.group("Active games:");
	games.forEach((game, name) => {
		console.group(colors.bold(`${name} (${game.state})`));
		const info = game.getInfo({board:false});
		console.log(
			"players:",
			info.players.map(p => `${p.name} (${p.roundEnded ? "waiting" : "playing"})`).join(", ")
		);
		if (info.state == "playing") {
			console.log(
				`round ${info.round}:`,
				info.dice.map(d => d.sid).join(" | ")
			);
		}
		console.groupEnd();
	});
	console.groupEnd();
}

function collectGarbage() {
	let now = performance.now();
	games.forEach((game, name) => {
		if ((now-game.ts) < GARBAGE_THRESHOLD) { return; }
		console.log("Closing idle game", name);
		game.close("destroy")
		games.delete(name);
	});
}

setInterval(logStats, 10*1000);
setInterval(collectGarbage, 5*1000);