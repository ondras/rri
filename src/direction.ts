export type Direction = 0 | 1 | 2 | 3;
export const N: Direction = 0;
export const E: Direction = 1;
export const S: Direction = 2;
export const W: Direction = 3;

export function clamp(direction: number) {
	direction = direction % 4;
	return (direction >= 0 ? direction : direction + 4) as Direction;
}

export const all = [N, E, S, W];

export const Vector = [[0, -1], [1, 0], [0, 1], [-1, 0]];
