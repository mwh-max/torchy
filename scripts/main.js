import { els } from "./dom.js";

import { moveTeammate, placeHazard } from "./controller.js";

import {
  hazardMarkers,
  maxMarkers,
  MODES,
  currentMode,
  setMode,
  addMarker,
  removeMarker,
  freeze,
  clearFrozen,
  isFrozen,
} from "./state.js";

import {
  updateMarkerCount,
  updateStatus,
  setModeClass,
  handleFogAudio,
  makeMarker,
  removeMarkerEl,
  playMarkerSound,
} from "./view.js";

import { wireEvents } from "./events.js";

// 🔁 Simulate Gas Detection
setInterval(() => {
  if (currentMode !== MODES.BLUEPRINT || hazardMarkers.length >= maxMarkers)
    return;
  if (Math.random() < 0.5) {
    const x = Math.random() * els.arView.clientWidth;
    const y = Math.random() * els.arView.clientHeight;
    placeHazard(x, y, "gas");
  }
}, 6000);

setInterval(() => {
  els.teammates.forEach((t) => {
    const wrapper = t.closest(".teammate-wrapper");
    moveTeammate(wrapper, t);
  });
}, 2000);

wireEvents();
