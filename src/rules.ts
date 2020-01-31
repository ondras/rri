import Dice from "./dice.ts";
import Tile from "./tile.js";

export type DiceType = "plain" | "lake";

export interface DiceTemplate {
	tiles: string[];
	type: DiceType;
}

export type GameType = "normal" | "lake" | "demo";

export const ROUNDS: {[type in GameType]: number} = {
	"normal": 7,
	"lake": 6,
	"demo": 1
}

export function createDice(type: GameType): Dice[] {
	switch (type) {
		case "demo":
			return DEMO.map(type => new Dice(new Tile(type, "0"), "plain"));
		break;

		case "lake":
			return [...createDice("normal"), Dice.fromTemplate(DICE_LAKE), Dice.fromTemplate(DICE_LAKE)];
		break;

		default:
			let dice = [];
			let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
			while (templates.length) {
				let index = Math.floor(Math.random()*templates.length);
				let template = templates.splice(index, 1)[0];
				dice.push(Dice.fromTemplate(template));
			}
			return dice;
		break;
	}

}

const DEMO = [
	"bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t",
	"lake-1", "lake-2", "lake-3", "lake-4", "lake-rail", "lake-road", "lake-rail-road"
];

const DICE_REGULAR_1: DiceTemplate = {
	tiles: ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"],
	type: "plain"
}

const DICE_REGULAR_2: DiceTemplate = {
	tiles: ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"],
	type: "plain"
}

const DICE_LAKE: DiceTemplate = {
	tiles: ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"],
	type: "lake"
}
