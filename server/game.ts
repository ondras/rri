import Player from "./player.ts";

import Dice from "../src/dice.ts";
import { GameType, ROUNDS, createDice } from "../src/rules.ts";


type State = "starting" | "playing";

let games: Game[] = [];
const GARBAGE_THRESHOLD = 1000*60*10;

export interface InfoOptions {
	board: boolean;
}

export default class Game {
	_players: Player[] = [];
	_round = 0;
	_dice: Dice[] = [];
	state: State;
	ts = performance.now();

	static find(name: string) {
		return games.filter(g => g.name == name)[0];
	}

	constructor(readonly _type: GameType, readonly name: string, readonly owner: Player) {
		if (Game.find(name)) { throw new Error(`The game "${name}" already exists`); }

		this._log("created");
		this.state = "starting";
		this.addPlayer(owner);

		games.push(this);
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
		newPlayer.score = oldPlayer.score;
		newPlayer.key = oldPlayer.key;
		newPlayer.game = this;
		newPlayer.roundEnded = oldPlayer.roundEnded;
		newPlayer.board = oldPlayer.board;
		newPlayer.bonusPool = oldPlayer.bonusPool;
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
			dice: this._dice.map(dice => dice.toJSON()),
			state: this.state,
			round: this._round,
			players: this._players.map(p => p.toJSON(options))
		};
	}

	_advanceRound() {
		if (this._round < ROUNDS[this._type]) {
			this._round++;
			this._dice = createDice(Dice, this._type, this._round);
			this._players.forEach(p => p.roundEnded = false);
			this.ts = performance.now();
			this._notifyGameChange();

			this._log(
				`round ${this._round}:`,
				this._dice.map(d => d.toJSON().sid).join(" | ")
			);

		} else {
			this._players.forEach(player => {
				this._log("final score for", player.name, "is", player.score);
			});
			this.close("over");
		}
	}

	close(reason: "destroy" | "over") {
		this._log("closed, reason:", reason);

		let players = this.getInfo({board:true}).players;
		while (this._players.length) {
			let p = this._players.shift() as Player;
			p.game = null;
			p.jsonrpc.notify(`game-${reason}`, reason == "over" ? players : []);
		}

		let index = games.indexOf(this);
		if (index > -1) { games.splice(index, 1); }
	}

	_notifyGameChange() {
		this._players.forEach(player => player.jsonrpc.notify("game-change", []));
	}

	_log(msg: string, ...args: unknown[]) {
		return console.log(`[game ${this.name} (${this._type})] ${msg}`, ...args);
	}
}

function collectGarbage() {
	let now = performance.now();
	games = games.filter(game => {
		if ((now-game.ts) < GARBAGE_THRESHOLD) { return true; }
		console.log("Closing idle game", game.name);
		game.close("destroy");
		return false;
	});
}

setInterval(collectGarbage, 5*1000);
