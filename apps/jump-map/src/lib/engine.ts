/**
 * The playable engine is the same bundle the pre-Vite site shipped —
 * public/assets/index-DCoPmObG.js — kept byte-for-byte so every mechanic
 * (4 themes, spikes, fake platforms, fall-recovery, coins, shop, characters,
 * time attack) and every saved record survives the rewrite.
 *
 * Its contract with the page, read straight off the bundle:
 *   - document.getElementById("game-canvas") must exist when it evaluates
 *   - document.querySelectorAll("[data-key]") wires the on-screen buttons
 *   - jm_lang / documentElement.lang decide the language it paints
 *   - localStorage["blockJumper:records"] holds records, coins and unlocks
 * So React renders the canvas and the touch pad first, sets the language, and
 * only then injects the module.
 */

const ENGINE_SRC = "/assets/index-DCoPmObG.js";

let injected = false;

export function startEngine(onReady: () => void): void {
  if (injected) {
    onReady();
    return;
  }
  injected = true;
  const script = document.createElement("script");
  script.type = "module";
  script.crossOrigin = "anonymous";
  script.src = ENGINE_SRC;
  script.addEventListener("load", onReady);
  document.body.appendChild(script);
}
