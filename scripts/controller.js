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
  //1) Find the teammate's center point (x, y)
  const tx = wrapper.offsetLeft + wrapper.offsetWidth / 2;
  const ty = wrapper.offsetTop + wrapper.offsetHeight / 2;
  //2) check all hazard markers
  return hazardMarkers.some((h) => {
    //2a) Find the marker's center point (x, y)
    const hx = h.offsetLeft + h.offsetWidth / 2;
    const hy = h.offsetTop + h.offsetHeight / 2;

    //2B) Measure distance between teammate's center and marker center
    //Math.hypot(dx, dy) = straight-line distance
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

  setMode(next); //tells app what the new mode is
  setModeClass(next); //changes look of the page
  updateStatus(`Mode: ${next.toUpperCase()}`); //updates status text to all caps
  handleFogAudio(next === MODES.FOG); //plays or stop fog sounds
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
  if (currentMode === MODES.FOG) return; //1. If in fog mode, do nothing.
  if (hazardMarkers.length >= maxMarkers) return; //2. If we've hit hazard limit, do nothing.
  if (e.target.closest(".teammate")) return; //3. If clicking on a teammate, do nothing.

  const rect = els.arView.getBoundingClientRect(); //4. Get AR View's position/size
  const x = e.clientX - rect.left; //5. Mouse X position inside AR view
  const y = e.clientY - rect.top; //6. Mouse Y position inside AR view
  placeHazard(x, y); //7. Create hazard at that spot.
}

// 🔁 Teammate Movement + Hazard Reaction
export function moveTeammate(wrapper, teammate) {
  if (!wrapper || isFrozen(teammate.id)) return; // 1) bail if missing or already frozen

  const deltaX = (Math.random() - 0.5) * 30; //2) pick a small random step
  const deltaY = (Math.random() - 0.5) * 30;

  const maxX = els.arView.clientWidth - wrapper.offsetWidth; // 3) right/bottom limits
  const maxY = els.arView.clientHeight - wrapper.offsetHeight;

  // 4) current position + step, then clamp into [0 ... max]
  const newX = Math.min(maxX, Math.max(0, wrapper.offsetLeft + deltaX));
  const newY = Math.min(maxY, Math.max(0, wrapper.offsetTop + deltaY));

  wrapper.style.left = `${newX}px`; // 5) move the element
  wrapper.style.top = `${newY}px`;

  if (isNearHazard(wrapper)) {
    // 6) if close to a hazard
    updateStatus(`⚠️ ${teammate.id} frozen near hazard!`, "red");
    wrapper.classList.add("alert"); // ... turn it red
    freeze(teammate.id); /// ... mark as frozen (no more moves)
    setTimeout(() => {
      // 7) after 3s, try to recover
      // optional safety: only unfreeze if they’re actually clear now
      if (!isNearHazard(wrapper)) {
        // only if it's now clear
        wrapper.classList.remove("alert");
        clearFrozen(teammate.id); // allow mvoement again
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
