import * as colors from "https://deno.land/std/fmt/colors.ts";
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

	addPlayer(player: Player) {
		this._players.forEach(p => {
			if (p.name == player.name) { throw new Error(`Player "${player.name}" already exists in this game`); }
		});
		this._players.push(player);
		player.game = this;

		this.notifyGameChange(); // fixme will notify this player as well
	}

	// either by explicit game-quit, or by disconnecting in a non-playing state
	removePlayer(player: Player) {
		// owner left during setup/over
		if (player == this.owner && this.state != "playing") { return this._destroy(); }

		if (this.state == "over") { return; } // leaving in "over" does nothing

		let index = this._players.indexOf(player);
		if (index == -1) { return; }

		this._players.splice(index, 1);
		player.game = null;

		if (this._players.length) { // no players remaining
			this._destroy();
		} else {
			this.notifyGameChange();
		}
	}

	checkRoundEnd() {
		if (this._players.every(p => p.roundEnded)) {
			this._advanceRound();
		} else {
			this.notifyGameChange();
		}
	}

	start() {
		if (this.state != "starting") { throw new Error("Too late to start this game"); }
		this.state = "playing";
		this._advanceRound();
	}

	getInfo() {
		return {
			dice: this._diceDescriptors,
			state: this.state,
			round: this._round,
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
		if (this._round < ROUNDS[this._type]*0 + 1) {
			this._round++;
			this._diceDescriptors = createDiceDescriptors(this._type);
		} else {
			this.state = "over";
		}
		this.notifyGameChange();
	}

	notifyGameChange() {
		setTimeout( () => this._players.forEach(player => player.jsonrpc.notify("game-change", [])), 0);
	}
}

function logStats() {
	console.group("Active games:");
	games.forEach((game, name) => {
		console.group(colors.bold(name));
		const info = game.getInfo();
		console.log(
			"players:",
			info.players.map(p => `${p.name} ${p.roundEnded ? "✔️" : "❌"}`).join(", ")
		);
		if (info.state == "playing") {
			console.log(
				`round ${info.round}:`,
				info.dice.map(d => d.sid).join(" | ")
			);
		} else {
			console.log(info.state);
		}
		console.groupEnd();
	});
	console.groupEnd();
}

setInterval(logStats, 10*1000);
