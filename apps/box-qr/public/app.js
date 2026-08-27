(() => {
  const LANG_KEY = "box-qr:lang";
  const LS_KEY = "box-qr:boxes:v1";
  const DB_NAME = "box-qr";
  const STORE = "boxes";

  const els = {
    langSelect: document.getElementById("lang-select"),
    addForm: document.getElementById("add-form"),
    editId: document.getElementById("edit-id"),
    room: document.getElementById("room"),
    items: document.getElementById("items"),
    photoInput: document.getElementById("photo-input"),
    photoPreviews: document.getElementById("photo-previews"),
    addSave: document.getElementById("add-save"),
    addCancel: document.getElementById("add-cancel"),
    search: document.getElementById("search"),
    boxList: document.getElementById("box-list"),
    itemsEmpty: document.getElementById("items-empty"),
    listCount: document.getElementById("list-count"),
    viewList: document.getElementById("view-list"),
    viewDetail: document.getElementById("view-detail"),
    backBtn: document.getElementById("back-btn"),
    detailNumber: document.getElementById("detail-number"),
    detailRoom: document.getElementById("detail-room"),
    detailMissing: document.getElementById("detail-missing"),
    detailPhotos: document.getElementById("detail-photos"),
    detailItems: document.getElementById("detail-items"),
    detailQrMount: document.getElementById("detail-qr-mount"),
    detailUrl: document.getElementById("detail-url"),
    detailAddPhoto: document.getElementById("detail-photo-input"),
    copyUrlBtn: document.getElementById("copy-url-btn"),
    printBtn: document.getElementById("print-btn"),
    detailEdit: document.getElementById("detail-edit"),
    detailDelete: document.getElementById("detail-delete"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    toast: document.getElementById("toast"),
    confirmDialog: document.getElementById("confirm-dialog"),
    qrDialog: document.getElementById("qr-dialog"),
    qrDialogMount: document.getElementById("qr-dialog-mount"),
    qrDialogUrl: document.getElementById("qr-dialog-url"),
    qrDialogNumber: document.getElementById("qr-dialog-number"),
    printRoot: document.getElementById("print-root"),
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let boxes = [];
  let pendingPhotos = [];
  let confirmAction = null;
  let currentId = null;

  function t(key, vars) {
    const dict = (window.BQ_I18N && window.BQ_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.BQ_I18N && window.BQ_I18N.en[key]) || key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.replaceAll(`{${k}}`, String(vars[k])); });
    return s;
  }

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `b_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("no idb"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGetAll() {
    const d = await openDb();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(box) {
    const d = await openDb();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(box);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelete(id) {
    const d = await openDb();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbClearAndPutAll(list) {
    const d = await openDb();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      list.forEach((b) => store.put(b));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function lsLoad() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  function lsSave(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (_) {
      try { localStorage.removeItem(LS_KEY); } catch (__) {}
    }
  }

  async function loadBoxes() {
    try {
      const fromIdb = await idbGetAll();
      if (fromIdb.length) return fromIdb.sort(byNumber);
      const fromLs = lsLoad();
      if (fromLs.length) {
        try { await idbClearAndPutAll(fromLs); } catch (_) {}
        return fromLs.sort(byNumber);
      }
      return fromIdb.sort(byNumber);
    } catch (_) {
      return lsLoad().sort(byNumber);
    }
  }

  function byNumber(a, b) {
    return (a.number || 0) - (b.number || 0) || String(a.createdAt).localeCompare(String(b.createdAt));
  }

  async function persistBox(box) {
    const i = boxes.findIndex((b) => b.id === box.id);
    if (i >= 0) boxes[i] = box;
    else boxes.push(box);
    boxes.sort(byNumber);
    try { await idbPut(box); } catch (_) {}
    lsSave(boxes);
  }

  function metaOnly(b) {
    return {
      id: b.id,
      number: b.number,
      room: b.room,
      items: b.items,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      photos: (b.photos || []).map((p) => ({ id: p.id, dataUrl: p.dataUrl })),
    };
  }

  async function removeBox(id) {
    boxes = boxes.filter((b) => b.id !== id);
    try { await idbDelete(id); } catch (_) {}
    lsSave(boxes);
  }

  function nextNumber() {
    let max = 0;
    boxes.forEach((b) => { if (b.number > max) max = b.number; });
    return max + 1;
  }

  function itemLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function boxUrl(box) {
    const u = new URL(location.origin + "/");
    u.searchParams.set("box", box.id);
    u.searchParams.set("lang", lang);
    return u.toString();
  }

  function padNum(n) {
    return String(n).padStart(2, "0");
  }

  function findBox(id) {
    return boxes.find((b) => b.id === id) || null;
  }

  function searchHay(box) {
    const lines = itemLines(box.items);
    return [String(box.number || ""), box.room || "", lines.join(" "), box.items || ""].join("\n").toLowerCase();
  }

  function matchesQuery(box, q) {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return true;
    const hay = searchHay(box);
    return query.split(/\s+/).every((tok) => hay.includes(tok));
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        let dataUrl;
        try { dataUrl = canvas.toDataURL("image/jpeg", 0.72); } catch (_) {
          dataUrl = canvas.toDataURL("image/png");
        }
        resolve({ id: uid(), dataUrl });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.onload = () => resolve({ id: uid(), dataUrl: String(reader.result || "") });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  }

  function renderQr(mount, url) {
    if (!mount) return;
    mount.innerHTML = "";
    try {
      if (typeof qrcode !== "function") throw new Error("no qr");
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      mount.innerHTML = qr.createSvgTag(6, 2);
      const svg = mount.querySelector("svg");
      if (svg) {
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("viewBox", svg.getAttribute("viewBox") || "0 0 100 100");
      }
    } catch (_) {
      mount.textContent = url;
    }
  }

  function setBoxParam(id, push) {
    const u = new URL(location.href);
    if (id) u.searchParams.set("box", id);
    else u.searchParams.delete("box");
    const next = u.pathname + u.search + u.hash;
    if (push) history.pushState({ box: id || null }, "", next);
    else history.replaceState({ box: id || null }, "", next);
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.BQ_OG && (window.BQ_OG[lang] || window.BQ_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((el) => {
      el.setAttribute("content", t("title"));
    });
    setText("brand-title", t("title"));
    setText("local-only", t("localOnly"));
    setText("brand-tagline", t("tagline"));
    setText("unlimited", t("unlimited"));
    setText("about-text", t("about"));
    setText("add-title", els.editId.value ? t("editTitle") : t("addTitle"));
    setText("label-room", t("labelRoom"));
    setText("label-items", t("labelItems"));
    setText("label-photos", t("labelPhotos"));
    setText("add-photos-label", t("addPhotos"));
    setText("add-save", els.editId.value ? t("update") : t("save"));
    setText("add-cancel", t("cancel"));
    setText("list-title", t("listTitle"));
    setText("search-label", t("search"));
    setText("tools-title", t("tools"));
    setText("export-btn", t("exportJson"));
    setText("import-label", t("importJson"));
    setText("tools-hint", t("toolsHint"));
    setText("link-privacy", t("privacy"));
    setText("link-terms", t("terms"));
    setText("lang-label", t("langLabel"));
    setText("confirm-cancel", t("cancel"));
    setText("confirm-ok", t("delete"));
    setText("confirm-text", t("deleteConfirm"));
    setText("back-btn", t("back"));
    setText("detail-contents-title", t("contents"));
    setText("detail-add-photos-label", t("addMorePhotos"));
    setText("encoded-url-label", t("encodedUrl"));
    setText("copy-url-btn", t("copyUrl"));
    setText("print-btn", t("printSticker"));
    setText("detail-edit", t("edit"));
    setText("detail-delete", t("delete"));
    setText("qr-dialog-title", t("qrTitle"));
    setText("qr-dialog-hint", t("qrHint"));
    setText("qr-encoded-label", t("encodedUrl"));
    setText("qr-copy", t("copyUrl"));
    setText("qr-print", t("printSticker"));
    setText("qr-close", t("close"));
    setAttr("lang-select", "aria-label", t("langLabel"));
    setAttr("room", "placeholder", t("roomPh"));
    setAttr("items", "placeholder", t("itemsPh"));
    setAttr("search", "placeholder", t("searchPh"));
    if (els.langSelect) els.langSelect.value = lang;
  }

  function setLang(next) {
    if (!next || (window.BQ_I18N && !window.BQ_I18N[next])) return;
    lang = next;
    document.documentElement.setAttribute("data-lang-user", "1");
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    if (typeof window.persistLangQuery === "function") window.persistLangQuery(lang);
    applyStaticI18n();
    render();
  }

  function renderPendingPhotos() {
    els.photoPreviews.innerHTML = pendingPhotos.map((p, i) =>
      `<span class="photo-wrap"><img src="${esc(p.dataUrl)}" alt=""><button type="button" data-rm-pending="${i}" aria-label="×">×</button></span>`
    ).join("");
  }

  function resetForm() {
    els.editId.value = "";
    els.room.value = "";
    els.items.value = "";
    pendingPhotos = [];
    renderPendingPhotos();
    els.addCancel.hidden = true;
    setText("add-title", t("addTitle"));
    setText("add-save", t("save"));
  }

  function startEdit(box) {
    els.editId.value = box.id;
    els.room.value = box.room || "";
    els.items.value = box.items || "";
    pendingPhotos = (box.photos || []).map((p) => ({ id: p.id, dataUrl: p.dataUrl }));
    renderPendingPhotos();
    els.addCancel.hidden = false;
    setText("add-title", t("editTitle"));
    setText("add-save", t("update"));
    showList();
    els.room.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showList(push) {
    currentId = null;
    setBoxParam(null, !!push);
    els.viewList.hidden = false;
    els.viewDetail.hidden = true;
    renderList();
  }

  function showDetail(id, push) {
    currentId = id;
    setBoxParam(id, push);
    els.viewList.hidden = true;
    els.viewDetail.hidden = false;
    renderDetail();
  }

  function renderList() {
    const q = els.search.value;
    const shown = boxes.filter((b) => matchesQuery(b, q));
    els.listCount.textContent = String(shown.length);
    els.itemsEmpty.textContent = q.trim() ? t("emptySearch") : t("empty");
    els.itemsEmpty.hidden = shown.length > 0;
    els.boxList.innerHTML = shown.map((b) => {
      const lines = itemLines(b.items);
      const chips = lines.slice(0, 6).map((it) => `<span class="chip">${esc(it)}</span>`).join("");
      const thumbs = (b.photos || []).slice(0, 4).map((p) => `<img src="${esc(p.dataUrl)}" alt="">`).join("");
      return `<article class="box-card" data-open="${esc(b.id)}">
        <div class="box-num"><small>BOX</small>${esc(padNum(b.number))}</div>
        <div class="box-body">
          <div class="ttl">${esc(b.room || t("boxNumber", { n: padNum(b.number) }))}</div>
          <div class="box-meta">${esc(t("itemCount", { n: lines.length }))} · ${esc(t("photoCount", { n: (b.photos || []).length }))}</div>
          ${chips ? `<div class="chip-row">${chips}</div>` : ""}
          ${thumbs ? `<div class="thumb-row">${thumbs}</div>` : ""}
        </div>
        <div class="box-actions">
          <button type="button" class="btn btn-primary btn-sm" data-open="${esc(b.id)}">${esc(t("openBox"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-qr="${esc(b.id)}">${esc(t("showQr"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${esc(b.id)}">${esc(t("edit"))}</button>
          <button type="button" class="btn btn-danger btn-sm" data-remove="${esc(b.id)}">${esc(t("delete"))}</button>
        </div>
      </article>`;
    }).join("");
  }

  function renderDetail() {
    const box = findBox(currentId);
    if (!box) {
      els.detailNumber.textContent = "";
      els.detailRoom.textContent = "";
      els.detailMissing.hidden = false;
      els.detailMissing.textContent = t("boxMissing");
      els.detailPhotos.innerHTML = "";
      els.detailItems.innerHTML = "";
      els.detailQrMount.innerHTML = "";
      els.detailUrl.value = location.href;
      return;
    }
    els.detailMissing.hidden = true;
    els.detailNumber.textContent = t("boxNumber", { n: padNum(box.number) });
    els.detailRoom.textContent = box.room || "";
    els.detailPhotos.innerHTML = (box.photos || []).map((p) =>
      `<span class="photo-wrap"><img src="${esc(p.dataUrl)}" alt=""><button type="button" data-rm-photo="${esc(p.id)}" aria-label="×">×</button></span>`
    ).join("");
    const lines = itemLines(box.items);
    els.detailItems.innerHTML = lines.map((it) => `<li>${esc(it)}</li>`).join("");
    const url = boxUrl(box);
    els.detailUrl.value = url;
    renderQr(els.detailQrMount, url);
  }

  function render() {
    if (currentId) {
      els.viewList.hidden = true;
      els.viewDetail.hidden = false;
      renderDetail();
    } else {
      els.viewList.hidden = false;
      els.viewDetail.hidden = true;
      renderList();
    }
  }

  function confirmDelete(msg, fn) {
    confirmAction = fn;
    setText("confirm-text", msg);
    els.confirmDialog.returnValue = "";
    els.confirmDialog.showModal();
  }

  function openQrDialog(box) {
    const url = boxUrl(box);
    els.qrDialogNumber.textContent = t("boxNumber", { n: padNum(box.number) });
    els.qrDialogUrl.value = url;
    renderQr(els.qrDialogMount, url);
    els.qrDialog.showModal();
  }

  function fillPrint(box) {
    const url = boxUrl(box);
    const lines = itemLines(box.items).slice(0, 8).join(" · ");
    els.printRoot.hidden = false;
    els.printRoot.innerHTML = `<div class="print-sticker">
      <p class="num">${esc(t("boxNumber", { n: padNum(box.number) }))}</p>
      <div class="qr" id="print-qr"></div>
      <p class="room">${esc(box.room || "")}</p>
      <p class="items">${esc(lines)}</p>
      <p class="url">${esc(url)}</p>
    </div>`;
    renderQr(document.getElementById("print-qr"), url);
  }

  function printBox(box) {
    fillPrint(box);
    window.print();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("copied"));
    } catch (_) {
      showToast(t("copied"));
    }
  }

  async function addFilesToPending(fileList) {
    const files = Array.from(fileList || []).filter((f) => {
      if (!f) return false;
      if (f.type && f.type.startsWith("image/")) return true;
      return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name || "");
    });
    for (const f of files) {
      try {
        const photo = await compressImage(f);
        if (photo && photo.dataUrl) pendingPhotos.push(photo);
      } catch (_) {}
    }
    renderPendingPhotos();
  }

  els.addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const room = els.room.value.trim();
    const items = els.items.value;
    const lines = itemLines(items);
    if (!lines.length && !pendingPhotos.length && !room) {
      showToast(t("needItems"));
      return;
    }
    const editId = els.editId.value;
    const existing = editId ? findBox(editId) : null;
    const box = {
      id: existing ? existing.id : uid(),
      number: existing ? existing.number : nextNumber(),
      room,
      items,
      photos: pendingPhotos.slice(),
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    await persistBox(box);
    resetForm();
    applyStaticI18n();
    render();
    showToast(t("saved"));
  });

  els.addCancel.addEventListener("click", () => {
    resetForm();
    applyStaticI18n();
  });

  els.photoInput.addEventListener("change", async () => {
    await addFilesToPending(els.photoInput.files);
    els.photoInput.value = "";
  });

  els.photoPreviews.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rm-pending]");
    if (!btn) return;
    const i = Number(btn.getAttribute("data-rm-pending"));
    pendingPhotos.splice(i, 1);
    renderPendingPhotos();
  });

  els.search.addEventListener("input", () => renderList());

  els.boxList.addEventListener("click", (e) => {
    const qrBtn = e.target.closest("[data-qr]");
    if (qrBtn) {
      e.stopPropagation();
      const box = findBox(qrBtn.getAttribute("data-qr"));
      if (box) openQrDialog(box);
      return;
    }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      e.stopPropagation();
      const box = findBox(editBtn.getAttribute("data-edit"));
      if (box) startEdit(box);
      return;
    }
    const rmBtn = e.target.closest("[data-remove]");
    if (rmBtn) {
      e.stopPropagation();
      const id = rmBtn.getAttribute("data-remove");
      confirmDelete(t("deleteConfirm"), async () => {
        await removeBox(id);
        if (els.editId.value === id) resetForm();
        applyStaticI18n();
        render();
        showToast(t("deleted"));
      });
      return;
    }
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      showDetail(openBtn.getAttribute("data-open"), true);
    }
  });

  els.backBtn.addEventListener("click", () => showList(true));

  els.detailAddPhoto.addEventListener("change", async () => {
    const box = findBox(currentId);
    if (!box) return;
    const files = els.detailAddPhoto.files;
    for (const f of Array.from(files || [])) {
      try {
        const photo = await compressImage(f);
        if (photo && photo.dataUrl) {
          box.photos = box.photos || [];
          box.photos.push(photo);
        }
      } catch (_) {}
    }
    els.detailAddPhoto.value = "";
    box.updatedAt = Date.now();
    await persistBox(box);
    renderDetail();
    showToast(t("saved"));
  });

  els.detailPhotos.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-rm-photo]");
    if (!btn) return;
    const box = findBox(currentId);
    if (!box) return;
    const id = btn.getAttribute("data-rm-photo");
    box.photos = (box.photos || []).filter((p) => p.id !== id);
    box.updatedAt = Date.now();
    await persistBox(box);
    renderDetail();
  });

  els.copyUrlBtn.addEventListener("click", () => copyText(els.detailUrl.value));
  els.printBtn.addEventListener("click", () => {
    const box = findBox(currentId);
    if (box) printBox(box);
  });
  els.detailEdit.addEventListener("click", () => {
    const box = findBox(currentId);
    if (box) startEdit(box);
  });
  els.detailDelete.addEventListener("click", () => {
    const id = currentId;
    confirmDelete(t("deleteConfirm"), async () => {
      await removeBox(id);
      resetForm();
      showList(true);
      applyStaticI18n();
      showToast(t("deleted"));
    });
  });

  document.getElementById("qr-copy").addEventListener("click", () => copyText(els.qrDialogUrl.value));
  document.getElementById("qr-print").addEventListener("click", () => {
    const url = els.qrDialogUrl.value;
    const box = boxes.find((b) => url.includes(b.id));
    if (box) printBox(box);
  });

  els.confirmDialog.addEventListener("close", () => {
    if (els.confirmDialog.returnValue === "confirm" && confirmAction) confirmAction();
    confirmAction = null;
  });

  function exportJson() {
    const blob = new Blob([JSON.stringify({ v: 1, boxes: boxes.map(metaOnly) }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "box-qr.json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t("exported"));
  }

  async function importJson(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.boxes) ? parsed.boxes : null);
      if (!list) throw new Error("shape");
      const incoming = list.map((b, i) => ({
        id: b.id || uid(),
        number: Number(b.number) || i + 1,
        room: String(b.room || ""),
        items: String(b.items || ""),
        photos: Array.isArray(b.photos) ? b.photos.filter((p) => p && p.dataUrl).map((p) => ({ id: p.id || uid(), dataUrl: p.dataUrl })) : [],
        createdAt: b.createdAt || Date.now(),
        updatedAt: Date.now(),
      }));
      const byId = new Map(boxes.map((b) => [b.id, b]));
      incoming.forEach((b) => byId.set(b.id, b));
      boxes = Array.from(byId.values()).sort(byNumber);
      try { await idbClearAndPutAll(boxes); } catch (_) {}
      lsSave(boxes.map(metaOnly));
      render();
      showToast(t("imported"));
    } catch (_) {
      showToast(t("importFail"));
    }
  }

  els.exportBtn.addEventListener("click", exportJson);
  els.importFile.addEventListener("change", () => {
    const f = els.importFile.files[0];
    if (f) importJson(f);
    els.importFile.value = "";
  });
  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  window.addEventListener("popstate", () => {
    currentId = new URLSearchParams(location.search).get("box");
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  (async () => {
    boxes = await loadBoxes();
    currentId = new URLSearchParams(location.search).get("box");
    applyStaticI18n();
    resetForm();
    render();
  })();
})();
