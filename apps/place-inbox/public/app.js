(() => {
  const LANG_KEY = "pi_lang";
  const SETTINGS_KEY = "place-inbox:settings:v1";
  const DB_NAME = "place-inbox";
  const DB_VER = 1;
  const TAGS = ["food", "hike", "city", "beach", "stay"];

  const els = {
    langSelect: document.getElementById("lang-select"),
    search: document.getElementById("search"),
    tripStrip: document.getElementById("trip-strip"),
    placeGrid: document.getElementById("place-grid"),
    placesEmpty: document.getElementById("places-empty"),
    addTripBtn: document.getElementById("add-trip-btn"),
    addPlaceBtn: document.getElementById("add-place-btn"),
    tagFilters: document.getElementById("tag-filters"),
    rankFilters: document.getElementById("rank-filters"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    toast: document.getElementById("toast"),
    map: document.getElementById("map"),
    mapEmpty: document.getElementById("map-empty"),
    placeDialog: document.getElementById("place-dialog"),
    placeForm: document.getElementById("place-form"),
    placeId: document.getElementById("place-id"),
    placeName: document.getElementById("place-name"),
    placeUrl: document.getElementById("place-url"),
    placeWhy: document.getElementById("place-why"),
    placeRank: document.getElementById("place-rank"),
    placeTrip: document.getElementById("place-trip"),
    placeMaps: document.getElementById("place-maps"),
    placeIg: document.getElementById("place-ig"),
    placePinterest: document.getElementById("place-pinterest"),
    placeLatlng: document.getElementById("place-latlng"),
    placeFile: document.getElementById("place-file"),
    placePreview: document.getElementById("place-preview"),
    placeDropHint: document.getElementById("place-drop-hint"),
    placeClearPhoto: document.getElementById("place-clear-photo"),
    placeDelete: document.getElementById("place-delete"),
    placeCancel: document.getElementById("place-cancel"),
    tripDialog: document.getElementById("trip-dialog"),
    tripForm: document.getElementById("trip-form"),
    tripId: document.getElementById("trip-id"),
    tripName: document.getElementById("trip-name"),
    tripDelete: document.getElementById("trip-delete"),
    tripCancel: document.getElementById("trip-cancel"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmText: document.getElementById("confirm-text"),
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let settings = Object.assign({ filterTrip: "", filterTag: "", filterRank: "" }, loadJson(SETTINGS_KEY, {}));
  let places = [];
  let trips = [];
  let filterTrip = settings.filterTrip || "";
  let filterTag = settings.filterTag || "";
  let filterRank = settings.filterRank || "";
  let query = "";
  let pendingPhotoBlob = null;
  let pendingPhotoId = null;
  let objectUrls = [];
  let confirmAction = null;
  let leafletMap = null;
  let leafletLayer = null;
  let dbp = openDb();

  function t(key, vars) {
    const dict = (window.PI_I18N && window.PI_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.PI_I18N && window.PI_I18N.en[key]) || key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.replaceAll(`{${k}}`, String(vars[k])); });
    return s;
  }

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
    settings.filterTrip = filterTrip;
    settings.filterTag = filterTag;
    settings.filterRank = filterRank;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("places")) db.createObjectStore("places", { keyPath: "id" });
        if (!db.objectStoreNames.contains("trips")) db.createObjectStore("trips", { keyPath: "id" });
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function idbPut(store, value, key) {
    const db = await dbp;
    const tx = db.transaction(store, "readwrite");
    if (key !== undefined) tx.objectStore(store).put(value, key);
    else tx.objectStore(store).put(value);
    return txDone(tx);
  }

  async function idbGet(store, key) {
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGetAll(store) {
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbDel(store, key) {
    const db = await dbp;
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    return txDone(tx);
  }

  async function putPhoto(id, blob) { await idbPut("photos", blob, id); return id; }
  async function getPhoto(id) { if (!id) return null; return idbGet("photos", id); }
  async function delPhoto(id) { if (!id) return; return idbDel("photos", id); }

  async function savePlace(rec) { await idbPut("places", rec); }
  async function saveTrip(rec) { await idbPut("trips", rec); }

  function urlFor(blob) {
    if (!blob) return "";
    const u = URL.createObjectURL(blob);
    objectUrls.push(u);
    return u;
  }

  function revokeUrls() {
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    objectUrls = [];
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setAttr(id, name, val) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(name, val);
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title") + " — Place Inbox";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.PI_OG && (window.PI_OG[lang] || window.PI_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    setText("brand-title", t("title"));
    setText("brand-tagline", t("tagline"));
    setText("about-text", t("about"));
    setText("trips-title", t("trips"));
    setText("places-title", t("places"));
    setText("map-title", t("mapTitle"));
    setText("tools-title", t("tools"));
    setText("add-trip-btn", t("addTrip"));
    setText("add-place-btn", t("addPlace"));
    setText("export-btn", t("exportJson"));
    setText("import-label", t("importJson"));
    setText("link-privacy", t("privacy"));
    setText("link-terms", t("terms"));
    setText("lang-label", t("langLabel"));
    setText("search-label", t("search"));
    setText("places-empty", t("emptyPlaces"));
    setText("map-empty", t("emptyMap"));
    setText("tag-filter-label", t("tagFilter"));
    setText("rank-filter-label", t("rankFilter"));
    setText("sort-hint", t("sortHint"));
    setText("place-drop-hint", t("dropHint"));
    setText("pick-file-label", t("pickFile"));
    setText("place-clear-photo", t("clearPhoto"));
    setText("label-place-name", t("placeName"));
    setText("label-place-url", t("placeUrl"));
    setText("label-why", t("why"));
    setText("label-rank", t("rank"));
    setText("label-tags", t("tags"));
    setText("label-trip", t("trip"));
    setText("label-extra-links", t("extraLinks"));
    setText("label-maps-url", t("mapsUrl"));
    setText("label-ig-url", t("igUrl"));
    setText("label-pinterest-url", t("pinterestUrl"));
    setText("label-latlng", t("latlng"));
    setText("label-trip-name", t("tripName"));
    setText("place-cancel", t("cancel"));
    setText("place-save", t("save"));
    setText("place-delete", t("delete"));
    setText("trip-cancel", t("cancel"));
    setText("trip-save", t("save"));
    setText("trip-delete", t("delete"));
    setText("confirm-cancel", t("cancel"));
    setText("confirm-ok", t("delete"));
    setText("confirm-text", t("deletePlaceConfirm"));
    setText("check-food", t("tagFood"));
    setText("check-hike", t("tagHike"));
    setText("check-city", t("tagCity"));
    setText("check-beach", t("tagBeach"));
    setText("check-stay", t("tagStay"));
    setAttr("search", "aria-label", t("search"));
    setAttr("search", "placeholder", t("search"));
    setAttr("lang-select", "aria-label", t("langLabel"));
    setAttr("add-trip-btn", "aria-label", t("addTripAria"));
    setAttr("add-place-btn", "aria-label", t("addPlaceAria"));
    setAttr("place-name", "placeholder", t("placeNamePh"));
    setAttr("place-why", "placeholder", t("whyPh"));
    setAttr("place-latlng", "placeholder", t("latlngPh"));
    setAttr("trip-name", "placeholder", t("tripNamePh"));
    const tagMap = { "": "tagAll", food: "tagFood", hike: "tagHike", city: "tagCity", beach: "tagBeach", stay: "tagStay" };
    els.tagFilters.querySelectorAll("[data-tag]").forEach((c) => {
      c.textContent = t(tagMap[c.dataset.tag] || "tagAll");
      c.classList.toggle("active", (c.dataset.tag || "") === filterTag);
    });
    els.rankFilters.querySelectorAll("[data-rank]").forEach((c) => {
      const v = c.dataset.rank;
      c.textContent = v ? t("rankN", { n: v }) : t("rankAll");
      c.classList.toggle("active", (v || "") === filterRank);
    });
    if (els.placeRank) {
      els.placeRank.querySelectorAll("option").forEach((opt) => {
        opt.textContent = t("stars", { n: opt.value });
      });
    }
    if (els.langSelect) els.langSelect.value = lang;
    fillTripSelect();
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    if (typeof window.persistLangQuery === "function") window.persistLangQuery(lang);
    applyStaticI18n();
    render();
  }

  function fillTripSelect(selected) {
    if (!els.placeTrip) return;
    const cur = selected != null ? selected : els.placeTrip.value;
    const opts = [`<option value="">${esc(t("inbox"))}</option>`];
    trips.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach((tr) => {
      opts.push(`<option value="${esc(tr.id)}">${esc(tr.name)}</option>`);
    });
    els.placeTrip.innerHTML = opts.join("");
    els.placeTrip.value = cur || "";
  }

  function matchesQuery(text) {
    if (!query) return true;
    return (text || "").toLowerCase().includes(query);
  }

  function parseLatLng(s) {
    if (!s) return { lat: null, lng: null };
    const m = String(s).trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return { lat: null, lng: null };
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { lat: null, lng: null };
    return { lat, lng };
  }

  function formatLatLng(lat, lng) {
    if (lat == null || lng == null) return "";
    return `${lat}, ${lng}`;
  }

  function stars(n) {
    const r = Math.max(1, Math.min(5, Number(n) || 3));
    return "★".repeat(r) + "☆".repeat(5 - r);
  }

  function tagLabel(tag) {
    const map = { food: "tagFood", hike: "tagHike", city: "tagCity", beach: "tagBeach", stay: "tagStay" };
    return t(map[tag] || tag);
  }

  function tripName(id) {
    if (!id) return t("inbox");
    const tr = trips.find((x) => x.id === id);
    return tr ? tr.name : t("inbox");
  }

  async function render() {
    revokeUrls();
    const tripButtons = [
      `<button type="button" class="trip-chip${filterTrip === "" ? " active" : ""}" data-filter-trip="">${esc(t("allTrips"))}</button>`,
      `<button type="button" class="trip-chip${filterTrip === "__inbox__" ? " active" : ""}" data-filter-trip="__inbox__">${esc(t("inbox"))}</button>`
    ];
    trips.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).forEach((tr) => {
      tripButtons.push(`<button type="button" class="trip-chip${filterTrip === tr.id ? " active" : ""}" data-filter-trip="${esc(tr.id)}" data-edit-trip="${esc(tr.id)}">${esc(tr.name)}</button>`);
    });
    els.tripStrip.innerHTML = tripButtons.join("");

    let shown = places.slice().sort((a, b) => (b.rank || 0) - (a.rank || 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
    if (filterTrip === "__inbox__") shown = shown.filter((p) => !p.tripId);
    else if (filterTrip) shown = shown.filter((p) => p.tripId === filterTrip);
    if (filterTag) shown = shown.filter((p) => (p.tags || []).includes(filterTag));
    if (filterRank) shown = shown.filter((p) => String(p.rank) === String(filterRank));
    if (query) {
      shown = shown.filter((p) => matchesQuery([
        p.name, p.why, p.url, p.mapsUrl, p.igUrl, p.pinterestUrl, tripName(p.tripId), (p.tags || []).join(" ")
      ].filter(Boolean).join(" ")));
    }

    els.placesEmpty.textContent = t("emptyPlaces");
    els.placesEmpty.hidden = shown.length > 0;
    const cards = [];
    for (const p of shown) {
      const blob = await getPhoto(p.photoId);
      const src = blob ? urlFor(blob) : "";
      const tags = (p.tags || []).map((tg) => tagLabel(tg)).join(" · ");
      cards.push(`<button type="button" class="place-card" data-edit-place="${esc(p.id)}">
        <div class="thumb">${src ? `<img src="${src}" alt="">` : "📍"}</div>
        <div class="meta">
          <div class="ttl">${esc(p.name || p.url || "…")}</div>
          <div class="stars">${esc(stars(p.rank))}</div>
          <div class="sub">${esc(tripName(p.tripId))}${tags ? " · " + esc(tags) : ""}</div>
          ${p.why ? `<div class="why">${esc(p.why)}</div>` : ""}
        </div>
      </button>`);
    }
    els.placeGrid.innerHTML = cards.join("");
    renderMap(shown);
    fillTripSelect();
  }

  function renderMap(list) {
    const pinned = (list || places).filter((p) => p.lat != null && p.lng != null);
    els.mapEmpty.textContent = t("emptyMap");
    if (!pinned.length) {
      els.mapEmpty.hidden = false;
      els.map.hidden = true;
      return;
    }
    els.mapEmpty.hidden = true;
    els.map.hidden = false;
    if (typeof L === "undefined") {
      els.map.innerHTML = pinned.map((p) => {
        return `<div class="empty" style="text-align:left;padding:0.4rem 0">${esc(p.name || "…")} · ${esc(p.lat)}, ${esc(p.lng)}</div>`;
      }).join("");
      return;
    }
    if (!leafletMap) {
      leafletMap = L.map(els.map, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(leafletMap);
    }
    if (leafletLayer) leafletLayer.clearLayers();
    else leafletLayer = L.layerGroup().addTo(leafletMap);
    const bounds = [];
    pinned.forEach((p) => {
      const m = L.marker([p.lat, p.lng]);
      m.bindPopup(`<strong>${esc(p.name || "…")}</strong><br>${esc(stars(p.rank))}`);
      m.on("click", () => { /* popup handles it */ });
      leafletLayer.addLayer(m);
      bounds.push([p.lat, p.lng]);
    });
    setTimeout(() => {
      try {
        leafletMap.invalidateSize();
        if (bounds.length === 1) leafletMap.setView(bounds[0], 12);
        else leafletMap.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
      } catch (_) {}
    }, 80);
  }

  function readTags() {
    return TAGS.filter((tag) => {
      const box = document.querySelector(`input[name="place-tag"][value="${tag}"]`);
      return box && box.checked;
    });
  }

  function writeTags(list) {
    const set = new Set(list || []);
    document.querySelectorAll('input[name="place-tag"]').forEach((box) => {
      box.checked = set.has(box.value);
    });
  }

  function showPlacePhoto(blob) {
    const src = urlFor(blob);
    els.placePreview.src = src;
    els.placePreview.hidden = !src;
    els.placeDropHint.hidden = !!src;
    els.placeClearPhoto.hidden = !src;
  }

  function resetPlaceForm() {
    els.placeForm.reset();
    els.placeId.value = "";
    pendingPhotoBlob = null;
    pendingPhotoId = null;
    els.placePreview.hidden = true;
    els.placePreview.removeAttribute("src");
    els.placeDropHint.hidden = false;
    els.placeClearPhoto.hidden = true;
    els.placeDelete.hidden = true;
    els.placeRank.value = "3";
    writeTags([]);
    fillTripSelect("");
    if (filterTrip && filterTrip !== "__inbox__") els.placeTrip.value = filterTrip;
    setText("place-form-title", t("placeAdd"));
    setText("place-save", t("save"));
  }

  async function openPlace(place, blob) {
    resetPlaceForm();
    if (place) {
      els.placeId.value = place.id;
      els.placeName.value = place.name || "";
      els.placeUrl.value = place.url || "";
      els.placeWhy.value = place.why || "";
      els.placeRank.value = String(place.rank || 3);
      els.placeMaps.value = place.mapsUrl || "";
      els.placeIg.value = place.igUrl || "";
      els.placePinterest.value = place.pinterestUrl || "";
      els.placeLatlng.value = formatLatLng(place.lat, place.lng);
      writeTags(place.tags);
      fillTripSelect(place.tripId || "");
      pendingPhotoId = place.photoId || null;
      els.placeDelete.hidden = false;
      setText("place-form-title", t("placeEdit"));
      setText("place-save", t("update"));
      if (place.photoId) {
        const existing = await getPhoto(place.photoId);
        if (existing) showPlacePhoto(existing);
      }
    }
    if (blob) {
      pendingPhotoBlob = blob;
      showPlacePhoto(blob);
    }
    els.placeDialog.showModal();
  }

  function resetTripForm() {
    els.tripForm.reset();
    els.tripId.value = "";
    els.tripDelete.hidden = true;
    setText("trip-form-title", t("tripAdd"));
    setText("trip-save", t("save"));
  }

  function openTrip(trip) {
    resetTripForm();
    if (trip) {
      els.tripId.value = trip.id;
      els.tripName.value = trip.name || "";
      els.tripDelete.hidden = false;
      setText("trip-form-title", t("tripEdit"));
      setText("trip-save", t("update"));
    }
    els.tripDialog.showModal();
    els.tripName.focus();
  }

  function confirmDelete(message, action) {
    confirmAction = action;
    els.confirmText.textContent = message;
    els.confirmDialog.showModal();
  }

  function blobFromFile(file) {
    return file && file.type && file.type.startsWith("image/") ? file : null;
  }

  async function blobFromClipboard(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return null;
    for (const it of items) {
      if (it.type.startsWith("image/")) return it.getAsFile();
    }
    return null;
  }

  function textFromClipboard(e) {
    const text = e.clipboardData && e.clipboardData.getData("text");
    return text ? String(text).trim() : "";
  }

  function looksLikeUrl(s) {
    return /^https?:\/\//i.test(s) || /^www\./i.test(s);
  }

  function dataUrlToBlob(dataUrl) {
    const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    const bin = atob(m[2]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      places,
      trips,
      photos: {},
      photoSkipped: false
    };
    try {
      for (const p of places) {
        if (!p.photoId) continue;
        const blob = await getPhoto(p.photoId);
        if (blob) payload.photos[p.photoId] = await blobToDataUrl(blob);
      }
    } catch (_) {
      payload.photoSkipped = true;
      payload.photos = {};
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `place-inbox-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(payload.photoSkipped ? t("photoSkipped") : t("exported"));
  }

  async function importJson(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.places)) throw new Error("bad");
      places = data.places;
      trips = Array.isArray(data.trips) ? data.trips : [];
      const db = await dbp;
      const tx = db.transaction(["places", "trips", "photos"], "readwrite");
      tx.objectStore("places").clear();
      tx.objectStore("trips").clear();
      places.forEach((p) => tx.objectStore("places").put(p));
      trips.forEach((tr) => tx.objectStore("trips").put(tr));
      if (data.photos && typeof data.photos === "object") {
        for (const [id, url] of Object.entries(data.photos)) {
          const blob = dataUrlToBlob(url);
          if (blob) tx.objectStore("photos").put(blob, id);
        }
      }
      await txDone(tx);
      showToast(t("imported"));
      applyStaticI18n();
      render();
    } catch (_) {
      showToast(t("importFail"));
    }
  }

  els.addPlaceBtn.addEventListener("click", () => openPlace(null));
  els.addTripBtn.addEventListener("click", () => openTrip(null));
  els.placeCancel.addEventListener("click", () => els.placeDialog.close());
  els.tripCancel.addEventListener("click", () => els.tripDialog.close());
  els.placeFile.addEventListener("change", () => {
    const f = blobFromFile(els.placeFile.files[0]);
    if (!f) return;
    pendingPhotoBlob = f;
    showPlacePhoto(f);
  });
  els.placeClearPhoto.addEventListener("click", () => {
    pendingPhotoBlob = null;
    pendingPhotoId = null;
    els.placePreview.hidden = true;
    els.placePreview.removeAttribute("src");
    els.placeDropHint.hidden = false;
    els.placeClearPhoto.hidden = true;
  });

  els.placeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = els.placeName.value.trim();
    const url = els.placeUrl.value.trim();
    const coords = parseLatLng(els.placeLatlng.value);
    let id = els.placeId.value || uid();
    let existing = places.find((p) => p.id === id);
    let photoId = existing ? existing.photoId : pendingPhotoId;
    if (pendingPhotoBlob) {
      photoId = photoId || uid();
      await putPhoto(photoId, pendingPhotoBlob);
    }
    if (!name && !url && !photoId) {
      showToast(t("needName"));
      return;
    }
    const rec = {
      id,
      name,
      url,
      why: els.placeWhy.value.trim(),
      rank: Math.max(1, Math.min(5, Number(els.placeRank.value) || 3)),
      tags: readTags(),
      tripId: els.placeTrip.value || "",
      mapsUrl: els.placeMaps.value.trim(),
      igUrl: els.placeIg.value.trim(),
      pinterestUrl: els.placePinterest.value.trim(),
      lat: coords.lat,
      lng: coords.lng,
      photoId: photoId || null,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    if (existing) places = places.map((p) => p.id === id ? rec : p);
    else places.push(rec);
    await savePlace(rec);
    els.placeDialog.close();
    showToast(t("saved"));
    render();
  });

  els.tripForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = els.tripName.value.trim();
    if (!name) { showToast(t("needName")); return; }
    let id = els.tripId.value || uid();
    let existing = trips.find((tr) => tr.id === id);
    const rec = {
      id,
      name,
      createdAt: existing ? existing.createdAt : Date.now()
    };
    if (existing) trips = trips.map((tr) => tr.id === id ? rec : tr);
    else trips.push(rec);
    await saveTrip(rec);
    els.tripDialog.close();
    showToast(t("saved"));
    applyStaticI18n();
    render();
  });

  els.placeDelete.addEventListener("click", () => {
    const id = els.placeId.value;
    const place = places.find((x) => x.id === id);
    if (!place) return;
    confirmDelete(t("deletePlaceConfirm"), async () => {
      places = places.filter((x) => x.id !== id);
      await idbDel("places", id);
      await delPhoto(place.photoId);
      els.placeDialog.close();
      showToast(t("deleted"));
      render();
    });
  });

  els.tripDelete.addEventListener("click", () => {
    const id = els.tripId.value;
    const trip = trips.find((x) => x.id === id);
    if (!trip) return;
    confirmDelete(t("deleteTripConfirm", { name: trip.name }), async () => {
      trips = trips.filter((x) => x.id !== id);
      places = places.map((p) => p.tripId === id ? { ...p, tripId: "", updatedAt: Date.now() } : p);
      await idbDel("trips", id);
      for (const p of places.filter((x) => !x.tripId)) await savePlace(p);
      if (filterTrip === id) filterTrip = "";
      saveSettings();
      els.tripDialog.close();
      showToast(t("deleted"));
      applyStaticI18n();
      render();
    });
  });

  els.confirmDialog.addEventListener("close", () => {
    if (els.confirmDialog.returnValue === "confirm" && confirmAction) confirmAction();
    confirmAction = null;
  });

  document.addEventListener("click", (e) => {
    const ft = e.target.closest("[data-filter-trip]");
    if (ft && ft.closest("#trip-strip")) {
      const id = ft.getAttribute("data-filter-trip");
      if (ft.hasAttribute("data-edit-trip") && filterTrip === id) {
        const tr = trips.find((x) => x.id === id);
        if (tr) openTrip(tr);
        return;
      }
      filterTrip = id;
      saveSettings();
      applyStaticI18n();
      render();
      return;
    }
    const ep = e.target.closest("[data-edit-place]");
    if (ep) {
      const place = places.find((x) => x.id === ep.getAttribute("data-edit-place"));
      if (place) openPlace(place);
    }
  });

  els.tripStrip.addEventListener("dblclick", (e) => {
    const btn = e.target.closest("[data-edit-trip]");
    if (!btn) return;
    const tr = trips.find((x) => x.id === btn.getAttribute("data-edit-trip"));
    if (tr) openTrip(tr);
  });

  els.tagFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tag]");
    if (!btn) return;
    filterTag = btn.dataset.tag || "";
    saveSettings();
    applyStaticI18n();
    render();
  });

  els.rankFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rank]");
    if (!btn) return;
    filterRank = btn.dataset.rank || "";
    saveSettings();
    applyStaticI18n();
    render();
  });

  els.search.addEventListener("input", () => {
    query = els.search.value.trim().toLowerCase();
    render();
  });

  els.exportBtn.addEventListener("click", exportJson);
  els.importFile.addEventListener("change", () => {
    const f = els.importFile.files[0];
    if (f) importJson(f);
    els.importFile.value = "";
  });
  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  document.addEventListener("paste", async (e) => {
    const blob = await blobFromClipboard(e);
    if (blob) {
      if (els.placeDialog.open) {
        pendingPhotoBlob = blob;
        showPlacePhoto(blob);
        e.preventDefault();
        return;
      }
      if (els.tripDialog.open || els.confirmDialog.open) return;
      e.preventDefault();
      openPlace(null, blob);
      return;
    }
    if (els.placeDialog.open || els.tripDialog.open || els.confirmDialog.open) return;
    const text = textFromClipboard(e);
    if (text && looksLikeUrl(text)) {
      e.preventDefault();
      const href = text.startsWith("http") ? text : `https://${text}`;
      openPlace(null);
      els.placeUrl.value = href;
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  (async () => {
    try {
      places = await idbGetAll("places");
      trips = await idbGetAll("trips");
    } catch (_) {
      places = [];
      trips = [];
    }
    applyStaticI18n();
    render();
  })();
})();
