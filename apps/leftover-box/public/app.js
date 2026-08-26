(() => {
  const ITEMS_KEY = "leftover-box:items:v1";
  const LANG_KEY = "leftover-box:lang";
  const DAY = 86400000;

  const els = {
    langSelect: document.getElementById("lang-select"),
    addForm: document.getElementById("add-form"),
    editId: document.getElementById("edit-id"),
    dishName: document.getElementById("dish-name"),
    cookedOn: document.getElementById("cooked-on"),
    eatBy: document.getElementById("eat-by"),
    location: document.getElementById("location"),
    note: document.getElementById("note"),
    addSave: document.getElementById("add-save"),
    addCancel: document.getElementById("add-cancel"),
    statusFilters: document.getElementById("status-filters"),
    itemList: document.getElementById("item-list"),
    itemsEmpty: document.getElementById("items-empty"),
    listCount: document.getElementById("list-count"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    toast: document.getElementById("toast"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmText: document.getElementById("confirm-text"),
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let items = loadItems();
  let filterStatus = "open";
  let confirmAction = null;
  let eatByTouched = false;

  function t(key, vars) {
    const dict = (window.LB_I18N && window.LB_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.LB_I18N && window.LB_I18N.en[key]) || key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.replaceAll(`{${k}}`, String(vars[k])); });
    return s;
  }

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(ITEMS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];
    } catch (_) { return []; }
  }

  function saveItems() {
    try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); } catch (_) {}
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

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function formatISO(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function todayISO() { return formatISO(new Date()); }

  function parseISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function addDaysISO(iso, n) {
    const d = parseISO(iso) || new Date();
    d.setDate(d.getDate() + n);
    return formatISO(d);
  }

  function daysUntil(iso) {
    const target = parseISO(iso);
    if (!target) return 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / DAY);
  }

  function badgeFor(iso) {
    const n = daysUntil(iso);
    const date = iso || "";
    if (n < 0) return { cls: "stamp stamp-overdue", dday: t("badgeOverdue"), date, overdue: true };
    if (n === 0) return { cls: "stamp stamp-today", dday: t("badgeToday"), date, overdue: false };
    return { cls: "stamp stamp-ok", dday: t("badgeDays", { n }), date, overdue: false };
  }

  function locLabel(loc) {
    if (loc === "fridge") return t("locFridgeShort");
    if (loc === "freezer") return t("locFreezerShort");
    if (loc === "other") return t("locOtherShort");
    return "";
  }

  function resetForm() {
    els.editId.value = "";
    els.dishName.value = "";
    els.cookedOn.value = todayISO();
    els.eatBy.value = addDaysISO(els.cookedOn.value, 3);
    els.location.value = "";
    els.note.value = "";
    eatByTouched = false;
    els.addCancel.hidden = true;
    setText("add-title", t("addTitle"));
    setText("add-save", t("save"));
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.LB_OG && (window.LB_OG[lang] || window.LB_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    setText("brand-title", t("title"));
    setText("local-only", t("localOnly"));
    setText("brand-tagline", t("tagline"));
    setText("about-text", t("about"));
    setText("add-title", els.editId.value ? t("edit") : t("addTitle"));
    setText("label-name", t("labelName"));
    setText("label-cooked", t("labelCooked"));
    setText("label-eatby", t("labelEatBy"));
    setText("label-location", t("labelLocation"));
    setText("loc-none", t("locNone"));
    setText("loc-fridge", t("locFridge"));
    setText("loc-freezer", t("locFreezer"));
    setText("loc-other", t("locOther"));
    setText("label-note", t("labelNote"));
    setText("add-save", els.editId.value ? t("update") : t("save"));
    setText("add-cancel", t("cancel"));
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
    setAttr("lang-select", "aria-label", t("langLabel"));
    setAttr("dish-name", "placeholder", t("namePh"));
    setAttr("note", "placeholder", t("notePh"));
    const statusMap = { open: "listOpen", eaten: "listEaten" };
    els.statusFilters.querySelectorAll("[data-status]").forEach((c) => {
      c.textContent = t(statusMap[c.dataset.status] || "listOpen");
      c.classList.toggle("active", c.dataset.status === filterStatus);
    });
    if (els.langSelect) els.langSelect.value = lang;
  }

  function setLang(next) {
    if (!next || (window.LB_I18N && !window.LB_I18N[next])) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    if (typeof window.persistLangQuery === "function") window.persistLangQuery(lang);
    applyStaticI18n();
    render();
  }

  function findItem(id) {
    return items.find((it) => it.id === id);
  }

  function confirmDelete(msg, fn) {
    confirmAction = fn;
    setText("confirm-text", msg);
    els.confirmDialog.returnValue = "";
    els.confirmDialog.showModal();
  }

  function startEdit(it) {
    els.editId.value = it.id;
    els.dishName.value = it.name || "";
    els.cookedOn.value = it.cookedOn || todayISO();
    els.eatBy.value = it.eatBy || addDaysISO(els.cookedOn.value, 3);
    els.location.value = it.location || "";
    els.note.value = it.note || "";
    eatByTouched = true;
    els.addCancel.hidden = false;
    setText("add-title", t("edit"));
    setText("add-save", t("update"));
    els.dishName.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    setText("list-title", t(filterStatus === "eaten" ? "listEaten" : "listOpen"));
    setText("sort-hint", t(filterStatus === "eaten" ? "sortHintEaten" : "sortHintOpen"));
    els.statusFilters.querySelectorAll("[data-status]").forEach((c) => {
      c.classList.toggle("active", c.dataset.status === filterStatus);
    });

    let shown = items.filter((it) => (it.status || "open") === filterStatus);
    if (filterStatus === "open") {
      shown.sort((a, b) => String(a.eatBy || "").localeCompare(String(b.eatBy || "")) || (a.createdAt || 0) - (b.createdAt || 0));
    } else {
      shown.sort((a, b) => (b.eatenAt || b.updatedAt || 0) - (a.eatenAt || a.updatedAt || 0));
    }

    els.listCount.textContent = String(shown.length);
    els.itemsEmpty.textContent = t(filterStatus === "eaten" ? "emptyEaten" : "emptyOpen");
    els.itemsEmpty.hidden = shown.length > 0;

    els.itemList.innerHTML = shown.map((it) => {
      const badge = badgeFor(it.eatBy);
      const loc = locLabel(it.location);
      const overdueClass = filterStatus === "open" && badge.overdue ? " overdue" : "";
      const meta = filterStatus === "eaten"
        ? esc(t("eatenOn", { d: it.eatenOn || "" }))
        : `${esc(t("cookedLabel", { d: it.cookedOn || "" }))}${loc ? ` · ${esc(loc)}` : ""}`;
      return `<article class="item-card${overdueClass}">
        <div class="ttl">${esc(it.name || "")}</div>
        <div class="item-meta">
          <span class="${badge.cls}" title="${esc(badge.date)}"><em>${esc(badge.dday)}</em><small>${esc(badge.date)}</small></span>
          <span class="loc-pill">${meta}</span>
        </div>
        ${it.note ? `<div class="note">${esc(it.note)}</div>` : ""}
        <div class="item-actions">
          ${filterStatus === "open" ? `<button type="button" class="btn btn-primary btn-sm" data-eaten="${esc(it.id)}">${esc(t("eaten"))}</button>` : ""}
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${esc(it.id)}">${esc(t("edit"))}</button>
          <button type="button" class="btn btn-danger btn-sm" data-remove="${esc(it.id)}">${esc(t("delete"))}</button>
        </div>
      </article>`;
    }).join("");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ v: 1, items }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leftover-box.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast(t("exported"));
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onerror = () => showToast(t("importFail"));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const list = Array.isArray(parsed) ? parsed : (parsed && parsed.items);
        if (!Array.isArray(list)) throw new Error("bad");
        const byId = new Map(items.map((it) => [it.id, it]));
        list.forEach((raw) => {
          if (!raw || !raw.name) return;
          const id = raw.id || uid();
          const next = {
            id,
            name: String(raw.name).slice(0, 120),
            cookedOn: raw.cookedOn || todayISO(),
            eatBy: raw.eatBy || addDaysISO(raw.cookedOn || todayISO(), 3),
            location: ["fridge", "freezer", "other"].includes(raw.location) ? raw.location : "",
            note: raw.note ? String(raw.note).slice(0, 200) : "",
            status: raw.status === "eaten" ? "eaten" : "open",
            createdAt: raw.createdAt || Date.now(),
            updatedAt: raw.updatedAt || Date.now(),
            eatenAt: raw.eatenAt || null,
            eatenOn: raw.eatenOn || "",
          };
          byId.set(id, next);
        });
        items = Array.from(byId.values());
        saveItems();
        render();
        showToast(t("imported"));
      } catch (_) {
        showToast(t("importFail"));
      }
    };
    reader.readAsText(file);
  }

  els.cookedOn.addEventListener("change", () => {
    if (!eatByTouched) els.eatBy.value = addDaysISO(els.cookedOn.value || todayISO(), 3);
  });
  els.eatBy.addEventListener("input", () => { eatByTouched = true; });

  els.addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.dishName.value.trim();
    if (!name) { showToast(t("needName")); return; }
    const cookedOn = els.cookedOn.value || todayISO();
    const eatBy = els.eatBy.value || addDaysISO(cookedOn, 3);
    const now = Date.now();
    const existing = findItem(els.editId.value);
    if (existing) {
      existing.name = name;
      existing.cookedOn = cookedOn;
      existing.eatBy = eatBy;
      existing.location = els.location.value || "";
      existing.note = els.note.value.trim();
      existing.updatedAt = now;
    } else {
      items.push({
        id: uid(),
        name,
        cookedOn,
        eatBy,
        location: els.location.value || "",
        note: els.note.value.trim(),
        status: "open",
        createdAt: now,
        updatedAt: now,
        eatenAt: null,
        eatenOn: "",
      });
    }
    saveItems();
    resetForm();
    applyStaticI18n();
    render();
    showToast(t("saved"));
  });

  els.addCancel.addEventListener("click", () => {
    resetForm();
    applyStaticI18n();
  });

  els.statusFilters.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-status]");
    if (!chip) return;
    filterStatus = chip.getAttribute("data-status") === "eaten" ? "eaten" : "open";
    applyStaticI18n();
    render();
  });

  els.itemList.addEventListener("click", (e) => {
    const eatenBtn = e.target.closest("[data-eaten]");
    if (eatenBtn) {
      const it = findItem(eatenBtn.getAttribute("data-eaten"));
      if (it) {
        it.status = "eaten";
        it.eatenAt = Date.now();
        it.eatenOn = todayISO();
        it.updatedAt = Date.now();
        saveItems();
        render();
        showToast(t("eaten"));
      }
      return;
    }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      const it = findItem(editBtn.getAttribute("data-edit"));
      if (it) startEdit(it);
      return;
    }
    const rmBtn = e.target.closest("[data-remove]");
    if (rmBtn) {
      const id = rmBtn.getAttribute("data-remove");
      confirmDelete(t("deleteConfirm"), () => {
        items = items.filter((it) => it.id !== id);
        if (els.editId.value === id) resetForm();
        saveItems();
        applyStaticI18n();
        render();
        showToast(t("deleted"));
      });
    }
  });

  els.confirmDialog.addEventListener("close", () => {
    if (els.confirmDialog.returnValue === "confirm" && confirmAction) confirmAction();
    confirmAction = null;
  });

  els.exportBtn.addEventListener("click", exportJson);
  els.importFile.addEventListener("change", () => {
    const f = els.importFile.files[0];
    if (f) importJson(f);
    els.importFile.value = "";
  });
  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  resetForm();
  applyStaticI18n();
  render();
})();
