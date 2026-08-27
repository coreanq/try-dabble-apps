/**
 * The game engine is a pre-built bundle (public/assets/index-DCoPmObG.js) the
 * rewrite keeps byte-for-byte, so the thing worth testing is the contract the
 * new React shell has to honour: a #game-canvas to grab, [data-key] buttons to
 * bind, a language on <html>, and localStorage under the original keys.
 *
 * This boots the real bundle against a hand-rolled DOM and checks it wires
 * itself up and paints frames. No browser: this box OOMs on one.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { transform } from "esbuild";

/** src/lib/hud-i18n.ts patches fillText, so it has to be real code, not a
 *  copy of its table: compile it and run the module the browser would run. */
async function loadHudI18n() {
  const source = await readFile("src/lib/hud-i18n.ts", "utf8");
  const { code } = await transform(source, { loader: "ts", format: "esm" });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

function stubContext(calls) {
  // The HUD patch swaps CanvasRenderingContext2D.prototype.fillText, so the
  // context has to inherit from that prototype the way a real one does.
  class Ctx2D {}
  Ctx2D.prototype.fillText = function fillText(text, x, y) {
    calls.fillText.push([text, x, y]);
  };
  globalThis.CanvasRenderingContext2D = Ctx2D;

  const target = Object.assign(Object.create(Ctx2D.prototype), {
    canvas: null,
    measureText: (text) => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    strokeText: (text) => calls.fillText.push([text]),
    fillRect: (...args) => calls.fillRect.push(args),
    drawImage: () => {},
  });
  return new Proxy(target, {
    get(obj, prop) {
      // `in` walks the prototype, so fillText resolves to whatever the HUD
      // patch installed there.
      if (prop in obj) return obj[prop];
      // Every other 2d method is a no-op; every other property reads back as
      // whatever was last assigned (fillStyle, font, globalAlpha...).
      obj[prop] = () => {};
      return obj[prop];
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    },
  });
}

function stubCanvas(calls) {
  const ctx = stubContext(calls);
  const canvas = {
    width: 300,
    height: 150,
    style: {},
    getContext: () => ctx,
    addEventListener: (type) => calls.canvasEvents.add(type),
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
    setAttribute() {},
  };
  ctx.canvas = canvas;
  return canvas;
}

function stubButton(key, calls) {
  return {
    dataset: { key },
    getAttribute: (name) => (name === "data-key" ? key : null),
    addEventListener: (type) => calls.buttonEvents.add(type),
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
  };
}

function installDom(calls, lang) {
  const store = new Map();
  const documentElement = { lang, style: {}, classList: { add() {}, remove() {} } };
  const buttons = [" ", "ArrowLeft", "ArrowRight", "m"].map((k) => stubButton(k, calls));
  const canvas = stubCanvas(calls);

  const doc = {
    documentElement,
    hidden: false,
    visibilityState: "visible",
    body: { appendChild() {}, style: {} },
    head: { appendChild() {} },
    cookie: "",
    getElementById: (id) => (id === "game-canvas" ? canvas : null),
    querySelector: () => null,
    querySelectorAll: (sel) => (sel === "[data-key]" ? buttons : []),
    createElement: (tag) =>
      tag === "canvas"
        ? stubCanvas(calls)
        : { relList: { supports: () => true }, style: {}, setAttribute() {}, appendChild() {} },
    addEventListener: (type) => calls.docEvents.add(type),
    removeEventListener: () => {},
  };

  let frames = 0;
  globalThis.document = doc;
  globalThis.window = {
    addEventListener: (type) => calls.winEvents.add(type),
    removeEventListener: () => {},
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 720,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  };
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
      calls.storage.add(k);
    },
    removeItem: (k) => store.delete(k),
  };
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = (fn) => {
    // Run a short burst of frames, then let the loop die so the test ends.
    if (frames++ < 8) queueMicrotask(() => fn(performance.now()));
    return frames;
  };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.AudioContext = class {
    createOscillator() {
      return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {} } };
    }
    createGain() {
      return { connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    get destination() {
      return {};
    }
    get currentTime() {
      return 0;
    }
  };
  globalThis.fetch = async () => ({ ok: true });

  return { canvas, buttons, store };
}

test("the bundled engine boots against the shell's DOM and paints", async () => {
  const calls = {
    fillText: [],
    fillRect: [],
    canvasEvents: new Set(),
    buttonEvents: new Set(),
    docEvents: new Set(),
    winEvents: new Set(),
    storage: new Set(),
  };
  const { canvas } = installDom(calls, "en");

  const { setHudLang } = await loadHudI18n();
  setHudLang("en");

  await import(pathToFileURL("public/assets/index-DCoPmObG.js").href);
  await new Promise((resolve) => setTimeout(resolve, 60));

  // 16:9 pixel canvas, taken over by the engine itself.
  assert.equal(canvas.width, 960);
  assert.equal(canvas.height, 540);

  // Keyboard, canvas pointer input and the on-screen pad are all wired.
  assert.ok(calls.winEvents.has("keydown"), "keydown is bound to the window");
  assert.ok(calls.winEvents.has("keyup"), "keyup is bound to the window");
  assert.ok(calls.canvasEvents.has("pointerdown"), "the canvas takes pointer taps");
  assert.ok(calls.buttonEvents.has("pointerdown"), "[data-key] buttons are bound");

  // It is drawing: blocks and HUD text both reach the 2d context.
  assert.ok(calls.fillRect.length > 0, "the engine paints blocks");
  assert.ok(calls.fillText.length > 0, "the engine paints HUD text");

  // ...and the menu it paints is in the language the shell asked for. The
  // engine hard-codes its menu in Korean, so this is the fillText patch.
  const painted = calls.fillText.map(([text]) => String(text));
  assert.ok(
    painted.includes("Easy") && painted.includes("Normal") && painted.includes("Insane"),
    `difficulty labels were not translated: ${painted.join(" | ")}`,
  );
  assert.ok(
    painted.some((line) => line.includes("Keyboard:") && line.includes("jump")),
    "the control hint was not translated",
  );
  assert.ok(
    !painted.some((line) => /[\uac00-\ud7a3]/.test(line)),
    `Korean text leaked into the English HUD: ${painted.filter((l) => /[\uac00-\ud7a3]/.test(l)).join(" | ")}`,
  );
});
