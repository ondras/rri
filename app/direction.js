export const N = 0;
export const E = 1;
export const S = 2;
export const W = 3;
export function clamp(direction) {
    direction = direction % 4;
    return (direction >= 0 ? direction : direction + 4);
}
export const all = [N, E, S, W];
