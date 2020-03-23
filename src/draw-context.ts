import { Direction } from "./direction.js";


export type Point = [number, number];

export default interface DrawContext {
	redGlow(e: Direction): void;
	rail(e: Direction, l: number): void;
	road(e: Direction, l: number): void;
	railCross(): void;
	station(): void;
	arc(e: Direction, diff: number): void;
	roadTicks(e: Direction, l: number): void;
	roadLine(e: Direction, l: number, d: number): void;
	styleRoadTicks(d: number[], o:number): void;
	styleRailTicks(d: number[], o:number): void;
	lake(p: Point[]): void;
	forest(): void;
}
