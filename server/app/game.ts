import Player from "./player.ts";

type State = "starting" | "playing" | "over";

interface GameStateMessage {
	players: string[];
	round: number;
	state: State
}

interface PlayerAddMessage {
	type: "player-add";
	game: GameStateMessage;
}

interface PlayerRemoveMessage {
	type: "player-add";
	game: GameStateMessage;
}

interface NewRoundMessage {
	type: "new-round";
}

interface GameOverMessage {
	type: "game-over";
}

interface GameDestroyMessage {
	type: "game-destroy";
}

type Message = PlayerAddMessage | PlayerRemoveMessage | NewRoundMessage | GameOverMessage | GameDestroyMessage;


const games = new Map<string, Game>();

export default class Game {
	name: string;
	owner: Player;
	players = new Set<Player>();
	state: State;
	round = 0;
	dice = [];

	static find(name: string) {
		return games.get(name);
	}

	static create(name: string, player: Player) {
		if (this.find(name)) { throw new Error(`The game "${name}" already exists`); }

		let game = new this(name, player);
		games.set(name, game);
		return game;
	}

	constructor(name: string, owner: Player) {
		this.name = name;
		this.state = "starting";
		this.owner = owner;
		this.addPlayer(owner);
	}

	addPlayer(player: Player) {
		this.players.forEach(p => {
			if (p.name == player.name) { throw new Error(`Player "${player.name}" already exists in this game`); }
		});
		this.players.add(player);
		// FIXME
	}

	removePlayer(player: Player) {
		this.players.delete(player);
		// FIXME

		// owner left
		if (this.state == "starting" && player == this.owner) { return this.destroy(); }

		// last one left
		if (this.state == "over" && !this.players.size) { return this.destroy(); }

		// FIXME broadcast game state

	}

	checkRoundEnd() {
		// FIXME
	}

	start() {
		if (this.state != "starting") { throw new Error("Too late to start this game"); }
		// FIXME
	}

	destroy() {
		games.delete(this.name);
		// FIXME
	}

	_broadcast(message: Message) {
		let data = JSON.stringify(message);
		this.players.forEach(player => player.ws.send(data));
	}
}
