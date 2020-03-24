export type DiceType = "plain" | "lake" | "forest";

export interface DiceData {
	type: DiceType;
	sid: string;
}

export default class Dice {
	static fromJSON<T>(this: new (type: DiceType, sid: string) => T, data: DiceData): T {
		return new this(data.type, data.sid);
	}

	constructor(readonly _type: DiceType, readonly _sid: string) {}

	toJSON(): DiceData {
		return {
			type: this._type,
			sid: this._sid
		}
	}
}
