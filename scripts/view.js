import { els } from "./dom.js";

export function updateMarkerCount(count, max) {
  els.markerCount.textContent = `Markers: ${count} / ${max}`;
}

export function updateStatus(msg, color = "#fff") {
  els.statusDisplay.textContent = msg;
  els.statusDisplay.style.color = color;
}

export function setModeClass(mode) {
  // switch classes on arView based on mode
  if (mode === "blueprint") els.arView.className = "blueprint";
  else if (mode === "fog") els.arView.className = "foggy";
  else els.arView.className = "thermal";
}

export function handleFogAudio(on) {
  if (!els.fogAudio) return;
  if (on) {
    els.fogAudio.volume = 0.6;
    els.fogAudio.loop = true;
    els.fogAudio.play().catch(() => {});
  } else {
    els.fogAudio.pause();
    els.fogAudio.currentTime = 0;
  }
}

export function makeMarker(x, y, isGas = false) {
  const marker = document.createElement("div");
  marker.classList.add("hazard-marker");
  if (isGas) marker.classList.add("gas-auto");
  if (isGas) {
    marker.classList.add("gas-auto");
    marker.style.animationDuration = "2s";
  }
  marker.style.left = `${x - 15}px`;
  marker.style.top = `${y - 15}px`;
  els.arView.appendChild(marker);
  return marker;
}

export function removeMarkerEl(marker) {
  marker.remove();
}

export function playMarkerSound() {
  if (els.markerSound) els.markerSound.play();
}
