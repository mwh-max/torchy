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

import { moveTowards } from "./utils.js";

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
  // Teammate center (x, y)
  const tx = wrapper.offsetLeft + wrapper.offsetWidth / 2;
  const ty = wrapper.offsetTop + wrapper.offsetHeight / 2;

  // Return true if any hazard marker is within 50px of the teammate’s center
  return hazardMarkers.some((h) => {
    const hx = h.offsetLeft + h.offsetWidth / 2;
    const hy = h.offsetTop + h.offsetHeight / 2;
    return Math.hypot(hx - tx, hy - ty) < 50;
  });
}

// Mode control
export function toggleMode() {
  const next =
    currentMode === MODES.THERMAL
      ? MODES.BLUEPRINT
      : currentMode === MODES.BLUEPRINT
      ? MODES.FOG
      : MODES.THERMAL;

  setMode(next); // Update mode state
  setModeClass(next); // Update DOM classes
  updateStatus(`Mode: ${next.toUpperCase()}`); // Update status text
  handleFogAudio(next === MODES.FOG); // Play/stop fog audio
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

// 👥 Toggle teammates
export function toggleTeammates() {
  els.teammates.forEach((t) => t.classList.toggle("hidden"));
}

// 🧱 Click to add manual hazard
export function onArViewClick(e) {
  if (currentMode === MODES.FOG) return; // Ignore clicks in FOG mode
  if (hazardMarkers.length >= maxMarkers) return; // Respect hazard limit
  if (e.target.closest(".teammate")) return; // Don’t place on teammates

  const rect = els.arView.getBoundingClientRect(); // AR view bounds in the window
  const x = e.clientX - rect.left; // Convert to AR view X
  const y = e.clientY - rect.top; // Convert to AR view Y
  placeHazard(x, y);
}

// 🔁 Teammate movement + hazard reaction
export function moveTeammate(wrapper, teammate) {
  if (!wrapper || isFrozen(teammate.id)) return; // Skip missing/frozen teammates

  // Small random step
  const deltaX = (Math.random() - 0.5) * 30;
  const deltaY = (Math.random() - 0.5) * 30;

  // Keep movement within AR view bounds
  const maxX = els.arView.clientWidth - wrapper.offsetWidth;
  const maxY = els.arView.clientHeight - wrapper.offsetHeight;

  // Apply step and clamp into [0 .. max]
  const newX = Math.min(maxX, Math.max(0, wrapper.offsetLeft + deltaX));
  const newY = Math.min(maxY, Math.max(0, wrapper.offsetTop + deltaY));

  // Move element
  wrapper.style.left = `${newX}px`;
  wrapper.style.top = `${newY}px`;

  // Freeze if near a hazard; attempt recovery after 3s
  if (isNearHazard(wrapper)) {
    updateStatus(`⚠️ ${teammate.id} frozen near hazard!`, "red");
    wrapper.classList.add("alert");
    freeze(teammate.id);

    setTimeout(() => {
      // Only recover if no longer near a hazard
      if (!isNearHazard(wrapper)) {
        wrapper.classList.remove("alert");
        clearFrozen(teammate.id);
        updateStatus(`✔️ ${teammate.id} recovered`, "lime");
      }
    }, 3000);
  }
}

// Initial UI paint
export function initController() {
  updateMarkerCount(hazardMarkers.length, maxMarkers);
  setModeClass(currentMode);
  updateStatus(`Mode: ${currentMode.toUpperCase()}`);
  handleFogAudio(currentMode === MODES.FOG);
}
