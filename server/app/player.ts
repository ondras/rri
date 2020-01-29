import { WebSocket } from "https://deno.land/std/ws/mod.ts";
import Game from "./game.ts";

interface CreateGameMessage {
	type: "create-game";
	game: string;
	name: string;
}

interface JoinGameMessage {
	type: "join-game";
	game: string;
	name: string;
}

interface StartGameMessage {
	type: "start-game";
}

interface EndRoundMessage {
	type: "end-round";
}

type Message = CreateGameMessage | JoinGameMessage | StartGameMessage | EndRoundMessage;

export default class Player {
	ws: WebSocket;
	name = "";
	game: Game | null = null;
	roundEnded = false;

	constructor(ws: WebSocket) {
		this.ws = ws;
	}

	onDisconnect() {
		const game = this.game;
		if (!game || game.state == "playing") { return; }

		game.removePlayer(this);
	}

	onMessage(message: Message) {
		const game = this.game;

		switch (message.type) {
			case "create-game": {
				this.name = message.name;
				this.game = Game.create(message.game, this);
			} break;

			case "join-game": {
				const game = Game.find(message.game);
				if (!game) { throw new Error(`Game "${message.game}" does not exist`); }

				this.name = message.name;
				game.addPlayer(this);
				this.game = game;
			} break;

			case "end-round": {
				if (!game) { throw new Error("Not playing yet"); }
				this.roundEnded = true;
				game.checkRoundEnd();
			} break;

			case "start-game": {
				if (!game) { throw new Error("Cannot start a non-joined game"); }
				if (game.owner != this) { throw new Error("Only the game owner can start it"); }

				game.start();
			} break;
		}
	}

	onEvent() {
		const message =
		try {
			this.onMessage(message);
		} catch (e) {

		}
	}
}
