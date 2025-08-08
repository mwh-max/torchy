// Marker System
export let hazardMarkers = [];
export const maxMarkers = 5;

// Modes
export const MODES = { THERMAL: "thermal", BLUEPRINT: "blueprint", FOG: "fog" };
export let currentMode = MODES.THERMAL;

// Teammates
export let frozenTeammates = new Set();

// --- tiny helpers for updates (so other modules don’t mutate directly) ---
export function setMode(next) {
  currentMode = next;
}
export function addMarker(el) {
  hazardMarkers = [...hazardMarkers, el];
}
export function removeMarker(el) {
  hazardMarkers = hazardMarkers.filter((m) => m !== el);
}
export function clearFrozen(id) {
  frozenTeammates.delete(id);
}
export function freeze(id) {
  frozenTeammates.add(id);
}
export function isFrozen(id) {
  return frozenTeammates.has(id);
}
