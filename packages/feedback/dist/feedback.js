// SOURCE OF TRUTH: coreanq/try-dabble-apps -> packages/feedback/src/feedback.js
(function () {
  if (window.__tdFeedback) return;
  window.__tdFeedback = true;
  var ENDPOINT = "https://try-dabble.com/api/feedback";
  var COPY = {
    ko: { btn: "의견", idea: "기능 건의", bug: "버그 보고", title: "제목", body: "내용", send: "보내기", sent: "등록했어요.", err: "다시 시도해 주세요.", close: "닫기", photo: "이미지 첨부", drop: "최대 2장", fileEmpty: "선택된 파일 없음", fileOne: "1개 선택됨", fileTwo: "2개 선택됨" },
    en: { btn: "Feedback", idea: "Feature idea", bug: "Bug report", title: "Title", body: "Details", send: "Send", sent: "Saved.", err: "Please try again.", close: "Close", photo: "Attach images", drop: "Up to 2", fileEmpty: "No file selected", fileOne: "1 selected", fileTwo: "2 selected" },
    ja: { btn: "意見", idea: "機能の提案", bug: "バグ報告", title: "タイトル", body: "内容", send: "送る", sent: "登録しました。", err: "もう一度試してください。", close: "閉じる", photo: "画像を添付", drop: "最大2枚", fileEmpty: "ファイル未選択", fileOne: "1件選択", fileTwo: "2件選択" },
    zh: { btn: "反馈", idea: "功能建议", bug: "问题反馈", title: "标题", body: "内容", send: "发送", sent: "已登记。", err: "请再试一次。", close: "关闭", photo: "添加图片", drop: "最多 2 张", fileEmpty: "未选择文件", fileOne: "已选 1 个", fileTwo: "已选 2 个" }
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
  var css = document.createElement("style");
  css.textContent = [
    ".td-fb-root{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
    ".td-fb-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:2px solid #111;border-radius:999px;padding:10px 14px;font:700 13px/1.2 system-ui,sans-serif;color:#111;background:#ffcc33;box-shadow:0 0 0 2px #fff,0 8px 22px rgba(0,0,0,.35);cursor:pointer;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-btn{border-color:#ffcc33;box-shadow:0 0 0 2px #111,0 8px 22px rgba(0,0,0,.55)}",
    ".td-fb-panel{position:fixed;right:16px;bottom:68px;z-index:2147483000;width:min(22rem,calc(100vw - 32px));background:#fff;color:#111;border:1px solid #d0d0d0;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.28);padding:14px;font:14px/1.45 system-ui,sans-serif;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-panel{background:#161616;color:#f3f3f3;border-color:#3a3a3a;box-shadow:0 16px 40px rgba(0,0,0,.55)}",
    ".td-fb-panel h2{margin:0 0 10px;font-size:15px}",
    ".td-fb-row{display:flex;gap:6px;margin:0 0 10px}",
    ".td-fb-row button{flex:1;border:1px solid #c8c8c8;background:#f3f3f3;color:#111;border-radius:8px;padding:7px;cursor:pointer;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-row button{border-color:#4a4a4a;background:#2a2a2a;color:#f3f3f3}",
    ".td-fb-row button.on{background:#111;color:#ffcc33;border-color:#111}",
    ".td-fb-root.td-dark .td-fb-row button.on{background:#ffcc33;color:#111;border-color:#ffcc33}",
    ".td-fb-panel label{display:block;margin:0 0 8px;font-size:12px;color:#444}",
    ".td-fb-root.td-dark .td-fb-panel label{color:#c8c8c8}",
    ".td-fb-panel input:not([type=file]),.td-fb-panel textarea{width:100%;box-sizing:border-box;border:1px solid #c8c8c8;background:#fff;color:#111;border-radius:8px;padding:8px;font:inherit;font-size:16px;margin-top:4px;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-panel input:not([type=file]),.td-fb-root.td-dark .td-fb-panel textarea{border-color:#4a4a4a;background:#111;color:#f3f3f3}",
    ".td-fb-panel textarea{min-height:5.5rem;resize:vertical}",
    ".td-fb-photos{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px}",
    ".td-fb-photos img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ccc}",
    ".td-fb-attach{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px}",
    ".td-fb-file{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;opacity:0}",
    ".td-fb-file-btn{border:1px solid #c8c8c8;background:#f3f3f3;color:#111;border-radius:8px;padding:7px 10px;cursor:pointer;font:700 13px system-ui,sans-serif;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-file-btn{border-color:#4a4a4a;background:#2a2a2a;color:#f3f3f3}",
    ".td-fb-file-status{font-size:12px;color:#444}",
    ".td-fb-root.td-dark .td-fb-file-status{color:#c8c8c8}",
    ".td-fb-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}",
    ".td-fb-actions button{border:0;border-radius:8px;padding:8px 12px;cursor:pointer;font:700 13px system-ui;touch-action:manipulation}",
    ".td-fb-send{background:#111;color:#ffcc33}",
    ".td-fb-root.td-dark .td-fb-send{background:#ffcc33;color:#111}",
    ".td-fb-cancel{background:#e8e8e8;color:#111}",
    ".td-fb-root.td-dark .td-fb-cancel{background:#2a2a2a;color:#f3f3f3}",
    ".td-fb-hp{position:absolute;left:-9999px}"
  ].join("");
  document.head.appendChild(css);
  var root = document.createElement("div");
  root.className = "td-fb-root" + (pageIsDark() ? " td-dark" : "");
  var btn = document.createElement("button");
  btn.className = "td-fb-btn";
  btn.type = "button";
  btn.textContent = t.btn;
  var panel = null;
  var kind = "idea";
  var images = [];
  function close() { if (panel) { panel.remove(); panel = null; } images = []; }
  function compress(file) {
    return new Promise(function (resolve) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) return resolve(null);
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var max = 1280;
        if (w > max || h > max) {
          var s = Math.min(max / w, max / h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }
  function open() {
    if (panel) { close(); return; }
    root.className = "td-fb-root" + (pageIsDark() ? " td-dark" : "");
    panel = document.createElement("div");
    panel.className = "td-fb-panel";
    panel.innerHTML = "<h2>" + t.btn + "</h2>"
      + '<div class="td-fb-row">'
      + '<button type="button" data-k="idea" class="on">' + t.idea + "</button>"
      + '<button type="button" data-k="bug">' + t.bug + "</button></div>"
      + "<label>" + t.title + '<input name="title" maxlength="120"></label>'
      + "<label>" + t.body + '<textarea name="body" maxlength="2000"></textarea></label>'
      + '<div class="td-fb-attach">'
      + '<input class="td-fb-file" type="file" accept="image/*" multiple tabindex="-1" aria-hidden="true">'
      + '<button type="button" class="td-fb-file-btn">' + t.photo + " (" + t.drop + ")</button>"
      + '<span class="td-fb-file-status">' + t.fileEmpty + "</span></div>"
      + '<div class="td-fb-photos"></div>'
      + '<input class="td-fb-hp" name="website" tabindex="-1" autocomplete="off">'
      + '<div class="td-fb-actions">'
      + '<button type="button" class="td-fb-cancel">' + t.close + "</button>"
      + '<button type="button" class="td-fb-send">' + t.send + "</button></div>";
    panel.querySelectorAll("[data-k]").forEach(function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-k");
        panel.querySelectorAll("[data-k]").forEach(function (x) { x.classList.toggle("on", x === b); });
      });
    });
    panel.querySelector(".td-fb-cancel").addEventListener("click", close);
    panel.querySelector(".td-fb-send").addEventListener("click", send);
    var fileInput = panel.querySelector(".td-fb-file");
    var fileStatus = panel.querySelector(".td-fb-file-status");
    function setFileStatus(n) {
      fileStatus.textContent = n <= 0 ? t.fileEmpty : n === 1 ? t.fileOne : t.fileTwo;
    }
    panel.querySelector(".td-fb-file-btn").addEventListener("click", function () {
      fileInput.click();
    });
    fileInput.addEventListener("change", function (ev) {
      var files = Array.prototype.slice.call(ev.target.files || [], 0).slice(0, 2);
      images = [];
      var box = panel.querySelector(".td-fb-photos");
      box.innerHTML = "";
      setFileStatus(files.length);
      Promise.all(files.map(compress)).then(function (rows) {
        images = rows.filter(Boolean).slice(0, 2);
        setFileStatus(images.length);
        images.forEach(function (src) {
          var im = document.createElement("img");
          im.src = src;
          im.alt = "";
          box.appendChild(im);
        });
      });
    });
    root.appendChild(panel);
  }
  function send() {
    var title = panel.querySelector("input[name=title]").value.trim();
    var body = panel.querySelector("textarea[name=body]").value.trim();
    var hp = panel.querySelector("input[name=website]").value;
    var sendBtn = panel.querySelector(".td-fb-send");
    sendBtn.disabled = true;
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: app, kind: kind, title: title, body: body, lang: L,
        pageUrl: location.href, website: hp, images: images
      })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error("fail");
        panel.innerHTML = "<p>" + t.sent + "</p>";
        setTimeout(close, 1400);
      })
      .catch(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = t.err;
      });
  }
  btn.addEventListener("click", open);
  function mount() {
    root.appendChild(btn);
    document.body.appendChild(root);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
