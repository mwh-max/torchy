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

function placeHazard(x, y, type = "manual") {
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
  const tx = wrapper.offsetLeft + 15;
  const ty = wrapper.offsetTop + 15;
  return hazardMarkers.some((h) => {
    const hx = h.offsetLeft + 15;
    const hy = h.offsetTop + 15;
    return Math.hypot(hx - tx, hy - ty) < 50;
  });
}

// 🎮 Mode Toggle
els.toggleBtn.addEventListener("click", () => {
  if (currentMode === MODES.THERMAL) {
    setMode(MODES.BLUEPRINT);
  } else if (currentMode === MODES.BLUEPRINT) {
    setMode(MODES.FOG);
  } else {
    setMode(MODES.THERMAL);
  }
  setModeClass(currentMode);
  updateStatus(`Mode: ${currentMode.toUpperCase()}`);
  handleFogAudio(currentMode === MODES.FOG);
});

// 📸 Snapshot
els.snapshotBtn.addEventListener("click", () => {
  html2canvas(els.arView).then((canvas) => {
    const link = document.createElement("a");
    link.download = "ar_snapshot.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});

// 👥 Toggle Teammates
els.teammateBtn.addEventListener("click", () => {
  els.teammates.forEach((t) => t.classList.toggle("hidden"));
});

// 🧱 Click to Add Manual Hazard
els.arView.addEventListener("click", (e) => {
  if (currentMode === MODES.FOG) return;
  if (hazardMarkers.length >= maxMarkers) return;

  const rect = els.arView.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  placeHazard(x, y);
});

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

// 🔁 Teammate Movement + Hazard Reaction
function moveTeammate(wrapper, teammate) {
  if (isFrozen(teammate.id)) return;

  const deltaX = (Math.random() - 0.5) * 30;
  const deltaY = (Math.random() - 0.5) * 30;
  const newX = Math.min(
    els.arView.clientWidth - 60,
    Math.max(0, wrapper.offsetLeft + deltaX)
  );
  const newY = Math.min(
    els.arView.clientHeight - 60,
    Math.max(0, wrapper.offsetTop + deltaY)
  );

  wrapper.style.left = `${newX}px`;
  wrapper.style.top = `${newY}px`;

  if (isNearHazard(wrapper)) {
    updateStatus(`⚠️ ${teammate.id} frozen near hazard!`, "red");
    wrapper.classList.add("alert");
    freeze(teammate.id);
    setTimeout(() => {
      wrapper.classList.remove("alert");
      clearFrozen(teammate.id);
      updateStatus(`✔️ ${teammate.id} recovered`, "lime");
    }, 3000);
  }
}

setInterval(() => {
  els.teammates.forEach((t) => {
    const wrapper = t.closest(".teammate-wrapper");
    moveTeammate(wrapper, t);
  });
}, 2000);

//Initial UI paint
updateMarkerCount(hazardMarkers.length, maxMarkers);
setModeClass(currentMode);
updateStatus(`Mode: ${currentMode.toUpperCase()}`);
handleFogAudio(currentMode === MODES.FOG);
