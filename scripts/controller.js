import { els } from "./dom.js";
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

export function placeHazard(x, y, type = "manual") {
  const marker = makeMarker(x, y, type === "gas");
  addMarker(marker);
  updateMarkerCount(hazardMarkers.length, maxMarkers);

  marker.addEventListener("click", (e) => {
    e.stopPropagation();
    removeMarkerEl(marker);
    removeMarker(marker);
    updateMarkerCount(hazardMarkers.length, maxMarkers);
  });

  playMarkerSound();
}

function isNearHazard(wrapper) {
  const tx = wrapper.offsetLeft + wrapper.offsetWidth / 2;
  const ty = wrapper.offsetTop + wrapper.offsetHeight / 2;

  return hazardMarkers.some((h) => {
    const hx = h.offsetLeft + h.offsetWidth / 2;
    const hy = h.offsetTop + h.offsetHeight / 2;
    return Math.hypot(hx - tx, hy - ty) < 50;
  });
}

//Mode control
export function toggleMode() {
  const next =
    currentMode === MODES.THERMAL
      ? MODES.BLUEPRINT
      : currentMode === MODES.BLUEPRINT
      ? MODES.FOG
      : MODES.THERMAL;

  setMode(next);
  setModeClass(next);
  updateStatus(`Mode: ${next.toUpperCase()}`);
  handleFogAudio(next === MODES.FOG);
}

// 📸 Snapshot
export function snapshot() {
  html2canvas(els.arView)
    .then((canvas) => {
      const a = document.createElement("a");
      a.download = "ar_snapshot.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    })
    .catch(() => updateStatus("Snapshot failed", "red"));
}

// 👥 Toggle Teammates
export function toggleTeammates() {
  els.teammates.forEach((t) => t.classList.toggle("hidden"));
}

// 🧱 Click to Add Manual Hazard
export function onArViewClick(e) {
  if (currentMode === MODES.FOG) return;
  if (hazardMarkers.length >= maxMarkers) return;
  if (e.target.closest(".teammate")) return;

  const rect = els.arView.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  placeHazard(x, y);
}

// 🔁 Teammate Movement + Hazard Reaction
export function moveTeammate(wrapper, teammate) {
  if (!wrapper || isFrozen(teammate.id)) return;

  const deltaX = (Math.random() - 0.5) * 30;
  const deltaY = (Math.random() - 0.5) * 30;

  const maxX = els.arView.clientWidth - wrapper.offsetWidth;
  const maxY = els.arView.clientHeight - wrapper.offsetHeight;
  const newX = Math.min(maxX, Math.max(0, wrapper.offsetLeft + deltaX));
  const newY = Math.min(maxY, Math.max(0, wrapper.offsetTop + deltaY));

  wrapper.style.left = `${newX}px`;
  wrapper.style.top = `${newY}px`;

  if (isNearHazard(wrapper)) {
    updateStatus(`⚠️ ${teammate.id} frozen near hazard!`, "red");
    wrapper.classList.add("alert");
    freeze(teammate.id);
    setTimeout(() => {
      // optional safety: only unfreeze if they’re actually clear now
      if (!isNearHazard(wrapper)) {
        wrapper.classList.remove("alert");
        clearFrozen(teammate.id);
        updateStatus(`✔️ ${teammate.id} recovered`, "lime");
      }
    }, 3000);
  }
}

//Initial UI paint
export function initController() {
  updateMarkerCount(hazardMarkers.length, maxMarkers);
  setModeClass(currentMode);
  updateStatus(`Mode: ${currentMode.toUpperCase()}`);
  handleFogAudio(currentMode === MODES.FOG);
}
