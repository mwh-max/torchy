// events.js
import { els } from "./dom.js";
import {
  snapshot,
  toggleMode,
  toggleTeammates,
  onArViewClick,
  initController,
} from "./controller.js";

export function wireEvents() {
  // one-time UI init
  initController(); //paint counts, mode, audio

  // listeners
  els.snapshotBtn.addEventListener("click", snapshot);
  els.toggleBtn.addEventListener("click", toggleMode);
  els.teammateBtn.addEventListener("click", toggleTeammates);
  els.arView.addEventListener("click", onArViewClick); // manual markers
}
