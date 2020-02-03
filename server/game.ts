import { GameType, DiceDescriptor, ROUNDS, createDiceDescriptors } from "../src/rules.ts";
import Player from "./player.ts";

type State = "starting" | "playing" | "over";

const games = new Map<string, Game>();

export default class Game {
	_players: Player[] = [];
	_round = 0;
	_diceDescriptors: DiceDescriptor[] = [];
	state: State;

	static find(name: string) {
		return games.get(name);
	}

	static create(name: string, type: GameType, owner: Player) {
		if (this.find(name)) { throw new Error(`The game "${name}" already exists`); }

		let game = new this(type, owner);
		games.set(name, game);
		return game;
	}

	constructor(readonly _type: GameType, readonly owner: Player) {
		this.state = "starting";
		this.addPlayer(owner);
	}

	addPlayer(player: Player) {
		this._players.forEach(p => {
			if (p.name == player.name) { throw new Error(`Player "${player.name}" already exists in this game`); }
		});
		this._players.push(player);
		player.game = this;

		this._notifyGameChange(); // fixme will notify this player as well
	}

	// either by explicit game-quit, or by disconnecting in a non-playing state
	removePlayer(player: Player) {
		let index = this._players.indexOf(player);
		if (index == -1) { return; }

		this._players.splice(index, 1);
		player.game = null;

		// owner left during setup
		if (this.state == "starting" && player == this.owner) { return this._destroy(); }

		// no players remaining
		if (!this._players.length) { return this._destroy(); }

		this._notifyGameChange();
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
		this._advanceRound();
	}

	getInfo() {
		return {
			dice: this._diceDescriptors,
			state: this.state,
			players: this._players.map(p => p.toJSON())
		};
	}

	_destroy() {
		while (this._players.length) {
			let p = this._players.shift() as Player;
			p.game = null;
			p.jsonrpc.notify("game-destroy", [])
		}

		let name = "";
		games.forEach((g, n) => {
			if (g == this) { name = n; }
		});
		games.delete(name);
	}

	_advanceRound() {
		if (this._round < ROUNDS[this._type]) {
			this._round++;
			this._diceDescriptors = createDiceDescriptors(this._type);
		} else {
			this.state = "over";
		}
		this._notifyGameChange();
	}

	_notifyGameChange() {
		this._players.forEach(player => player.jsonrpc.notify("game-change", []));
	}
}

function logStats() {
	console.group("Active games:");
	games.forEach((game, name) => {
		console.log(name, game.getInfo());
	});
	console.groupEnd();
	console.log("---");
}

setInterval(logStats, 10*1000);
