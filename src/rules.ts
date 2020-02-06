export type DiceType = "plain" | "lake";

export interface DiceDescriptor {
	type: DiceType;
	sid: string;
	transform: string;
}

export type GameType = "normal" | "lake" | "demo";

export const ROUNDS: {[type in GameType]: number} = {
	"normal": 7,
	"lake": 6,
	"demo": 1
}

export interface NetworkScore {
	exits: number[];
	center: number;
	deadends: number;
	road: number;
	rail: number;
	lakes: number[];
}


function expandTemplate(template: DiceTemplate): DiceDescriptor {
	let names = template.tiles;
	let sid = names[Math.floor(Math.random() * names.length)];
	return {sid, transform:"0", type:template.type};
}

export function createDiceDescriptors(type: GameType): DiceDescriptor[] {
	switch (type) {
		case "demo":
			return DEMO.map(type => ({sid:type, transform:"0", type:"plain"}));
		break;

		case "lake":
			return [...createDiceDescriptors("normal"), expandTemplate(DICE_LAKE), expandTemplate(DICE_LAKE)];
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
