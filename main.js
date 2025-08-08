import { els } from "./dom.js";

// 📍 Marker System
let hazardMarkers = [];
const maxMarkers = 5;

// 🚩 Mode State
const MODES = { THERMAL: "thermal", BLUEPRINT: "blueprint", FOG: "fog" };
let currentMode = MODES.THERMAL;

// 👥 Teammates
const teammates = document.querySelectorAll(".teammate");
let frozenTeammates = new Set();

// 📈 Helpers
function updateMarkerCount() {
  document.getElementById(
    "markerCount"
  ).textContent = `Markers: ${hazardMarkers.length} / ${maxMarkers}`;
}

function updateStatus(msg, color = "#fff") {
  statusDisplay.textContent = msg;
  statusDisplay.style.color = color;
}

function placeHazard(x, y, type = "manual") {
  const marker = document.createElement("div");
  marker.classList.add("hazard-marker");
  if (type === "gas") marker.classList.add("gas-auto");
  marker.style.left = `${x - 15}px`;
  marker.style.top = `${y - 15}px`;
  arView.appendChild(marker);
  hazardMarkers.push(marker);
  updateMarkerCount();

  marker.addEventListener("click", (e) => {
    e.stopPropagation();
    marker.remove();
    hazardMarkers = hazardMarkers.filter((m) => m !== marker);
    updateMarkerCount();
  });

  if (markerSound) markerSound.play();
}

function isNearHazard(teammate) {
  const tx = teammate.offsetLeft + 15;
  const ty = teammate.offsetTop + 15;
  return hazardMarkers.some((h) => {
    const hx = h.offsetLeft + 15;
    const hy = h.offsetTop + 15;
    return Math.hypot(hx - tx, hy - ty) < 50;
  });
}

function handleFogAudio(mode) {
  if (!fogAudio) return;
  if (mode === MODES.FOG) {
    fogAudio.volume = 0.6;
    fogAudio.loop = true;
    fogAudio.play().catch(() => {});
  } else {
    fogAudio.pause();
    fogAudio.currentTime = 0;
  }
}

// 🎮 Mode Toggle
toggleBtn.addEventListener("click", () => {
  if (currentMode === MODES.THERMAL) {
    currentMode = MODES.BLUEPRINT;
    arView.className = "blueprint";
  } else if (currentMode === MODES.BLUEPRINT) {
    currentMode = MODES.FOG;
    arView.className = "foggy";
  } else {
    currentMode = MODES.THERMAL;
    arView.className = "thermal";
  }
  updateStatus(`Mode: ${currentMode.toUpperCase()}`);
  handleFogAudio(currentMode);
});

// 📸 Snapshot
snapshotBtn.addEventListener("click", () => {
  html2canvas(arView).then((canvas) => {
    const link = document.createElement("a");
    link.download = "ar_snapshot.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});

// 👥 Toggle Teammates
teammateBtn.addEventListener("click", () => {
  teammates.forEach((t) => t.classList.toggle("hidden"));
});

// 🧱 Click to Add Manual Hazard
arView.addEventListener("click", (e) => {
  if (currentMode === MODES.FOG) return;
  if (hazardMarkers.length >= maxMarkers) return;

  const rect = arView.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  placeHazard(x, y);
});

// 🔁 Simulate Gas Detection
setInterval(() => {
  if (currentMode !== MODES.BLUEPRINT || hazardMarkers.length >= maxMarkers)
    return;
  if (Math.random() < 0.5) {
    const x = Math.random() * arView.clientWidth;
    const y = Math.random() * arView.clientHeight;
    placeHazard(x, y, "gas");
  }
}, 6000);

// 🔁 Teammate Movement + Hazard Reaction
function moveTeammate(wrapper, teammate) {
  if (frozenTeammates.has(teammate.id)) return;

  const deltaX = (Math.random() - 0.5) * 30;
  const deltaY = (Math.random() - 0.5) * 30;
  const newX = Math.min(
    arView.clientWidth - 60,
    Math.max(0, wrapper.offsetLeft + deltaX)
  );
  const newY = Math.min(
    arView.clientHeight - 60,
    Math.max(0, wrapper.offsetTop + deltaY)
  );

  wrapper.style.left = `${newX}px`;
  wrapper.style.top = `${newY}px`;

  if (isNearHazard(wrapper)) {
    updateStatus(`⚠️ ${teammate.id} frozen near hazard!`, "red");
    wrapper.classList.add("alert");
    frozenTeammates.add(teammate.id);
    setTimeout(() => {
      wrapper.classList.remove("alert");
      frozenTeammates.delete(teammate.id);
      updateStatus(`✔️ ${teammate.id} recovered`, "lime");
    }, 3000);
  }
}

setInterval(() => {
  teammates.forEach((t) => {
    const wrapper = t.closest(".teammate-wrapper");
    moveTeammate(wrapper, t);
  });
}, 2000);
