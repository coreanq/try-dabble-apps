(() => {
  const LANG_KEY = "ps_lang";
  const PROFILE_KEY = "photo-spec:profile:v1";
  const SETTINGS_KEY = "photo-spec:settings:v1";

  const PRESETS = {
    "in-ibps-photo": { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetInIbps" },
    "in-ssc-photo": { w: 413, h: 531, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetInSsc" },
    "in-upsc-photo": { w: 472, h: 591, minKB: 20, maxKB: 300, format: "jpeg", labelKey: "presetInUpsc", caption: true },
    "in-exam-sign": { w: 140, h: 60, minKB: 10, maxKB: 20, format: "jpeg", labelKey: "presetInSign" },
    "passport-2x2": { w: 600, h: 600, minKB: 50, maxKB: 200, format: "jpeg", labelKey: "presetPassport" },
    "kr-resume": { w: 300, h: 400, minKB: 30, maxKB: 100, format: "jpeg", labelKey: "presetKrResume" },
    custom: { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetCustom" }
  };

  const PROFILE_FIELDS = ["name", "dob", "phone", "email", "address", "father", "mother", "nid"];

  const els = {
    langSelect: document.getElementById("lang-select"),
    presetChips: document.getElementById("preset-chips"),
    customFields: document.getElementById("custom-fields"),
    customW: document.getElementById("custom-w"),
    customH: document.getElementById("custom-h"),
    customMin: document.getElementById("custom-minkb"),
    customMax: document.getElementById("custom-maxkb"),
    customFmt: document.getElementById("custom-fmt"),
    dropZone: document.getElementById("drop-zone"),
    fileInput: document.getElementById("file-input"),
    cameraInput: document.getElementById("camera-input"),
    clearPhoto: document.getElementById("clear-photo"),
    previewWrap: document.getElementById("preview-wrap"),
    previewEmpty: document.getElementById("preview-empty"),
    previewCanvas: document.getElementById("preview-canvas"),
    sizeLine: document.getElementById("size-line"),
    dragHint: document.getElementById("drag-hint"),
    downloadBtn: document.getElementById("download-btn"),
    toast: document.getElementById("toast")
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let settings = Object.assign({ preset: "in-ibps-photo", custom: { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg" } }, loadJson(SETTINGS_KEY, {}));
  if (settings.preset === "in-exam-photo") settings.preset = "in-ibps-photo";
  let profile = Object.assign({ name: "", dob: "", phone: "", email: "", address: "", father: "", mother: "", nid: "" }, loadJson(PROFILE_KEY, {}));
  let source = null; // ImageBitmap or HTMLImageElement
  let sourceW = 0;
  let sourceH = 0;
  let offsetX = 0;
  let offsetY = 0;
  let resultBlob = null;
  let resultMeta = null;
  let encodeTimer = 0;
  let drag = null;

  function t(key, vars) {
    const dict = (window.PS_I18N && window.PS_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.PS_I18N && window.PS_I18N.en[key]) || key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.replaceAll(`{${k}}`, String(vars[k])); });
    return s;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) { return fallback; }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function saveProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (_) {}
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove("show"), 1600);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function currentSpec() {
    if (settings.preset === "custom") {
      const w = clampInt(els.customW.value, 20, 4000, 200);
      const h = clampInt(els.customH.value, 20, 4000, 230);
      let minKB = clampInt(els.customMin.value, 1, 5000, 20);
      let maxKB = clampInt(els.customMax.value, 1, 5000, 50);
      if (maxKB < minKB) { const tmp = minKB; minKB = maxKB; maxKB = tmp; }
      const format = els.customFmt.value === "png" ? "png" : "jpeg";
      return { w, h, minKB, maxKB, format };
    }
    const p = PRESETS[settings.preset] || PRESETS["in-ibps-photo"];
    return { w: p.w, h: p.h, minKB: p.minKB, maxKB: p.maxKB, format: p.format, caption: !!p.caption };
  }

  function clampInt(v, lo, hi, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, Math.round(n)));
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title") + " — Photo Spec";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.PS_OG && (window.PS_OG[lang] || window.PS_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("title") + " — Photo Spec");
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", t("title") + " — Photo Spec");
    setText("brand-title", t("title"));
    setText("brand-tagline", t("tagline"));
    setText("about-text", t("about"));
    setText("presets-title", t("presets"));
    setText("source-title", t("source"));
    setText("drop-hint", t("dropHint"));
    setText("pick-file-label", t("pickFile"));
    setText("camera-label", t("camera"));
    setText("clear-photo", t("clearPhoto"));
    setText("preview-title", t("preview"));
    setText("preview-empty", t("previewEmpty"));
    setText("drag-hint", t("dragHint"));
    setText("download-btn", t("download"));
    setText("profile-title", t("profile"));
    setText("profile-hint", t("profileHint"));
    setText("label-width", t("width"));
    setText("label-height", t("height"));
    setText("label-minkb", t("minKb"));
    setText("label-maxkb", t("maxKb"));
    setText("label-format", t("format"));
    setText("label-name", t("name"));
    setText("label-dob", t("dob"));
    setText("label-phone", t("phone"));
    setText("label-email", t("email"));
    setText("label-address", t("address"));
    setText("label-father", t("father"));
    setText("label-mother", t("mother"));
    setText("label-nid", t("nid"));
    setText("link-privacy", t("privacy"));
    setText("link-terms", t("terms"));
    setText("caption-hint", t("captionHint"));
    const langLabel = document.getElementById("lang-label");
    if (langLabel) langLabel.textContent = t("langLabel");
    if (els.langSelect) {
      els.langSelect.value = lang;
      els.langSelect.setAttribute("aria-label", t("langLabel"));
    }
    document.querySelectorAll(".copy-btn").forEach((btn) => { btn.textContent = t("copy"); });
    renderPresetChips();
    updateSizeLine();
  }

  function setLang(next) {
    if (!window.PS_I18N[next]) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    applyStaticI18n();
  }

  function renderPresetChips() {
    const order = ["in-ibps-photo", "in-ssc-photo", "in-upsc-photo", "in-exam-sign", "passport-2x2", "kr-resume", "custom"];
    els.presetChips.innerHTML = "";
    order.forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (settings.preset === id ? " active" : "");
      btn.dataset.preset = id;
      btn.textContent = t(PRESETS[id].labelKey);
      els.presetChips.appendChild(btn);
    });
    els.customFields.hidden = settings.preset !== "custom";
    const cap = document.getElementById("caption-hint");
    if (cap) cap.hidden = settings.preset !== "in-upsc-photo";
  }

  function fillCustomInputs() {
    const c = settings.custom || PRESETS.custom;
    els.customW.value = c.w;
    els.customH.value = c.h;
    els.customMin.value = c.minKB;
    els.customMax.value = c.maxKB;
    els.customFmt.value = c.format === "png" ? "png" : "jpeg";
  }

  function fillProfile() {
    PROFILE_FIELDS.forEach((k) => {
      const el = document.getElementById("pf-" + k);
      if (el) el.value = profile[k] || "";
    });
  }

  function readProfileFromDom() {
    PROFILE_FIELDS.forEach((k) => {
      const el = document.getElementById("pf-" + k);
      if (el) profile[k] = el.value;
    });
    saveProfile();
  }

  async function loadImage(file) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (_) {}
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }

  async function setSource(file) {
    if (!file || !String(file.type || "").startsWith("image/")) return;
    try {
      const img = await loadImage(file);
      if (source && source.close) try { source.close(); } catch (_) {}
      source = img;
      sourceW = img.width;
      sourceH = img.height;
      offsetX = 0;
      offsetY = 0;
      els.clearPhoto.hidden = false;
      els.previewEmpty.hidden = true;
      els.previewCanvas.hidden = false;
      els.dragHint.hidden = false;
      scheduleEncode();
    } catch (_) {}
  }

  function clearSource() {
    if (source && source.close) try { source.close(); } catch (_) {}
    source = null;
    sourceW = 0;
    sourceH = 0;
    offsetX = 0;
    offsetY = 0;
    resultBlob = null;
    resultMeta = null;
    els.clearPhoto.hidden = true;
    els.previewEmpty.hidden = false;
    els.previewCanvas.hidden = true;
    els.dragHint.hidden = true;
    els.sizeLine.hidden = true;
    els.downloadBtn.disabled = true;
    const ctx = els.previewCanvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
  }


  function captionDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return dd + "-" + mm + "-" + d.getFullYear();
  }

  function drawCaption(ctx, outW, outH) {
    const barH = Math.max(22, Math.round(outH * 0.12));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, outH - barH, outW, barH);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const name = (profile.name || "").trim();
    const line = name ? (name + "  " + captionDate()) : captionDate();
    let font = Math.max(10, Math.round(barH * 0.42));
    ctx.font = "600 " + font + "px system-ui, sans-serif";
    while (font > 8 && ctx.measureText(line).width > outW - 8) {
      font -= 1;
      ctx.font = "600 " + font + "px system-ui, sans-serif";
    }
    ctx.fillText(line, outW / 2, outH - barH / 2);
  }

  function coverCrop(sw, sh, tw, th, ox, oy) {
    const targetAspect = tw / th;
    const sourceAspect = sw / sh;
    let cropW, cropH, cropX, cropY;
    if (sourceAspect > targetAspect) {
      cropH = sh;
      cropW = sh * targetAspect;
      cropX = (sw - cropW) / 2 + ox;
      cropY = oy;
    } else {
      cropW = sw;
      cropH = sw / targetAspect;
      cropX = ox;
      cropY = (sh - cropH) / 2 + oy;
    }
    cropX = Math.max(0, Math.min(sw - cropW, cropX));
    cropY = Math.max(0, Math.min(sh - cropH, cropY));
    return { cropX, cropY, cropW, cropH };
  }

  function clampOffsets(spec) {
    const { cropW, cropH } = coverCrop(sourceW, sourceH, spec.w, spec.h, 0, 0);
    const maxX = Math.max(0, (sourceW - cropW) / 2);
    const maxY = Math.max(0, (sourceH - cropH) / 2);
    offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
    offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
  }

  function drawToCanvas(outW, outH, spec) {
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const crop = coverCrop(sourceW, sourceH, spec.w, spec.h, offsetX, offsetY);
    ctx.drawImage(source, crop.cropX, crop.cropY, crop.cropW, crop.cropH, 0, 0, outW, outH);
    if (spec.caption) drawCaption(ctx, outW, outH);
    return canvas;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), type, quality);
    });
  }

  async function padBlob(blob, minBytes) {
    if (!blob || blob.size >= minBytes) return blob;
    const extra = minBytes - blob.size;
    const src = new Uint8Array(await blob.arrayBuffer());
    const buf = new Uint8Array(src.length + extra);
    buf.set(src);
    return new Blob([buf], { type: blob.type });
  }

  async function encodeJpegAtSize(canvas, minBytes, maxBytes) {
    let lo = 0.08;
    let hi = 0.95;
    let bestUnder = null;
    let bestIn = null;
    for (let i = 0; i < 14; i++) {
      const q = (lo + hi) / 2;
      const blob = await canvasToBlob(canvas, "image/jpeg", q);
      if (!blob) break;
      if (blob.size > maxBytes) {
        hi = q;
      } else if (blob.size < minBytes) {
        lo = q;
        if (!bestUnder || blob.size > bestUnder.size) bestUnder = { blob, q };
      } else {
        if (!bestIn || blob.size > bestIn.size) bestIn = { blob, q };
        lo = q;
      }
    }
    if (bestIn) return bestIn.blob;
    const high = await canvasToBlob(canvas, "image/jpeg", 0.95);
    if (high && high.size < minBytes) return padBlob(high, minBytes);
    const low = await canvasToBlob(canvas, "image/jpeg", 0.08);
    if (low && low.size <= maxBytes) {
      if (low.size < minBytes) return padBlob(low, minBytes);
      return low;
    }
    return low || high;
  }

  async function encodePngAtSize(canvas, minBytes, maxBytes) {
    let blob = await canvasToBlob(canvas, "image/png");
    if (!blob) return null;
    if (blob.size < minBytes) blob = await padBlob(blob, minBytes);
    return blob;
  }

  async function encodeNow() {
    if (!source) return;
    const spec = currentSpec();
    clampOffsets(spec);
    const mime = spec.format === "png" ? "image/png" : "image/jpeg";
    const minBytes = spec.minKB * 1024;
    const maxBytes = spec.maxKB * 1024;

    let scale = 1;
    let blob = null;
    let outW = spec.w;
    let outH = spec.h;

    while (scale >= 0.78) {
      outW = Math.max(20, Math.round(spec.w * scale));
      outH = Math.max(20, Math.round(spec.h * scale));
      const canvas = drawToCanvas(outW, outH, spec);
      blob = spec.format === "png"
        ? await encodePngAtSize(canvas, minBytes, maxBytes)
        : await encodeJpegAtSize(canvas, minBytes, maxBytes);
      if (blob && blob.size <= maxBytes) break;
      scale *= 0.96;
    }

    if (!blob) return;
    resultBlob = blob;
    const kb = blob.size / 1024;
    const inRange = kb >= spec.minKB - 0.01 && kb <= spec.maxKB + 0.01;
    resultMeta = { w: outW, h: outH, bytes: blob.size, kb, inRange, spec, mime };

    const preview = els.previewCanvas;
    preview.width = outW;
    preview.height = outH;
    const pctx = preview.getContext("2d");
    const tmp = drawToCanvas(outW, outH, spec);
    pctx.drawImage(tmp, 0, 0);

    updateSizeLine();
    els.downloadBtn.disabled = false;
  }

  function scheduleEncode() {
    clearTimeout(encodeTimer);
    encodeTimer = setTimeout(() => { encodeNow().catch(() => {}); }, 40);
  }

  function updateSizeLine() {
    if (!resultMeta) {
      els.sizeLine.hidden = true;
      return;
    }
    const { w, h, kb, inRange, spec } = resultMeta;
    els.sizeLine.hidden = false;
    els.sizeLine.textContent = t("sizeLine", { w, h, kb: kb.toFixed(1) }) + " · " +
      (inRange ? t("inRange", { min: spec.minKB, max: spec.maxKB }) : t("outRange", { min: spec.minKB, max: spec.maxKB }));
    els.sizeLine.classList.toggle("in-range", inRange);
    els.sizeLine.classList.toggle("out-range", !inRange);
  }

  function downloadResult() {
    if (!resultBlob || !resultMeta) return;
    const ext = resultMeta.mime === "image/png" ? "png" : "jpg";
    const kb = Math.max(1, Math.round(resultMeta.kb));
    const name = `photo-${resultMeta.w}x${resultMeta.h}-${kb}kb.${ext}`;
    const a = document.createElement("a");
    const url = URL.createObjectURL(resultBlob);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function blobFromClipboard(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return null;
    for (const it of items) {
      if (it.type && it.type.startsWith("image/")) return it.getAsFile();
    }
    return null;
  }

  function onPresetClick(e) {
    const btn = e.target.closest("[data-preset]");
    if (!btn) return;
    settings.preset = btn.dataset.preset;
    saveSettings();
    renderPresetChips();
    scheduleEncode();
  }

  function onCustomChange() {
    settings.custom = {
      w: clampInt(els.customW.value, 20, 4000, 200),
      h: clampInt(els.customH.value, 20, 4000, 230),
      minKB: clampInt(els.customMin.value, 1, 5000, 20),
      maxKB: clampInt(els.customMax.value, 1, 5000, 50),
      format: els.customFmt.value === "png" ? "png" : "jpeg"
    };
    saveSettings();
    scheduleEncode();
  }

  async function copyField(id) {
    const el = document.getElementById(id);
    const val = el ? String(el.value || "").trim() : "";
    if (!val) { showToast(t("emptyCopy")); return; }
    try {
      await navigator.clipboard.writeText(val);
      showToast(t("copied"));
    } catch (_) {
      el.focus();
      el.select();
      showToast(t("copied"));
    }
  }

  // drag crop
  function pointerPos(e) {
    const r = els.previewWrap.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  els.previewWrap.addEventListener("pointerdown", (e) => {
    if (!source) return;
    if (e.target.closest("button")) return;
    const spec = currentSpec();
    clampOffsets(spec);
    const p = pointerPos(e);
    drag = { x: p.x, y: p.y, ox: offsetX, oy: offsetY, spec };
    els.previewWrap.classList.add("dragging");
    els.previewWrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  els.previewWrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = pointerPos(e);
    const rect = els.previewCanvas.getBoundingClientRect();
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    const scaleX = sourceW / Math.max(1, rect.width);
    const scaleY = sourceH / Math.max(1, rect.height);
    offsetX = drag.ox - dx * scaleX;
    offsetY = drag.oy - dy * scaleY;
    clampOffsets(drag.spec);
    const tmp = drawToCanvas(els.previewCanvas.width || drag.spec.w, els.previewCanvas.height || drag.spec.h, drag.spec);
    const ctx = els.previewCanvas.getContext("2d");
    ctx.drawImage(tmp, 0, 0);
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    els.previewWrap.classList.remove("dragging");
    scheduleEncode();
  }
  els.previewWrap.addEventListener("pointerup", endDrag);
  els.previewWrap.addEventListener("pointercancel", endDrag);

  els.presetChips.addEventListener("click", onPresetClick);
  ["input", "change"].forEach((ev) => {
    els.customW.addEventListener(ev, onCustomChange);
    els.customH.addEventListener(ev, onCustomChange);
    els.customMin.addEventListener(ev, onCustomChange);
    els.customMax.addEventListener(ev, onCustomChange);
    els.customFmt.addEventListener(ev, onCustomChange);
  });

  els.fileInput.addEventListener("change", () => {
    const f = els.fileInput.files && els.fileInput.files[0];
    if (f) setSource(f);
    els.fileInput.value = "";
  });
  els.cameraInput.addEventListener("change", () => {
    const f = els.cameraInput.files && els.cameraInput.files[0];
    if (f) setSource(f);
    els.cameraInput.value = "";
  });
  els.clearPhoto.addEventListener("click", clearSource);
  els.downloadBtn.addEventListener("click", downloadResult);

  ["dragenter", "dragover"].forEach((ev) => {
    els.dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropZone.classList.add("over");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    els.dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropZone.classList.remove("over");
    });
  });
  els.dropZone.addEventListener("drop", (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setSource(f);
  });

  document.addEventListener("paste", async (e) => {
    const file = await blobFromClipboard(e);
    if (file) {
      e.preventDefault();
      setSource(file);
    }
  });

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => copyField(btn.getAttribute("data-copy")));
  });

  let profileTimer = 0;
  PROFILE_FIELDS.forEach((k) => {
    const el = document.getElementById("pf-" + k);
    if (!el) return;
    el.addEventListener("input", () => {
      clearTimeout(profileTimer);
      profileTimer = setTimeout(() => { readProfileFromDom(); if (currentSpec().caption) scheduleEncode(); }, 200);
    });
  });

  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  fillCustomInputs();
  fillProfile();
  applyStaticI18n();
})();
