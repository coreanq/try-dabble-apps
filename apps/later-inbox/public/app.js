(() => {
  const ITEMS_KEY = "later-inbox:items:v1";
  const LANG_KEY = "li_lang";
  const DAY = 86400000;
  const THIRTY = 30 * DAY;
  const WEEK_MAX = 3;
  const STATUSES = ["inbox", "week", "done", "expired"];

  const els = {
    langSelect: document.getElementById("lang-select"),
    search: document.getElementById("search"),
    triageBanner: document.getElementById("triage-banner"),
    addForm: document.getElementById("add-form"),
    addUrl: document.getElementById("add-url"),
    addWhy: document.getElementById("add-why"),
    addTitle: document.getElementById("add-title-input"),
    pasteUrlBtn: document.getElementById("paste-url-btn"),
    draftsSection: document.getElementById("drafts-section"),
    draftsList: document.getElementById("drafts-list"),
    draftsCount: document.getElementById("drafts-count"),
    statusFilters: document.getElementById("status-filters"),
    itemList: document.getElementById("item-list"),
    itemsEmpty: document.getElementById("items-empty"),
    listCount: document.getElementById("list-count"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    importBookmarks: document.getElementById("import-bookmarks"),
    toast: document.getElementById("toast"),
    editDialog: document.getElementById("edit-dialog"),
    editForm: document.getElementById("edit-form"),
    editId: document.getElementById("edit-id"),
    editUrl: document.getElementById("edit-url"),
    editWhy: document.getElementById("edit-why"),
    editTitle: document.getElementById("edit-title"),
    editDelete: document.getElementById("edit-delete"),
    editCancel: document.getElementById("edit-cancel"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmText: document.getElementById("confirm-text"),
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let items = loadItems();
  let filterStatus = "inbox";
  let query = "";
  let confirmAction = null;

  function t(key, vars) {
    const dict = (window.LI_I18N && window.LI_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.LI_I18N && window.LI_I18N.en[key]) || key);
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

  function normalizeUrl(raw) {
    let s = String(raw || "").trim();
    if (!s) return "";
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = "https://" + s;
    try {
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return u.href;
    } catch (_) { return ""; }
  }

  function hostOf(url) {
    try { return new URL(url).host.replace(/^www\./, ""); } catch (_) { return ""; }
  }

  function ageLabel(ts) {
    const days = Math.floor((Date.now() - (ts || Date.now())) / DAY);
    if (days <= 0) return t("ageToday");
    return t("ageDays", { n: days });
  }

  function displayTitle(it) {
    return (it.title || "").trim() || hostOf(it.url) || t("hostFallback");
  }

  function expireOld() {
    const now = Date.now();
    let n = 0;
    items = items.map((it) => {
      if (it.draft) return it;
      if (it.status === "inbox" && !it.pinned && (now - (it.createdAt || now)) > THIRTY) {
        n += 1;
        return Object.assign({}, it, { status: "expired", touchedAt: now });
      }
      return it;
    });
    if (n) saveItems();
    return n;
  }

  function weekItems() {
    return items.filter((it) => !it.draft && it.status === "week");
  }

  function bumpOldestWeek() {
    const week = weekItems().slice().sort((a, b) => (a.touchedAt || a.createdAt || 0) - (b.touchedAt || b.createdAt || 0));
    if (!week.length) return null;
    const oldest = week[0];
    oldest.status = "inbox";
    oldest.touchedAt = Date.now();
    return oldest;
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title") + " — Later Inbox";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.LI_OG && (window.LI_OG[lang] || window.LI_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    setText("brand-title", t("title"));
    setText("brand-tagline", t("tagline"));
    setText("about-text", t("about"));
    setText("add-title", t("addTitle"));
    setText("label-add-url", t("addUrl"));
    setText("label-add-why", t("addWhy"));
    setText("label-add-title", t("addTitleLabel"));
    setText("paste-url-btn", t("pasteUrl"));
    setText("add-save", t("save"));
    setText("tools-title", t("tools"));
    setText("export-btn", t("exportJson"));
    setText("import-label", t("importJson"));
    setText("import-bookmarks-label", t("importBookmarks"));
    setText("tools-hint", t("toolsHint"));
    setText("link-privacy", t("privacy"));
    setText("link-terms", t("terms"));
    setText("lang-label", t("langLabel"));
    setText("search-label", t("search"));
    setText("drafts-title", t("draftsTitle"));
    setText("drafts-hint", t("draftsHint"));
    setText("edit-form-title", t("editTitle"));
    setText("label-edit-url", t("addUrl"));
    setText("label-edit-why", t("addWhy"));
    setText("label-edit-title", t("addTitleLabel"));
    setText("edit-cancel", t("cancel"));
    setText("edit-save", t("save"));
    setText("edit-delete", t("delete"));
    setText("confirm-cancel", t("cancel"));
    setText("confirm-ok", t("delete"));
    setText("confirm-text", t("deleteConfirm"));
    setAttr("search", "aria-label", t("search"));
    setAttr("search", "placeholder", t("search"));
    setAttr("lang-select", "aria-label", t("langLabel"));
    setAttr("add-url", "placeholder", "https://");
    setAttr("add-why", "placeholder", t("addWhyPh"));
    setAttr("add-title-input", "placeholder", t("addTitlePh"));
    setAttr("edit-url", "placeholder", "https://");
    const statusMap = { inbox: "listInbox", week: "listWeek", done: "listDone", expired: "listExpired" };
    els.statusFilters.querySelectorAll("[data-status]").forEach((c) => {
      c.textContent = t(statusMap[c.dataset.status] || "listInbox");
      c.classList.toggle("active", c.dataset.status === filterStatus);
    });
    if (els.langSelect) els.langSelect.value = lang;
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    applyStaticI18n();
    render();
  }

  function matchesQuery(it) {
    if (!query) return true;
    return [it.title, it.why, it.url].filter(Boolean).join(" ").toLowerCase().includes(query);
  }

  function render() {
    const inboxCount = items.filter((it) => !it.draft && it.status === "inbox").length;
    if (inboxCount > 0) {
      els.triageBanner.hidden = false;
      els.triageBanner.textContent = t("triage");
    } else {
      els.triageBanner.hidden = true;
      els.triageBanner.textContent = "";
    }

    const drafts = items.filter((it) => it.draft);
    els.draftsSection.hidden = drafts.length === 0;
    els.draftsCount.textContent = String(drafts.length);
    els.draftsList.innerHTML = drafts.map((it) => `
      <article class="item-card draft-row" data-draft-id="${esc(it.id)}">
        <div class="ttl">${esc(displayTitle(it))}</div>
        <div class="sub">${esc(it.url)}</div>
        <input class="why-input draft-why" type="text" maxlength="200" placeholder="${esc(t("draftWhyPh"))}" />
        <div class="item-actions">
          <button type="button" class="btn btn-primary btn-sm" data-draft-save="${esc(it.id)}">${esc(t("draftSave"))}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-draft-skip="${esc(it.id)}">${esc(t("draftSkip"))}</button>
        </div>
      </article>`).join("");

    const hintKey = filterStatus === "week" ? "sortHintWeek"
      : filterStatus === "done" ? "sortHintDone"
      : filterStatus === "expired" ? "sortHintExpired"
      : "sortHintInbox";
    setText("sort-hint", t(hintKey));
    setText("list-title", t(
      filterStatus === "week" ? "listWeek"
      : filterStatus === "done" ? "listDone"
      : filterStatus === "expired" ? "listExpired"
      : "listInbox"
    ));

    let shown = items.filter((it) => !it.draft && it.status === filterStatus && matchesQuery(it));
    if (filterStatus === "inbox" || filterStatus === "week") {
      shown.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else {
      shown.sort((a, b) => (b.touchedAt || b.createdAt || 0) - (a.touchedAt || a.createdAt || 0));
    }

    els.listCount.textContent = String(shown.length);
    const emptyKey = query ? "emptySearch"
      : filterStatus === "week" ? "emptyWeek"
      : filterStatus === "done" ? "emptyDone"
      : filterStatus === "expired" ? "emptyExpired"
      : "emptyInbox";
    els.itemsEmpty.textContent = t(emptyKey);
    els.itemsEmpty.hidden = shown.length > 0;

    els.itemList.innerHTML = shown.map((it) => {
      const pinLabel = it.pinned ? t("unpin") : t("pin");
      return `<article class="item-card${it.pinned ? " pinned" : ""}">
        <div class="ttl">${esc(displayTitle(it))}${it.pinned ? ` · ${esc(t("pinned"))}` : ""}</div>
        <div class="why">${esc(it.why || "")}</div>
        <div class="sub">${esc(hostOf(it.url) || it.url)} · ${esc(ageLabel(it.createdAt))}</div>
        <div class="item-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-open="${esc(it.id)}">${esc(t("open"))}</button>
          ${it.status !== "week" ? `<button type="button" class="btn btn-ghost btn-sm" data-week="${esc(it.id)}">${esc(t("keepWeek"))}</button>` : ""}
          ${it.status !== "done" ? `<button type="button" class="btn btn-ghost btn-sm" data-done="${esc(it.id)}">${esc(t("markDone"))}</button>` : ""}
          ${it.status !== "expired" ? `<button type="button" class="btn btn-ghost btn-sm" data-expire="${esc(it.id)}">${esc(t("expire"))}</button>` : `<button type="button" class="btn btn-danger btn-sm" data-remove="${esc(it.id)}">${esc(t("delete"))}</button>`}
          <button type="button" class="btn btn-ghost btn-sm${it.pinned ? " pin-on" : ""}" data-pin="${esc(it.id)}">${esc(pinLabel)}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${esc(it.id)}">${esc(t("edit"))}</button>
        </div>
      </article>`;
    }).join("");
  }

  function findItem(id) {
    return items.find((it) => it.id === id);
  }

  function touch(it, extra) {
    Object.assign(it, extra || {}, { touchedAt: Date.now() });
    saveItems();
    render();
  }

  function addItem({ url, why, title, draft }) {
    const rec = {
      id: uid(),
      url,
      title: (title || "").trim(),
      why: (why || "").trim(),
      createdAt: Date.now(),
      touchedAt: Date.now(),
      status: "inbox",
      pinned: false
    };
    if (draft) rec.draft = true;
    items.push(rec);
    saveItems();
    return rec;
  }

  function keepThisWeek(it) {
    if (it.status === "week") return;
    const current = weekItems();
    if (current.length >= WEEK_MAX) {
      bumpOldestWeek();
      showToast(t("weekBumped"));
    }
    touch(it, { status: "week", draft: false });
  }

  function confirmDelete(message, action) {
    confirmAction = action;
    els.confirmText.textContent = message;
    els.confirmDialog.showModal();
  }

  function removeItem(id) {
    items = items.filter((it) => it.id !== id);
    saveItems();
    render();
    showToast(t("deleted"));
  }

  function openEdit(it) {
    els.editId.value = it.id;
    els.editUrl.value = it.url || "";
    els.editWhy.value = it.why || "";
    els.editTitle.value = it.title || "";
    els.editDialog.showModal();
  }

  function parseBookmarkHtml(html) {
    const out = [];
    const seen = new Set();
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("a[href]").forEach((a) => {
        const url = normalizeUrl(a.getAttribute("href"));
        if (!url || seen.has(url)) return;
        seen.add(url);
        out.push({ url, title: (a.textContent || "").trim() });
      });
    } catch (_) {}
    if (!out.length) {
      const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html))) {
        const url = normalizeUrl(m[1]);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push({ url, title: m[2].replace(/<[^>]+>/g, "").trim() });
      }
    }
    return out;
  }

  function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    a.download = `later-inbox-${iso}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t("exported"));
  }

  async function importJson(file) {
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : (data && data.items);
      if (!Array.isArray(list)) throw new Error("bad");
      items = list.map((it) => ({
        id: it.id || uid(),
        url: String(it.url || ""),
        title: String(it.title || ""),
        why: String(it.why || ""),
        createdAt: Number(it.createdAt) || Date.now(),
        touchedAt: Number(it.touchedAt) || Number(it.createdAt) || Date.now(),
        status: STATUSES.includes(it.status) ? it.status : "inbox",
        pinned: !!it.pinned,
        draft: !!it.draft || (!(it.why || "").trim() && it.status !== "done" && it.status !== "expired" && it.status !== "week" ? it.draft : false)
      })).filter((it) => it.url);
      expireOld();
      saveItems();
      showToast(t("imported"));
      render();
    } catch (_) {
      showToast(t("importFail"));
    }
  }

  async function importBookmarks(file) {
    try {
      const html = await file.text();
      const found = parseBookmarkHtml(html);
      if (!found.length) {
        showToast(t("bookmarksNone"));
        return;
      }
      const existing = new Set(items.map((it) => it.url));
      let n = 0;
      found.forEach((row) => {
        if (existing.has(row.url)) return;
        existing.add(row.url);
        addItem({ url: row.url, title: row.title, why: "", draft: true });
        n += 1;
      });
      saveItems();
      showToast(t("bookmarksImported", { n }));
      render();
    } catch (_) {
      showToast(t("importFail"));
    }
  }

  els.addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = normalizeUrl(els.addUrl.value);
    const why = els.addWhy.value.trim();
    if (!url) { showToast(t("needUrl")); return; }
    if (!why) { showToast(t("needWhy")); return; }
    addItem({ url, why, title: els.addTitle.value });
    els.addForm.reset();
    showToast(t("saved"));
    filterStatus = "inbox";
    applyStaticI18n();
    render();
  });

  els.pasteUrlBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      const url = normalizeUrl((text || "").trim().split(/\s+/)[0]);
      if (!url) { showToast(t("noClipboardUrl")); return; }
      els.addUrl.value = url;
    } catch (_) {
      showToast(t("clipboardDenied"));
    }
  });

  els.statusFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    filterStatus = btn.dataset.status;
    applyStaticI18n();
    render();
  });

  els.search.addEventListener("input", () => {
    query = els.search.value.trim().toLowerCase();
    render();
  });

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      const it = findItem(openBtn.getAttribute("data-open"));
      if (it && it.url) window.open(it.url, "_blank", "noopener,noreferrer");
      return;
    }
    const weekBtn = e.target.closest("[data-week]");
    if (weekBtn) {
      const it = findItem(weekBtn.getAttribute("data-week"));
      if (it) keepThisWeek(it);
      return;
    }
    const doneBtn = e.target.closest("[data-done]");
    if (doneBtn) {
      const it = findItem(doneBtn.getAttribute("data-done"));
      if (it) {
        touch(it, { status: "done", draft: false });
        showToast(t("saved"));
      }
      return;
    }
    const expBtn = e.target.closest("[data-expire]");
    if (expBtn) {
      const it = findItem(expBtn.getAttribute("data-expire"));
      if (it) {
        touch(it, { status: "expired" });
        showToast(t("saved"));
      }
      return;
    }
    const pinBtn = e.target.closest("[data-pin]");
    if (pinBtn) {
      const it = findItem(pinBtn.getAttribute("data-pin"));
      if (it) {
        touch(it, { pinned: !it.pinned });
      }
      return;
    }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      const it = findItem(editBtn.getAttribute("data-edit"));
      if (it) openEdit(it);
      return;
    }
    const rmBtn = e.target.closest("[data-remove]");
    if (rmBtn) {
      const id = rmBtn.getAttribute("data-remove");
      confirmDelete(t("deleteConfirm"), () => removeItem(id));
      return;
    }
    const ds = e.target.closest("[data-draft-save]");
    if (ds) {
      const id = ds.getAttribute("data-draft-save");
      const card = ds.closest("[data-draft-id]");
      const whyEl = card && card.querySelector(".draft-why");
      const why = whyEl ? whyEl.value.trim() : "";
      if (!why) { showToast(t("needWhy")); return; }
      const it = findItem(id);
      if (it) {
        delete it.draft;
        touch(it, { why, status: "inbox" });
        showToast(t("saved"));
      }
      return;
    }
    const skip = e.target.closest("[data-draft-skip]");
    if (skip) {
      removeItem(skip.getAttribute("data-draft-skip"));
    }
  });

  els.editCancel.addEventListener("click", () => els.editDialog.close());
  els.editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const it = findItem(els.editId.value);
    if (!it) return;
    const url = normalizeUrl(els.editUrl.value);
    const why = els.editWhy.value.trim();
    if (!url) { showToast(t("needUrl")); return; }
    if (!why) { showToast(t("needWhy")); return; }
    touch(it, { url, why, title: els.editTitle.value.trim() });
    els.editDialog.close();
    showToast(t("saved"));
  });
  els.editDelete.addEventListener("click", () => {
    const id = els.editId.value;
    confirmDelete(t("deleteConfirm"), () => {
      els.editDialog.close();
      removeItem(id);
    });
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
  els.importBookmarks.addEventListener("change", () => {
    const f = els.importBookmarks.files[0];
    if (f) importBookmarks(f);
    els.importBookmarks.value = "";
  });
  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  const expired = expireOld();
  applyStaticI18n();
  render();
  if (expired) showToast(t("expiredN", { n: expired }));
})();
