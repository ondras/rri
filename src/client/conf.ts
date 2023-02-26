export const TILE = Number(window.getComputedStyle(document.body).getPropertyValue("--tile-size"));
export const DBLCLICK = 400;
export const DOWN_EVENT = ("onpointerdown" in window ? "pointerdown" : "touchstart");
export const SERVER = "wss://rri.toad.cz/";
