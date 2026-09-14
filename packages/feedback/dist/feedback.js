// SOURCE OF TRUTH: coreanq/try-dabble-apps -> packages/feedback/src/feedback.js
//
// One floating button per app. It opens a small panel with two things:
//  - the app's guide & feedback page on try-dabble.com (new tab)
//  - "interested" items for server features that do not exist yet; a tap
//    posts {kind:"demand", feature} to the hub, plus an email only if typed.
// It also reports anonymous usage events (open / return / save) to
// try-dabble.com/api/track: app name + event name + UI language, nothing else.
// Apps may call window.tdTrack("save") once when the user first stores something.
(function () {
  if (window.__tdFeedback) return;
  window.__tdFeedback = true;
  var SITE = "https://try-dabble.com";
  var COPY = {
    ko: { btn: "가이드 & 의견", guide: "가이드 열기 · 의견 보내기", demandTitle: "이런 기능이 있으면 쓰시겠어요?", sync: "다른 기기에서 열기", backup: "자동 백업", team: "팀과 공유", ask: "아직 없습니다. 만들면 알려드릴까요?", email: "이메일 (선택)", send: "알려주세요", skip: "이메일 없이 등록", done: "등록됐습니다. 고맙습니다.", fail: "지금은 보낼 수 없습니다. 잠시 뒤 다시 시도해 주세요.", close: "닫기" },
    en: { btn: "Guide & Feedback", guide: "Open the guide · send feedback", demandTitle: "Would you use this if it existed?", sync: "Open on another device", backup: "Automatic backup", team: "Share with a team", ask: "Not built yet. Want to hear when it is?", email: "Email (optional)", send: "Tell me", skip: "Register without email", done: "Registered. Thank you.", fail: "Could not send right now. Please try again later.", close: "Close" },
    ja: { btn: "ガイド & 意見", guide: "ガイドを開く · 意見を送る", demandTitle: "こんな機能があれば使いますか？", sync: "別の端末で開く", backup: "自動バックアップ", team: "チームで共有", ask: "まだありません。できたらお知らせしましょうか？", email: "メール（任意）", send: "知らせてほしい", skip: "メールなしで登録", done: "登録しました。ありがとうございます。", fail: "今は送信できません。しばらくして再度お試しください。", close: "閉じる" },
    zh: { btn: "指南 & 反馈", guide: "打开指南 · 发送反馈", demandTitle: "如果有这些功能，你会用吗？", sync: "在其他设备打开", backup: "自动备份", team: "与团队共享", ask: "还没有做。做好后通知你？", email: "邮箱（可选）", send: "请通知我", skip: "不留邮箱直接登记", done: "已登记，谢谢。", fail: "现在无法发送，请稍后再试。", close: "关闭" }
  };
  var FEATURES = ["sync", "backup", "team"];
  function lang() {
    var s = document.currentScript;
    var q = "";
    try { q = new URLSearchParams(location.search).get("lang") || ""; } catch (e) {}
    var a = (s && s.getAttribute("data-lang")) || q || document.documentElement.lang || "";
    a = String(a).slice(0, 2).toLowerCase();
    return COPY[a] ? a : "ko";
  }
  function slug() {
    var s = document.currentScript;
    var from = s && s.getAttribute("data-app");
    if (from) return from;
    var h = location.hostname;
    var m = h.match(/^([a-z0-9-]+)\.try-dabble\.com$/i);
    return m ? m[1] : "";
  }
  function pageIsDark() {
    try {
      if (document.documentElement.getAttribute("data-theme") === "dark") return true;
      if (document.documentElement.classList.contains("dark")) return true;
      if (document.body && document.body.classList.contains("dark")) return true;
      var bg = getComputedStyle(document.body || document.documentElement).backgroundColor;
      var m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        var y = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
        return y < 0.45;
      }
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var L = lang();
  var t = COPY[L];
  var app = slug();
  var href = SITE + "/" + L + "/guides" + (app ? "/" + app : "");

  // ---- anonymous usage events ----------------------------------------------
  function track(ev) {
    try {
      if (!app || !ev) return;
      var body = JSON.stringify({ app: app, event: String(ev).slice(0, 20), lang: L });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(SITE + "/api/track", new Blob([body], { type: "text/plain" }));
      } else {
        fetch(SITE + "/api/track", { method: "POST", body: body, mode: "cors", keepalive: true, headers: { "Content-Type": "text/plain" } });
      }
    } catch (e) {}
  }
  window.tdTrack = track;
  function trackVisit() {
    track("open");
    // "return": the same browser opened this app again 1–30 days after the
    // first time. The first-open day stays in this browser; nothing else is kept.
    try {
      var key = "td:first:" + app;
      var first = Number(localStorage.getItem(key) || 0);
      var now = Date.now();
      if (!first) { localStorage.setItem(key, String(now)); return; }
      var days = (now - first) / 86400000;
      if (days >= 1 && days <= 30 && !localStorage.getItem(key + ":ret")) {
        localStorage.setItem(key + ":ret", "1");
        track("return");
      }
    } catch (e) {}
  }

  // ---- UI ------------------------------------------------------------------
  var css = document.createElement("style");
  css.textContent = [
    ".td-fb-root{-webkit-text-size-adjust:100%;text-size-adjust:100%;font:13px/1.4 system-ui,sans-serif;color:#111}",
    ".td-fb-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:2px solid #111;border-radius:999px;padding:10px 14px;font:700 13px/1.2 system-ui,sans-serif;color:#111;background:#ffcc33;box-shadow:0 0 0 2px #fff,0 8px 22px rgba(0,0,0,.35);cursor:pointer;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-btn{border-color:#ffcc33;box-shadow:0 0 0 2px #111,0 8px 22px rgba(0,0,0,.55)}",
    ".td-fb-panel{position:fixed;right:16px;bottom:64px;z-index:2147483000;width:min(280px,calc(100vw - 32px));border:2px solid #111;border-radius:14px;background:#fff;color:#111;box-shadow:0 12px 30px rgba(0,0,0,.35);padding:10px;display:none}",
    ".td-fb-panel.td-open{display:block}",
    ".td-fb-root.td-dark .td-fb-panel{background:#1b1b1b;color:#f2f2f2;border-color:#ffcc33}",
    ".td-fb-item{display:block;width:100%;box-sizing:border-box;text-align:left;border:1px solid rgba(128,128,128,.4);border-radius:10px;background:transparent;color:inherit;padding:9px 10px;margin:4px 0;font:inherit;cursor:pointer}",
    ".td-fb-item.td-primary{background:#ffcc33;color:#111;border-color:#111;font-weight:700}",
    ".td-fb-h{font-weight:700;margin:8px 2px 4px;opacity:.85}",
    ".td-fb-p{margin:6px 2px}",
    ".td-fb-in{display:block;width:100%;box-sizing:border-box;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:8px;font:inherit;background:transparent;color:inherit;margin:6px 0}",
    ".td-fb-x{position:absolute;top:6px;right:8px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;opacity:.7}"
  ].join("");
  document.head.appendChild(css);
  var root = document.createElement("div");
  root.className = "td-fb-root" + (pageIsDark() ? " td-dark" : "");
  var btn = document.createElement("button");
  btn.className = "td-fb-btn";
  btn.type = "button";
  btn.textContent = t.btn;
  var panel = document.createElement("div");
  panel.className = "td-fb-panel";
  panel.setAttribute("role", "dialog");

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function openGuide() {
    // Do NOT pass "noopener" as a windowFeatures flag: browsers then return
    // null even when the tab opened, which made the same-tab fallback always
    // fire. Null opener separately; only navigate this tab if open was blocked.
    var w = window.open(href, "_blank");
    if (w) {
      try { w.opener = null; } catch (e) {}
    } else {
      location.href = href;
    }
  }
  function renderMenu() {
    panel.innerHTML = "";
    var x = el("button", "td-fb-x", "×"); x.type = "button"; x.setAttribute("aria-label", t.close);
    x.addEventListener("click", function () { panel.classList.remove("td-open"); });
    panel.appendChild(x);
    var g = el("button", "td-fb-item td-primary", t.guide); g.type = "button";
    g.addEventListener("click", openGuide);
    panel.appendChild(g);
    if (!app) return;
    panel.appendChild(el("div", "td-fb-h", t.demandTitle));
    FEATURES.forEach(function (f) {
      var b = el("button", "td-fb-item", t[f]); b.type = "button";
      b.addEventListener("click", function () { renderAsk(f); });
      panel.appendChild(b);
    });
  }
  function renderAsk(feature) {
    panel.innerHTML = "";
    panel.appendChild(el("div", "td-fb-h", t[feature]));
    panel.appendChild(el("div", "td-fb-p", t.ask));
    var input = el("input", "td-fb-in"); input.type = "email"; input.placeholder = t.email; input.autocomplete = "email";
    panel.appendChild(input);
    var send = el("button", "td-fb-item td-primary", t.send); send.type = "button";
    var skip = el("button", "td-fb-item", t.skip); skip.type = "button";
    var msg = el("div", "td-fb-p", "");
    panel.appendChild(send); panel.appendChild(skip); panel.appendChild(msg);
    function submit(withEmail) {
      var email = withEmail ? String(input.value || "").trim() : "";
      send.disabled = skip.disabled = true;
      fetch(SITE + "/api/feedback", {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: app, kind: "demand", feature: feature, email: email, lang: L })
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        msg.textContent = t.done;
        setTimeout(function () { panel.classList.remove("td-open"); renderMenu(); }, 1500);
      }).catch(function () {
        msg.textContent = t.fail;
        send.disabled = skip.disabled = false;
      });
    }
    send.addEventListener("click", function () { submit(true); });
    skip.addEventListener("click", function () { submit(false); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(true); });
    input.focus();
  }
  btn.addEventListener("click", function () {
    if (panel.classList.contains("td-open")) { panel.classList.remove("td-open"); return; }
    renderMenu();
    panel.classList.add("td-open");
  });
  function mount() {
    root.appendChild(panel);
    root.appendChild(btn);
    document.body.appendChild(root);
    trackVisit();
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
