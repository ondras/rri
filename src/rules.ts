import { DiceType, DiceData } from "./dice.js";


export type GameType = "normal" | "lake" | "forest" | "demo";

export const ROUNDS: {[type in GameType]: number} = {
	"normal": 7,
	"lake": 6,
	"forest": 7,
	"demo": 1
}

function expandTemplate(template: DiceTemplate) {
	let names = template.tiles;
	let sid = names[Math.floor(Math.random() * names.length)];
	return {sid, transform:"0", type:template.type};
}

interface Factory<T> {
	fromJSON(data: DiceData): T;
}

export function createDice<T>(ctor: Factory<T>, type: GameType, round: number): T[] {
	return createDiceData(type, round).map(data => ctor.fromJSON(data));
}

export function createDiceData(type: GameType, round: number): DiceData[] {
	switch (type) {
		case "demo":
			return DEMO.map(type => ({sid:type, transform:"0", type:"plain"}));
		break;

		case "lake":
			return [...createDiceData("normal", round), expandTemplate(DICE_LAKE), expandTemplate(DICE_LAKE)];
		break;

		case "forest":
			if (round == 1) {
				let data: DiceData = {
					sid: "forest",
					transform: "0",
					type: "forest"
				};
				return [data, data, data, data];
			} else {
				return createDiceData("normal", round);
			}
		break;

		default:
			let result = [];
			let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
			while (templates.length) {
				let index = Math.floor(Math.random()*templates.length);
				let template = templates.splice(index, 1)[0];
				result.push(expandTemplate(template));
			}
			return result;
		break;
	}

}

interface DiceTemplate {
	tiles: string[];
	type: DiceType;
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
