import Dice, { DiceType } from "./dice.ts";


interface Type<T> {
	new(type: DiceType, sid: string): T;
}

export type GameType = "normal" | "lake" | "forest" | "demo";

export const ROUNDS: {[type in GameType]: number} = {
	"normal": 7,
	"lake": 6,
	"forest": 7,
	"demo": 1
}

function randomType(types: string[]) {
	return types[Math.floor(Math.random() * types.length)];
}

export function createDice<T extends Dice>(Ctor: Type<T>, type: GameType, round: number): T[] {
	switch (type) {
		case "demo":
			return DEMO.map(type => new Ctor("plain", type));
		break;

		case "lake":
			return [
				...createDice(Ctor, "normal", round),
				new Ctor("lake", randomType(DICE_LAKE)),
				new Ctor("lake", randomType(DICE_LAKE))
			];
		break;

		case "forest":
			if (round == 1) {
				let result = [];
				for (let i=0;i<4;i++) { result.push(new Ctor("forest", "forest")); }
				return result;
			} else {
				return createDice(Ctor, "normal", round);
			}
		break;

		default:
			let result = [];
			let templates = [DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_1, DICE_REGULAR_2];
			while (templates.length) {
				let index = Math.floor(Math.random()*templates.length);
				let template = templates.splice(index, 1)[0];
				let sid = randomType(template);
				result.push(new Ctor("plain", sid));
			}
			return result;
		break;
	}

}

const DEMO = [
	"bridge", "rail-i", "road-i", "rail-road-l", "rail-road-i", "rail-t", "road-l", "rail-l", "road-t",
	"lake-1", "lake-2", "lake-3", "lake-4", "lake-rail", "lake-road", "lake-rail-road",
	"forest"
];
const DICE_REGULAR_1 = ["road-i", "rail-i", "road-l", "rail-l", "road-t", "rail-t"];
const DICE_REGULAR_2 = ["bridge", "bridge", "rail-road-i", "rail-road-i", "rail-road-l", "rail-road-l"];
const DICE_LAKE = ["lake-1", "lake-2", "lake-3", "lake-rail", "lake-road", "lake-rail-road"];
