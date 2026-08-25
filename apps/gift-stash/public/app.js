(() => {
  const PEOPLE_KEY = "gift-stash:people:v1";
  const IDEAS_KEY = "gift-stash:ideas:v1";
  const SETTINGS_KEY = "gift-stash:settings:v1";
  const NOTIFIED_KEY = "gift-stash:notified:v1";
  const LANG_KEY = "gs_lang";
  const DB_NAME = "gift-stash";
  const DB_STORE = "photos";

  const els = {
    langSelect: document.getElementById("lang-select"),
    search: document.getElementById("search"),
    remindBanner: document.getElementById("remind-banner"),
    upcomingEmpty: document.getElementById("upcoming-empty"),
    upcomingStrip: document.getElementById("upcoming-strip"),
    upcomingCount: document.getElementById("upcoming-count"),
    peopleStrip: document.getElementById("people-strip"),
    ideaGrid: document.getElementById("idea-grid"),
    ideasEmpty: document.getElementById("ideas-empty"),
    addPersonBtn: document.getElementById("add-person-btn"),
    addIdeaBtn: document.getElementById("add-idea-btn"),
    statusFilters: document.getElementById("status-filters"),
    remindDays: document.getElementById("remind-days"),
    notifyBtn: document.getElementById("notify-btn"),
    notifyStatus: document.getElementById("notify-status"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    toast: document.getElementById("toast"),
    personDialog: document.getElementById("person-dialog"),
    personForm: document.getElementById("person-form"),
    personId: document.getElementById("person-id"),
    personName: document.getElementById("person-name"),
    personBirthday: document.getElementById("person-birthday"),
    personNotes: document.getElementById("person-notes"),
    personFaceBtn: document.getElementById("person-face-btn"),
    personFaceFile: document.getElementById("person-face-file"),
    personFacePreview: document.getElementById("person-face-preview"),
    personFacePlaceholder: document.getElementById("person-face-placeholder"),
    personDelete: document.getElementById("person-delete"),
    personCancel: document.getElementById("person-cancel"),
    occasionList: document.getElementById("occasion-list"),
    addOccasionBtn: document.getElementById("add-occasion-btn"),
    ideaDialog: document.getElementById("idea-dialog"),
    ideaForm: document.getElementById("idea-form"),
    ideaId: document.getElementById("idea-id"),
    ideaTitle: document.getElementById("idea-title"),
    ideaUrl: document.getElementById("idea-url"),
    ideaPrice: document.getElementById("idea-price"),
    ideaPerson: document.getElementById("idea-person"),
    ideaStatus: document.getElementById("idea-status"),
    ideaNote: document.getElementById("idea-note"),
    ideaFile: document.getElementById("idea-file"),
    ideaPreview: document.getElementById("idea-preview"),
    ideaDropHint: document.getElementById("idea-drop-hint"),
    ideaClearPhoto: document.getElementById("idea-clear-photo"),
    ideaDelete: document.getElementById("idea-delete"),
    ideaCancel: document.getElementById("idea-cancel"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmText: document.getElementById("confirm-text"),
  };

  let lang = window.detectLang ? window.detectLang() : "ko";
  let people = loadJson(PEOPLE_KEY, []);
  let ideas = loadJson(IDEAS_KEY, []);
  let settings = Object.assign({ remindDays: 7, notifyEnabled: false }, loadJson(SETTINGS_KEY, {}));
  let filterPerson = "";
  let filterStatus = "";
  let query = "";
  let pendingFaceBlob = null;
  let pendingIdeaBlob = null;
  let pendingFaceId = null;
  let pendingIdeaPhotoId = null;
  let objectUrls = [];
  let confirmAction = null;
  let dbp = openDb();

  function t(key, vars) {
    const dict = (window.GS_I18N && window.GS_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.GS_I18N && window.GS_I18N.en[key]) || key);
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

  function savePeople() { localStorage.setItem(PEOPLE_KEY, JSON.stringify(people)); }
  function saveIdeas() { localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas)); }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function putPhoto(id, blob) {
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(blob, id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getPhoto(id) {
    if (!id) return null;
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function delPhoto(id) {
    if (!id) return;
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

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

  function parseDatePart(s) {
    if (!s) return null;
    const t0 = String(s).trim();
    let m = t0.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return { year: +m[1], month: +m[2], day: +m[3] };
    m = t0.match(/^(\d{1,2})-(\d{1,2})$/);
    if (m) return { year: null, month: +m[1], day: +m[2] };
    m = t0.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (m) return { year: null, month: +m[1], day: +m[2] };
    return null;
  }

  function nextOccurrence(part, from) {
    if (!part) return null;
    const y = from.getFullYear();
    let d = new Date(y, part.month - 1, part.day);
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    if (d < start) d = new Date(y + 1, part.month - 1, part.day);
    return d;
  }

  function daysUntil(date, from) {
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((b - a) / 86400000);
  }

  function whenLabel(days) {
    if (days === 0) return t("today");
    if (days === 1) return t("tomorrow");
    return t("daysAway", { n: days });
  }

  function upcomingList(from, windowDays) {
    const out = [];
    people.forEach((p) => {
      const b = parseDatePart(p.birthday);
      if (b) {
        const next = nextOccurrence(b, from);
        const d = daysUntil(next, from);
        if (d >= 0 && d <= windowDays) {
          let age = null;
          if (b.year) age = next.getFullYear() - b.year;
          out.push({ person: p, label: t("birthdayLabel"), date: next, days: d, age });
        }
      }
      (p.occasions || []).forEach((o) => {
        const part = parseDatePart(o.date);
        if (!part) return;
        const next = nextOccurrence(part, from);
        const d = daysUntil(next, from);
        if (d >= 0 && d <= windowDays) {
          out.push({ person: p, label: o.label || t("anniversary"), date: next, days: d, age: null });
        }
      });
    });
    out.sort((a, b) => a.days - b.days || a.person.name.localeCompare(b.person.name));
    return out;
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("metaDescription"));
    const og = window.GS_OG && (window.GS_OG[lang] || window.GS_OG.en);
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      if (og) el.setAttribute("content", og);
    });
    setText("brand-title", t("title"));
    setText("local-only", t("localOnly"));
    setText("brand-tagline", t("tagline"));
    setText("about-text", t("about"));
    setText("upcoming-title", t("upcoming"));
    setText("people-title", t("people"));
    setText("ideas-title", t("ideas"));
    setText("tools-title", t("tools"));
    setText("add-person-btn", t("addPerson"));
    setText("add-idea-btn", t("addIdea"));
    setText("label-remind-days", t("remindDays"));
    setText("notify-btn", t("notifyAllow"));
    setText("export-btn", t("exportJson"));
    setText("import-label", t("importJson"));
    setText("link-privacy", t("privacy"));
    setText("link-terms", t("terms"));
    setText("label-person-name", t("name"));
    setText("label-birthday", t("birthday"));
    setText("label-person-notes", t("notes"));
    setText("label-occasions", t("occasions"));
    setText("label-idea-title", t("ideaTitle"));
    setText("label-idea-url", t("ideaUrl"));
    setText("label-idea-price", t("ideaPrice"));
    setText("label-idea-person", t("ideaPerson"));
    setText("label-idea-status", t("ideaStatus"));
    setText("label-idea-note", t("ideaNote"));
    setText("pick-file-label", t("pickFile"));
    setText("idea-clear-photo", t("clearPhoto"));
    setText("person-cancel", t("cancel"));
    setText("person-save", t("save"));
    setText("person-delete", t("delete"));
    setText("idea-cancel", t("cancel"));
    setText("idea-save", t("save"));
    setText("idea-delete", t("delete"));
    setText("confirm-cancel", t("cancel"));
    setText("confirm-ok", t("delete"));
    setText("lang-label", t("langLabel"));
    setText("search-label", t("search"));
    setText("upcoming-empty", t("upcomingEmpty"));
    setText("ideas-empty", t("emptyIdeas"));
    setAttr("search", "aria-label", t("search"));
    setAttr("search", "placeholder", t("search"));
    setAttr("person-name", "placeholder", t("namePh"));
    setAttr("person-birthday", "placeholder", t("birthdayPh"));
    setAttr("person-notes", "placeholder", t("notesPh"));
    setAttr("idea-title", "placeholder", t("ideaTitlePh"));
    setText("idea-drop-hint", t("dropHint"));
    const chips = els.statusFilters.querySelectorAll("[data-status]");
    const stMap = { "": "statusAll", idea: "statusIdea", bought: "statusBought", given: "statusGiven" };
    chips.forEach((c) => { c.textContent = t(stMap[c.dataset.status] || "statusAll"); });
    if (els.ideaStatus) {
      els.ideaStatus.querySelectorAll("option").forEach((opt) => {
        opt.textContent = t(stMap[opt.value] || "statusIdea");
      });
    }
    if (els.langSelect) els.langSelect.value = lang;
    updateNotifyStatus();
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setAttr(id, name, val) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(name, val);
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    if (typeof window.persistLangQuery === "function") window.persistLangQuery(lang);
    applyStaticI18n();
    render();
  }

  function matchesQuery(text) {
    if (!query) return true;
    return (text || "").toLowerCase().includes(query);
  }

  async function render() {
    revokeUrls();
    const now = new Date();
    const upcoming = upcomingList(now, 60);
    els.upcomingCount.textContent = String(upcoming.length);
    els.upcomingEmpty.textContent = t("upcomingEmpty");
    els.upcomingEmpty.hidden = upcoming.length > 0;
    els.upcomingStrip.innerHTML = upcoming.map((u) => {
      const extra = u.age ? ` · ${t("yearsOld", { n: u.age })}` : "";
      return `<button type="button" class="up-card${u.days <= settings.remindDays ? " soon" : ""}" data-open-person="${esc(u.person.id)}">
        <div class="when">${esc(whenLabel(u.days))}</div>
        <div class="who">${esc(u.person.name)}</div>
        <div class="what">${esc(u.label)}${esc(extra)}</div>
      </button>`;
    }).join("");

    const qPeople = people.filter((p) => matchesQuery(p.name + " " + (p.notes || "")));
    const chips = [
      `<button type="button" class="person-chip${filterPerson === "" ? " active" : ""}" data-filter-person="">
        <span class="avatar">*</span><span class="nm">${esc(t("everyone"))}</span>
      </button>`,
      `<button type="button" class="person-chip${filterPerson === "__none__" ? " active" : ""}" data-filter-person="__none__">
        <span class="avatar">–</span><span class="nm">${esc(t("unassigned"))}</span>
      </button>`
    ];
    for (const p of qPeople.length && query ? qPeople : people) {
      const blob = await getPhoto(p.photoId);
      const src = blob ? urlFor(blob) : "";
      const initial = (p.name || "?").slice(0, 1);
      chips.push(`<button type="button" class="person-chip${filterPerson === p.id ? " active" : ""}" data-filter-person="${esc(p.id)}" data-edit-person="${esc(p.id)}">
        <span class="avatar">${src ? `<img src="${src}" alt="">` : esc(initial)}</span>
        <span class="nm">${esc(p.name)}</span>
      </button>`);
    }
    els.peopleStrip.innerHTML = chips.join("");

    let shown = ideas.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (filterPerson === "__none__") shown = shown.filter((i) => !i.personId);
    else if (filterPerson) shown = shown.filter((i) => i.personId === filterPerson);
    if (filterStatus) shown = shown.filter((i) => i.status === filterStatus);
    if (query) {
      shown = shown.filter((i) => {
        const p = people.find((x) => x.id === i.personId);
        return matchesQuery([i.title, i.note, i.url, i.price, p && p.name].filter(Boolean).join(" "));
      });
    }
    els.ideasEmpty.textContent = t("emptyIdeas");
    els.ideasEmpty.hidden = shown.length > 0;
    const cards = [];
    for (const idea of shown) {
      const blob = await getPhoto(idea.photoId);
      const src = blob ? urlFor(blob) : "";
      const p = people.find((x) => x.id === idea.personId);
      const st = idea.status || "idea";
      cards.push(`<button type="button" class="idea-card" data-edit-idea="${esc(idea.id)}">
        <div class="thumb">${src ? `<img src="${src}" alt="">` : "🎁"}</div>
        <div class="meta">
          <div class="ttl">${esc(idea.title || "…")}</div>
          <div class="sub"><span class="st-${esc(st)}">${esc(t(st === "bought" ? "statusBought" : st === "given" ? "statusGiven" : "statusIdea"))}</span>${p ? " · " + esc(p.name) : ""}</div>
        </div>
      </button>`);
    }
    els.ideaGrid.innerHTML = cards.join("");

    renderRemindBanner(upcoming, now);
    if (window.Notification && Notification.permission === "granted" && settings.notifyEnabled) {
      fireReminders(upcoming);
    }
  }

  function renderRemindBanner(upcoming, now) {
    const soon = upcoming.filter((u) => u.days <= (settings.remindDays || 7));
    if (!soon.length) {
      els.remindBanner.hidden = true;
      els.remindBanner.innerHTML = "";
      return;
    }
    const list = soon.map((u) => `${u.person.name} (${whenLabel(u.days)})`).join(" · ");
    const needBtn = !(window.Notification && Notification.permission === "granted" && settings.notifyEnabled);
    els.remindBanner.hidden = false;
    els.remindBanner.innerHTML = `${esc(t("bannerSoon", { list }))}${needBtn ? `<br><button type="button" class="btn btn-ghost btn-sm" id="banner-notify">${esc(t("bannerNotify"))}</button>` : ""}`;
  }

  function fireReminders(upcoming) {
    const map = loadJson(NOTIFIED_KEY, {});
    const today = isoDate(new Date());
    const n = settings.remindDays || 7;
    upcoming.filter((u) => u.days <= n).forEach((u) => {
      const key = `${today}:${u.person.id}:${u.label}`;
      if (map[key]) return;
      try {
        new Notification(t("title"), {
          body: `${u.person.name} — ${u.label} · ${whenLabel(u.days)}`,
          icon: "/icons/icon-192.png",
          tag: key
        });
        map[key] = 1;
      } catch (_) {}
    });
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  }

  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function updateNotifyStatus() {
    if (!window.Notification) {
      els.notifyStatus.textContent = t("notifyOff");
      return;
    }
    if (Notification.permission === "denied") els.notifyStatus.textContent = t("notifyDenied");
    else if (Notification.permission === "granted" && settings.notifyEnabled) els.notifyStatus.textContent = t("notifyOn");
    else els.notifyStatus.textContent = t("notifyOff");
  }

  async function requestNotify() {
    if (!window.Notification) { updateNotifyStatus(); return; }
    try {
      const perm = await Notification.requestPermission();
      settings.notifyEnabled = perm === "granted";
      saveSettings();
    } catch (_) { settings.notifyEnabled = false; }
    updateNotifyStatus();
    render();
  }

  function resetPersonForm() {
    els.personForm.reset();
    els.personId.value = "";
    pendingFaceBlob = null;
    pendingFaceId = null;
    els.personFacePreview.hidden = true;
    els.personFacePreview.removeAttribute("src");
    els.personFacePlaceholder.hidden = false;
    els.personDelete.hidden = true;
    els.occasionList.innerHTML = "";
    setText("person-form-title", t("personAdd"));
  }

  function addOccasionRow(label, date) {
    const row = document.createElement("div");
    row.className = "occ-row";
    row.innerHTML = `<input type="text" class="occ-label" placeholder="${esc(t("occLabel"))}" value="${esc(label || t("anniversary"))}" />
      <input type="text" class="occ-date" placeholder="MM-DD" value="${esc(date || "")}" />
      <button type="button" class="btn btn-ghost btn-sm occ-del">×</button>`;
    row.querySelector(".occ-del").addEventListener("click", () => row.remove());
    els.occasionList.appendChild(row);
  }

  function readOccasions() {
    return [...els.occasionList.querySelectorAll(".occ-row")].map((row) => ({
      id: uid(),
      label: row.querySelector(".occ-label").value.trim(),
      date: row.querySelector(".occ-date").value.trim()
    })).filter((o) => o.date);
  }

  async function openPerson(person) {
    resetPersonForm();
    if (person) {
      els.personId.value = person.id;
      els.personName.value = person.name || "";
      els.personBirthday.value = person.birthday || "";
      els.personNotes.value = person.notes || "";
      pendingFaceId = person.photoId || null;
      (person.occasions || []).forEach((o) => addOccasionRow(o.label, o.date));
      els.personDelete.hidden = false;
      setText("person-form-title", t("personEdit"));
      const blob = await getPhoto(person.photoId);
      if (blob) showFace(blob);
    }
    els.personDialog.showModal();
  }

  function showFace(blob) {
    const u = urlFor(blob);
    els.personFacePreview.src = u;
    els.personFacePreview.hidden = false;
    els.personFacePlaceholder.hidden = true;
  }

  function resetIdeaForm() {
    els.ideaForm.reset();
    els.ideaId.value = "";
    pendingIdeaBlob = null;
    pendingIdeaPhotoId = null;
    els.ideaPreview.hidden = true;
    els.ideaPreview.removeAttribute("src");
    els.ideaDropHint.hidden = false;
    els.ideaClearPhoto.hidden = true;
    els.ideaDelete.hidden = true;
    setText("idea-form-title", t("ideaAdd"));
    fillPersonSelect(filterPerson && filterPerson !== "__none__" ? filterPerson : "");
    els.ideaStatus.value = "idea";
  }

  function fillPersonSelect(selected) {
    const opts = [`<option value="">${esc(t("unassigned"))}</option>`]
      .concat(people.map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(p.name)}</option>`));
    els.ideaPerson.innerHTML = opts.join("");
  }

  function showIdeaPhoto(blob) {
    const u = urlFor(blob);
    els.ideaPreview.src = u;
    els.ideaPreview.hidden = false;
    els.ideaDropHint.hidden = true;
    els.ideaClearPhoto.hidden = false;
  }

  async function openIdea(idea, presetBlob) {
    resetIdeaForm();
    if (presetBlob) {
      pendingIdeaBlob = presetBlob;
      showIdeaPhoto(presetBlob);
    }
    if (idea) {
      els.ideaId.value = idea.id;
      els.ideaTitle.value = idea.title || "";
      els.ideaUrl.value = idea.url || "";
      els.ideaPrice.value = idea.price || "";
      els.ideaNote.value = idea.note || "";
      els.ideaStatus.value = idea.status || "idea";
      fillPersonSelect(idea.personId || "");
      pendingIdeaPhotoId = idea.photoId || null;
      els.ideaDelete.hidden = false;
      setText("idea-form-title", t("ideaEdit"));
      const blob = await getPhoto(idea.photoId);
      if (blob) showIdeaPhoto(blob);
    }
    els.ideaDialog.showModal();
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

  async function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people,
      ideas,
      settings,
      photos: {},
      photoSkipped: false
    };
    try {
      for (const p of people) {
        if (!p.photoId) continue;
        const blob = await getPhoto(p.photoId);
        if (blob) payload.photos[p.photoId] = await blobToDataUrl(blob);
      }
      for (const i of ideas) {
        if (!i.photoId) continue;
        const blob = await getPhoto(i.photoId);
        if (blob) payload.photos[i.photoId] = await blobToDataUrl(blob);
      }
    } catch (_) {
      payload.photoSkipped = true;
      payload.photos = {};
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gift-stash-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(payload.photoSkipped ? t("photoSkipped") : t("exported"));
  }

  async function importJson(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.people) || !Array.isArray(data.ideas)) throw new Error("bad");
      people = data.people;
      ideas = data.ideas;
      if (data.settings) settings = Object.assign(settings, data.settings);
      savePeople(); saveIdeas(); saveSettings();
      if (data.photos && typeof data.photos === "object") {
        for (const [id, url] of Object.entries(data.photos)) {
          const blob = dataUrlToBlob(url);
          if (blob) await putPhoto(id, blob);
        }
      }
      showToast(t("imported"));
      render();
    } catch (_) {
      showToast(t("importFail"));
    }
  }

  els.addPersonBtn.addEventListener("click", () => openPerson(null));
  els.addIdeaBtn.addEventListener("click", () => openIdea(null));
  els.addOccasionBtn.addEventListener("click", () => addOccasionRow("", ""));
  els.personCancel.addEventListener("click", () => els.personDialog.close());
  els.ideaCancel.addEventListener("click", () => els.ideaDialog.close());
  els.personFaceBtn.addEventListener("click", () => els.personFaceFile.click());
  els.personFaceFile.addEventListener("change", () => {
    const f = blobFromFile(els.personFaceFile.files[0]);
    if (!f) return;
    pendingFaceBlob = f;
    showFace(f);
  });
  els.ideaFile.addEventListener("change", () => {
    const f = blobFromFile(els.ideaFile.files[0]);
    if (!f) return;
    pendingIdeaBlob = f;
    showIdeaPhoto(f);
  });
  els.ideaClearPhoto.addEventListener("click", () => {
    pendingIdeaBlob = null;
    pendingIdeaPhotoId = null;
    els.ideaPreview.hidden = true;
    els.ideaPreview.removeAttribute("src");
    els.ideaDropHint.hidden = false;
    els.ideaClearPhoto.hidden = true;
  });

  els.personForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = els.personName.value.trim();
    if (!name) { showToast(t("needName")); return; }
    let id = els.personId.value || uid();
    let existing = people.find((p) => p.id === id);
    let photoId = existing ? existing.photoId : pendingFaceId;
    if (pendingFaceBlob) {
      photoId = photoId || uid();
      await putPhoto(photoId, pendingFaceBlob);
    }
    const rec = {
      id,
      name,
      birthday: els.personBirthday.value.trim(),
      notes: els.personNotes.value.trim(),
      photoId: photoId || null,
      occasions: readOccasions(),
      createdAt: existing ? existing.createdAt : Date.now()
    };
    if (existing) people = people.map((p) => p.id === id ? rec : p);
    else people.push(rec);
    savePeople();
    els.personDialog.close();
    showToast(t("saved"));
    render();
  });

  els.ideaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let id = els.ideaId.value || uid();
    let existing = ideas.find((i) => i.id === id);
    let photoId = existing ? existing.photoId : pendingIdeaPhotoId;
    if (pendingIdeaBlob) {
      photoId = photoId || uid();
      await putPhoto(photoId, pendingIdeaBlob);
    }
    if (!photoId && !els.ideaTitle.value.trim()) {
      photoId = photoId;
    }
    const rec = {
      id,
      personId: els.ideaPerson.value || "",
      title: els.ideaTitle.value.trim(),
      url: els.ideaUrl.value.trim(),
      price: els.ideaPrice.value.trim(),
      note: els.ideaNote.value.trim(),
      status: els.ideaStatus.value || "idea",
      photoId: photoId || null,
      createdAt: existing ? existing.createdAt : Date.now()
    };
    if (existing) ideas = ideas.map((i) => i.id === id ? rec : i);
    else ideas.push(rec);
    saveIdeas();
    els.ideaDialog.close();
    showToast(t("saved"));
    render();
  });

  els.personDelete.addEventListener("click", () => {
    const id = els.personId.value;
    const p = people.find((x) => x.id === id);
    if (!p) return;
    confirmDelete(t("deletePersonConfirm", { name: p.name }), async () => {
      people = people.filter((x) => x.id !== id);
      ideas = ideas.map((i) => i.personId === id ? { ...i, personId: "" } : i);
      await delPhoto(p.photoId);
      savePeople(); saveIdeas();
      els.personDialog.close();
      showToast(t("deleted"));
      render();
    });
  });

  els.ideaDelete.addEventListener("click", () => {
    const id = els.ideaId.value;
    const idea = ideas.find((x) => x.id === id);
    if (!idea) return;
    confirmDelete(t("deleteIdeaConfirm"), async () => {
      ideas = ideas.filter((x) => x.id !== id);
      await delPhoto(idea.photoId);
      saveIdeas();
      els.ideaDialog.close();
      showToast(t("deleted"));
      render();
    });
  });

  els.confirmDialog.addEventListener("close", () => {
    if (els.confirmDialog.returnValue === "confirm" && confirmAction) confirmAction();
    confirmAction = null;
  });

  document.addEventListener("click", (e) => {
    const fp = e.target.closest("[data-filter-person]");
    if (fp && (fp.closest("#people-strip"))) {
      const id = fp.getAttribute("data-filter-person");
      if (fp.hasAttribute("data-edit-person") && filterPerson === id) {
        const p = people.find((x) => x.id === id);
        if (p) openPerson(p);
        return;
      }
      filterPerson = id;
      render();
      return;
    }
    const op = e.target.closest("[data-open-person]");
    if (op) {
      const p = people.find((x) => x.id === op.getAttribute("data-open-person"));
      if (p) { filterPerson = p.id; render(); }
      return;
    }
    const ei = e.target.closest("[data-edit-idea]");
    if (ei) {
      const idea = ideas.find((x) => x.id === ei.getAttribute("data-edit-idea"));
      if (idea) openIdea(idea);
    }
    if (e.target.id === "banner-notify") requestNotify();
  });

  // long-press / double-click person chip to edit (also tap again when already selected)
  els.peopleStrip.addEventListener("dblclick", (e) => {
    const btn = e.target.closest("[data-edit-person]");
    if (!btn) return;
    const p = people.find((x) => x.id === btn.getAttribute("data-edit-person"));
    if (p) openPerson(p);
  });

  els.statusFilters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    filterStatus = btn.dataset.status;
    els.statusFilters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
    render();
  });

  els.search.addEventListener("input", () => {
    query = els.search.value.trim().toLowerCase();
    render();
  });

  els.remindDays.addEventListener("change", () => {
    settings.remindDays = Math.max(1, Math.min(60, Number(els.remindDays.value) || 7));
    els.remindDays.value = settings.remindDays;
    saveSettings();
    render();
  });
  els.notifyBtn.addEventListener("click", requestNotify);
  els.exportBtn.addEventListener("click", exportJson);
  els.importFile.addEventListener("change", () => {
    const f = els.importFile.files[0];
    if (f) importJson(f);
    els.importFile.value = "";
  });
  if (els.langSelect) els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));

  document.addEventListener("paste", async (e) => {
    const blob = await blobFromClipboard(e);
    if (!blob) return;
    if (els.ideaDialog.open) {
      pendingIdeaBlob = blob;
      showIdeaPhoto(blob);
      e.preventDefault();
      return;
    }
    if (els.personDialog.open) {
      pendingFaceBlob = blob;
      showFace(blob);
      e.preventDefault();
      return;
    }
    e.preventDefault();
    openIdea(null, blob);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  els.remindDays.value = settings.remindDays || 7;
  applyStaticI18n();
  render();
})();
