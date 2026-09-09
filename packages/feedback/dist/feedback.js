// SOURCE OF TRUTH: coreanq/try-dabble-apps -> packages/feedback/src/feedback.js
(function () {
  if (window.__tdFeedback) return;
  window.__tdFeedback = true;
  var SITE = "https://try-dabble.com";
  var COPY = {
    ko: { btn: "가이드 & 의견" },
    en: { btn: "Guide & Feedback" },
    ja: { btn: "ガイド & 意見" },
    zh: { btn: "指南 & 反馈" }
  };
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
  var css = document.createElement("style");
  css.textContent = [
    ".td-fb-root{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
    ".td-fb-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:2px solid #111;border-radius:999px;padding:10px 14px;font:700 13px/1.2 system-ui,sans-serif;color:#111;background:#ffcc33;box-shadow:0 0 0 2px #fff,0 8px 22px rgba(0,0,0,.35);cursor:pointer;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-btn{border-color:#ffcc33;box-shadow:0 0 0 2px #111,0 8px 22px rgba(0,0,0,.55)}"
  ].join("");
  document.head.appendChild(css);
  var root = document.createElement("div");
  root.className = "td-fb-root" + (pageIsDark() ? " td-dark" : "");
  var btn = document.createElement("button");
  btn.className = "td-fb-btn";
  btn.type = "button";
  btn.textContent = t.btn;
  btn.addEventListener("click", function () {
    // Do NOT pass "noopener" as a windowFeatures flag: browsers then return
    // null even when the tab opened, which made the same-tab fallback always
    // fire. Null opener separately; only navigate this tab if open was blocked.
    var w = window.open(href, "_blank");
    if (w) {
      try { w.opener = null; } catch (e) {}
    } else {
      location.href = href;
    }
  });
  function mount() {
    root.appendChild(btn);
    document.body.appendChild(root);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
