import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 8791;
const ORIGIN = `http://127.0.0.1:${PORT}`;

const EXPECT = {
  ko: {
    title: "믹선반",
    local: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    locale: "ko_KR",
    image: "og-image.png",
  },
  en: {
    title: "Mixshelf",
    local: "Your data stays on this device. Nothing is sent to our servers.",
    locale: "en_US",
    image: "og-image-en.png",
  },
  ja: {
    title: "ミックス棚",
    local: "データはこの端末にだけ保存されます。サーバーには送りません。",
    locale: "ja_JP",
    image: "og-image-ja.png",
  },
  zh: {
    title: "混架",
    local: "数据仅保存在此设备，不会上传到服务器。",
    locale: "zh_CN",
    image: "og-image-zh.png",
  },
};

let child;

test.before(async () => {
  child = spawn(
    "npx",
    ["wrangler", "dev", "--port", String(PORT), "--ip", "127.0.0.1"],
    {
      cwd: new URL("..", import.meta.url).pathname,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    },
  );
  let ready = false;
  const onData = (buf) => {
    const s = buf.toString();
    if (s.includes("Ready") || s.includes("localhost") || s.includes(String(PORT))) {
      ready = true;
    }
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  for (let i = 0; i < 60 && !ready; i++) await sleep(500);
  // even if banner missed, try a fetch
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${ORIGIN}/?lang=en`);
      if (r.ok) break;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
});

test.after(async () => {
  if (child && !child.killed) {
    child.kill("SIGTERM");
    await once(child, "exit").catch(() => {});
  }
});

for (const lang of Object.keys(EXPECT)) {
  test(`first HTML ?lang=${lang}`, async () => {
    const res = await fetch(`${ORIGIN}/?lang=${lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const exp = EXPECT[lang];
    assert.match(html, new RegExp(`<html[^>]*lang="${lang}"`));
    assert.match(html, new RegExp(`<title>${exp.title}</title>`));
    assert.match(html, new RegExp(`id="local-only"[^>]*>${exp.local}<`));
    assert.match(html, new RegExp(`id="brand-title">${exp.title}<`));
    assert.match(html, new RegExp(`application-name" content="${exp.title}"`));
    assert.match(html, new RegExp(`og:locale" content="${exp.locale}"`));
    assert.match(html, new RegExp(`og:image" content="https://mixshelf\\.try-dabble\\.com/${exp.image}"`));
    assert.match(html, /data-app="mixshelf"/);
    assert.match(html, /ca-pub-1343411537040925/);
    if (lang === "zh") {
      assert.doesNotMatch(html, /og-image-en\.png/);
    }
  });
}

test("ads.txt", async () => {
  const res = await fetch(`${ORIGIN}/ads.txt`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /text\/plain/);
  const body = await res.text();
  assert.match(body, /pub-1343411537040925/);
});
