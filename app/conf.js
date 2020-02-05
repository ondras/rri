export const BOARD = 7;
export const TILE = Number(getComputedStyle(document.body).getPropertyValue("--tile-size"));
export const DBLCLICK = 400;
export const DOWN_EVENT = ("onpointerdown" in window ? "pointerdown" : "touchstart");
