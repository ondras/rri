import { Direction } from "./direction.js";

export type EdgeType = 0 | 1 | 2 | 3 | 4;
export const NONE: EdgeType = 0;
export const RAIL: EdgeType = 1;
export const ROAD: EdgeType = 2;
export const LAKE: EdgeType = 3;
export const FOREST: EdgeType = 4;

export interface Edge {
	type: EdgeType;
	connects: Direction[];
}