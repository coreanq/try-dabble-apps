(() => {
  const STORAGE_KEY = "cost-per-use:items:v2";
  const STORAGE_KEY_V1 = "cost-per-use:items:v1";
  const SORT_KEY = "cost-per-use:sort:v1";
  const LANG_KEY = "cpu_lang";

  const els = {
    form: document.getElementById("item-form"),
    id: document.getElementById("item-id"),
    name: document.getElementById("name"),
    price: document.getElementById("price"),
    purchaseDate: document.getElementById("purchase-date"),
    lifetimeValue: document.getElementById("lifetime-value"),
    lifetimeUnit: document.getElementById("lifetime-unit"),
    lifetimeHint: document.getElementById("lifetime-hint"),
    timesUsed: document.getElementById("times-used"),
    submitBtn: document.getElementById("submit-btn"),
    cancelEdit: document.getElementById("cancel-edit"),
    formTitle: document.getElementById("form-title"),
    livePreview: document.getElementById("live-preview"),
    previewPerDay: document.getElementById("preview-per-day"),
    previewPerUse: document.getElementById("preview-per-use"),
    list: document.getElementById("item-list"),
    empty: document.getElementById("empty-state"),
    count: document.getElementById("item-count"),
    dialog: document.getElementById("confirm-dialog"),
    confirmText: document.getElementById("confirm-text"),
    langSelect: document.getElementById("lang-select"),
    toast: document.getElementById("toast"),
  };

  let lang = window.detectLang ? window.detectLang() : "en";
  let items = loadItems();
  let sortId = localStorage.getItem(SORT_KEY) || "recent";
  let pendingDeleteId = null;
  let editing = false;

  const SORT_IDS = ["recent", "perDay", "name"];

  function t(key, vars) {
    const dict = (window.CPU_I18N && window.CPU_I18N[lang]) || {};
    let s = dict[key] != null ? dict[key] : ((window.CPU_I18N && window.CPU_I18N.en[key]) || key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.replaceAll(`{${k}}`, String(vars[k]));
      });
    }
    return s;
  }

  function localeInfo() {
    return (window.CPU_LOCALE && window.CPU_LOCALE[lang]) || window.CPU_LOCALE.en;
  }

  function uid() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function normalizeItem(it) {
    return {
      ...it,
      lifetimeValue:
        it.lifetimeValue == null || it.lifetimeValue === ""
          ? null
          : Number(it.lifetimeValue),
      lifetimeUnit: it.lifetimeUnit || "days",
    };
  }

  function loadItems() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const v1 = localStorage.getItem(STORAGE_KEY_V1);
        if (v1) {
          const parsed = JSON.parse(v1);
          if (Array.isArray(parsed)) {
            const migrated = parsed.map((it) =>
              normalizeItem({
                ...it,
                lifetimeValue: null,
                lifetimeUnit: "days",
              })
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
          }
        }
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeItem) : [];
    } catch {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseLocalDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function daysSince(iso) {
    const start = parseLocalDate(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((today - start) / 86400000);
    return Math.max(diff, 0);
  }

  function lifetimeToDays(value, unit) {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) return 0;
    if (unit === "months") return v * 30.44;
    if (unit === "years") return v * 365.25;
    return v;
  }

  function formatMoney(n) {
    if (!Number.isFinite(n)) return "—";
    const { locale, currency } = localeInfo();
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "KRW" || currency === "JPY" ? 0 : 2,
      }).format(currency === "KRW" || currency === "JPY" ? Math.round(n) : Math.round(n * 100) / 100);
    } catch {
      return String(Math.round(n));
    }
  }

  function calcMetrics(item) {
    const price = Number(item.price) || 0;
    const ownedDays = daysSince(item.purchaseDate);
    const lifetimeDays = lifetimeToDays(item.lifetimeValue, item.lifetimeUnit || "days");
    let perDay;
    let usesLifetimeFallback = false;
    if (lifetimeDays > 0) {
      perDay = price / lifetimeDays;
    } else {
      perDay = price / Math.max(ownedDays, 1);
      usesLifetimeFallback = true;
    }
    const times = item.timesUsed;
    const perUse =
      times != null && times !== "" && Number(times) > 0 ? price / Number(times) : null;
    return { days: ownedDays, ownedDays, lifetimeDays, perDay, perUse, usesLifetimeFallback };
  }

  function unitLabel(unit) {
    if (unit === "months") return t("lifetimeMonths");
    if (unit === "years") return t("lifetimeYears");
    return t("lifetimeDays");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t("title");

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("metaDescription"));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("title"));
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", t("metaDescription"));
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", t("title"));
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", t("metaDescription"));
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute("content", t("shortName"));

    const brandTitle = document.getElementById("brand-title");
    if (brandTitle) brandTitle.textContent = t("title");
    const brandTag = document.getElementById("brand-tagline");
    if (brandTag) brandTag.textContent = t("tagline");

    const langLabel = document.getElementById("lang-label");
    if (langLabel) langLabel.textContent = t("langLabel");
    if (els.langSelect) els.langSelect.value = lang;

    document.getElementById("label-name").textContent = t("name");
    document.getElementById("label-price").textContent = t("price");
    document.getElementById("label-date").textContent = t("date");
    document.getElementById("label-uses").textContent = t("uses");
    const labelLifetime = document.getElementById("label-lifetime");
    if (labelLifetime) labelLifetime.textContent = t("lifetime");
    const labelLifetimeUnit = document.getElementById("label-lifetime-unit");
    if (labelLifetimeUnit) labelLifetimeUnit.textContent = t("lifetimeUnit");
    const optDays = document.getElementById("opt-lifetime-days");
    if (optDays) optDays.textContent = t("lifetimeDays");
    const optMonths = document.getElementById("opt-lifetime-months");
    if (optMonths) optMonths.textContent = t("lifetimeMonths");
    const optYears = document.getElementById("opt-lifetime-years");
    if (optYears) optYears.textContent = t("lifetimeYears");
    els.name.placeholder = t("namePh");
    els.price.placeholder = t("pricePh");
    els.timesUsed.placeholder = t("usesPh");
    if (els.lifetimeValue) els.lifetimeValue.placeholder = t("lifetimePh");
    document.getElementById("currency-hint").textContent = t("currencyHint");

    document.getElementById("preview-day-label").textContent = t("previewDay");
    document.getElementById("preview-use-label").textContent = t("previewUse");
    document.getElementById("list-title").textContent = t("listTitle");
    els.empty.textContent = t("empty");
    document.getElementById("about-text").textContent = t("about");
    document.getElementById("link-privacy").textContent = t("privacy");
    document.getElementById("link-terms").textContent = t("terms");
    const adLabel = document.getElementById("ad-placeholder-label");
    if (adLabel) adLabel.textContent = t("adPlaceholder");
    document.getElementById("confirm-cancel").textContent = t("cancel");
    document.getElementById("confirm-ok").textContent = t("delete");

    els.formTitle.textContent = editing ? t("editTitle") : t("formTitle");
    els.submitBtn.textContent = editing ? t("update") : t("save");
    els.cancelEdit.textContent = t("cancel");
  }

  function sortedItems() {
    const copy = [...items];
    const loc = localeInfo().locale;
    if (sortId === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name, loc));
    } else if (sortId === "perDay") {
      copy.sort((a, b) => calcMetrics(b).perDay - calcMetrics(a).perDay);
    } else {
      copy.sort((a, b) => String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
    }
    return copy;
  }

  function sortLabel() {
    if (sortId === "perDay") return t("sortPerDay");
    if (sortId === "name") return t("sortName");
    return t("sortRecent");
  }

  function render() {
    els.count.textContent = String(items.length);
    els.count.title = sortLabel();
    els.count.setAttribute("aria-label", sortLabel());

    if (!items.length) {
      els.empty.style.display = "";
      els.list.innerHTML = "";
      return;
    }

    els.empty.style.display = "none";
    els.list.innerHTML = sortedItems()
      .map((item) => {
        const { ownedDays, perDay, perUse, usesLifetimeFallback } = calcMetrics(item);
        const timesLabel =
          item.timesUsed != null && item.timesUsed !== ""
            ? t("usesCount", { n: Number(item.timesUsed).toLocaleString(localeInfo().locale) })
            : t("noUses");
        const lifePart =
          item.lifetimeValue != null && Number(item.lifetimeValue) > 0
            ? t("lifetimeLabel", {
                n: Number(item.lifetimeValue),
                unit: unitLabel(item.lifetimeUnit || "days"),
              })
            : usesLifetimeFallback
              ? t("lifetimeHintShort")
              : "";
        const metaBits = [
          formatMoney(Number(item.price)),
          escapeHtml(item.purchaseDate),
          t("daysOwned", { n: ownedDays }),
          lifePart,
          timesLabel,
        ].filter(Boolean);
        return `
          <article class="item" data-id="${escapeHtml(item.id)}">
            <div class="item-top">
              <div>
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-meta">
                  ${metaBits.join(" · ")}
                </div>
              </div>
              <div class="item-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-action="edit">${t("edit")}</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="delete">${t("delete")}</button>
              </div>
            </div>
            <div class="item-stats">
              <div class="chip">
                <span>${t("costPerDay")}</span>
                <strong>${formatMoney(perDay)}</strong>
              </div>
              <div class="chip">
                <span>${t("costPerUse")}</span>
                <strong>${perUse == null ? "—" : formatMoney(perUse)}</strong>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function updateLifetimeHint(metrics) {
    if (!els.lifetimeHint) return;
    const show =
      metrics &&
      metrics.usesLifetimeFallback &&
      (metrics.ownedDays <= 1 || !els.lifetimeValue.value);
    if (show) {
      els.lifetimeHint.textContent = t("lifetimeHint");
      els.lifetimeHint.hidden = false;
    } else {
      els.lifetimeHint.hidden = true;
    }
  }

  function updatePreview() {
    const price = Number(els.price.value);
    const date = els.purchaseDate.value;
    const timesRaw = els.timesUsed.value;
    const lifeRaw = els.lifetimeValue ? els.lifetimeValue.value : "";
    if (!date || !Number.isFinite(price) || price < 0 || els.price.value === "") {
      els.livePreview.hidden = true;
      updateLifetimeHint(null);
      return;
    }
    const metrics = calcMetrics({
      price,
      purchaseDate: date,
      timesUsed: timesRaw === "" ? null : Number(timesRaw),
      lifetimeValue: lifeRaw === "" ? null : Number(lifeRaw),
      lifetimeUnit: els.lifetimeUnit ? els.lifetimeUnit.value : "days",
    });
    els.previewPerDay.textContent = formatMoney(metrics.perDay);
    els.previewPerUse.textContent =
      metrics.perUse == null ? t("needUse") : formatMoney(metrics.perUse);
    els.livePreview.hidden = false;
    updateLifetimeHint(metrics);
  }

  function resetForm() {
    els.form.reset();
    els.id.value = "";
    editing = false;
    els.purchaseDate.value = todayISO();
    if (els.lifetimeValue) els.lifetimeValue.value = "1";  /* default 1 year */
    if (els.lifetimeUnit) els.lifetimeUnit.value = "years";
    els.formTitle.textContent = t("formTitle");
    els.submitBtn.textContent = t("save");
    els.cancelEdit.hidden = true;
    updatePreview();
  }

  function startEdit(item) {
    editing = true;
    els.id.value = item.id;
    els.name.value = item.name;
    els.price.value = item.price;
    els.purchaseDate.value = item.purchaseDate;
    els.timesUsed.value =
      item.timesUsed == null || item.timesUsed === "" ? "" : item.timesUsed;
    if (els.lifetimeValue) {
      els.lifetimeValue.value =
        item.lifetimeValue == null || item.lifetimeValue === "" ? "" : item.lifetimeValue;
    }
    if (els.lifetimeUnit) {
      els.lifetimeUnit.value = item.lifetimeUnit || "years";
    }
    els.formTitle.textContent = t("editTitle");
    els.submitBtn.textContent = t("update");
    els.cancelEdit.hidden = false;
    updatePreview();
    els.name.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validate() {
    let ok = true;
    [els.name, els.price, els.purchaseDate].forEach((el) => {
      const valid = el.value.trim() !== "" && el.checkValidity();
      el.style.borderColor = valid ? "" : "var(--danger)";
      if (!valid) ok = false;
    });
    if (els.price.value !== "" && Number(els.price.value) < 0) {
      els.price.style.borderColor = "var(--danger)";
      ok = false;
    }
    if (els.timesUsed.value !== "" && Number(els.timesUsed.value) < 0) {
      els.timesUsed.style.borderColor = "var(--danger)";
      ok = false;
    }
    if (els.lifetimeValue && els.lifetimeValue.value !== "" && Number(els.lifetimeValue.value) < 0) {
      els.lifetimeValue.style.borderColor = "var(--danger)";
      ok = false;
    } else if (els.lifetimeValue) {
      els.lifetimeValue.style.borderColor = "";
    }
    return ok;
  }

  function setLang(next) {
    if (!window.CPU_I18N[next]) return;
    lang = next;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_) {}
    if (typeof window.persistLangQuery === "function") window.persistLangQuery(lang);
    applyStaticI18n();
    render();
    updatePreview();
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast(t("invalid"));
      return;
    }

    const lifeRaw = els.lifetimeValue ? els.lifetimeValue.value : "";
    const payload = {
      id: els.id.value || uid(),
      name: els.name.value.trim(),
      price: Number(els.price.value),
      purchaseDate: els.purchaseDate.value,
      timesUsed: els.timesUsed.value === "" ? null : Number(els.timesUsed.value),
      lifetimeValue: lifeRaw === "" ? null : Number(lifeRaw),
      lifetimeUnit: els.lifetimeUnit ? els.lifetimeUnit.value : "years",
      updatedAt: new Date().toISOString(),
    };

    const idx = items.findIndex((it) => it.id === payload.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...payload };
    } else {
      items.push({ ...payload, createdAt: payload.updatedAt });
    }
    saveItems();
    resetForm();
    render();
    showToast(t("saved"));
  });

  els.cancelEdit.addEventListener("click", () => resetForm());

  ["input", "change"].forEach((evt) => {
    els.form.addEventListener(evt, updatePreview);
  });

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const card = btn.closest("[data-id]");
    if (!card) return;
    const id = card.getAttribute("data-id");
    const item = items.find((it) => it.id === id);
    if (!item) return;

    if (btn.dataset.action === "edit") {
      startEdit(item);
      return;
    }
    if (btn.dataset.action === "delete") {
      pendingDeleteId = id;
      els.confirmText.textContent = t("deleteConfirm", { name: item.name });
      els.dialog.showModal();
    }
  });

  els.dialog.addEventListener("close", () => {
    if (els.dialog.returnValue === "confirm" && pendingDeleteId) {
      items = items.filter((it) => it.id !== pendingDeleteId);
      saveItems();
      if (els.id.value === pendingDeleteId) resetForm();
      render();
      showToast(t("deleted"));
    }
    pendingDeleteId = null;
  });

  els.count.addEventListener("click", () => {
    const idx = SORT_IDS.indexOf(sortId);
    sortId = SORT_IDS[(idx + 1) % SORT_IDS.length];
    localStorage.setItem(SORT_KEY, sortId);
    render();
  });
  els.count.style.cursor = "pointer";

  if (els.langSelect) {
    els.langSelect.addEventListener("change", () => setLang(els.langSelect.value));
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  applyStaticI18n();
  els.purchaseDate.value = todayISO();
  if (els.lifetimeUnit) els.lifetimeUnit.value = "years";
  render();
  updatePreview();
})();
