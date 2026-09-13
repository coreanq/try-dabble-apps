import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDictionary,
  buildRestoreMap,
  cleanWords,
  detect,
  luhn,
  parseDictionary,
  parseRestoreMap,
  restore,
  scrub,
} from "../src/lib/scrub.ts";

const SAMPLE =
  "Hi, I'm Ada Lovelace. Email ada@example.com, phone +1 202-555-0147, card 4111 1111 1111 1111, IP 8.8.8.8, key sk-abcDEF1234567890xyz.";

function types(text, words = []) {
  return detect(text, words).map((s) => [s.type, s.original]);
}

test("the reviewer sample finds every entity type once", () => {
  const found = types(SAMPLE);
  assert.deepEqual(found, [
    ["NAME", "Ada Lovelace"],
    ["EMAIL", "ada@example.com"],
    ["PHONE", "+1 202-555-0147"],
    ["CARD", "4111 1111 1111 1111"],
    ["IP", "8.8.8.8"],
    ["KEY", "sk-abcDEF1234567890xyz"],
  ]);
});

test("email: standard forms, case-insensitive identity", () => {
  assert.deepEqual(types("mail First.Last+tag@sub.example.co.uk now"), [["EMAIL", "First.Last+tag@sub.example.co.uk"]]);
  const r = scrub("A@X.com and a@x.com");
  assert.equal(r.entities.length, 1);
  assert.equal(r.scrubbed, "[EMAIL_1] and [EMAIL_1]");
});

test("phone: international, US, KR, IT, JP, CN forms", () => {
  for (const p of ["+1 202-555-0147", "(202) 555-0147", "202-555-0147", "010-1234-5678", "01012345678", "+82 10-1234-5678", "+39 06 1234 5678", "345 123 4567", "090-1234-5678", "03-1234-5678", "138 0013 8000", "13800138000", "+86 138 0013 8000"]) {
    const found = types(`call ${p} today`);
    assert.deepEqual(found, [["PHONE", p]], p);
  }
  assert.deepEqual(types("order 12345 and year 2026"), []);
  const r = scrub("+1 202-555-0147 or (202) 555-0147");
  assert.equal(r.entities.length, 2, "with and without +cc are different normalized numbers");
});

test("card: Luhn-valid groups only, short numbers untouched", () => {
  assert.equal(luhn("4111111111111111"), true);
  assert.equal(luhn("4111111111111112"), false);
  assert.deepEqual(types("card 4111 1111 1111 1111 ok"), [["CARD", "4111 1111 1111 1111"]]);
  assert.deepEqual(types("card 4111-1111-1111-1111 ok"), [["CARD", "4111-1111-1111-1111"]]);
  assert.deepEqual(types("card 5500000000000004"), [["CARD", "5500000000000004"]]);
  assert.deepEqual(types("card 378282246310005"), [["CARD", "378282246310005"]]);
  assert.deepEqual(types("random 1234567890123456"), []);
  assert.deepEqual(types("ticket 1234 5678"), []);
  const r = scrub("4111 1111 1111 1111 and 4111-1111-1111-1111");
  assert.equal(r.entities.length, 1);
  assert.equal(r.scrubbed, "[CARD_1] and [CARD_1]");
});

test("ip: IPv4 dotted and simple IPv6, not versions or times", () => {
  assert.deepEqual(types("from 192.168.0.1 to 8.8.8.8"), [["IP", "192.168.0.1"], ["IP", "8.8.8.8"]]);
  assert.deepEqual(types("v 1.2.3.4.5"), []);
  assert.deepEqual(types("host 2001:db8::1 and fe80::1ff:fe23:4567:890a"), [["IP", "2001:db8::1"], ["IP", "fe80::1ff:fe23:4567:890a"]]);
  assert.deepEqual(types("at 12:30:45 today"), []);
  assert.deepEqual(types("::1 local"), [["IP", "::1"]]);
});

test("keys: OpenAI, AWS, GitHub, Slack, Google, JWT, Bearer, labelled secrets", () => {
  assert.deepEqual(types("k sk-abcDEF1234567890xyz."), [["KEY", "sk-abcDEF1234567890xyz"]]);
  assert.deepEqual(types("k sk-proj-abcDEF1234567890xyzABC"), [["KEY", "sk-proj-abcDEF1234567890xyzABC"]]);
  assert.deepEqual(types("aws AKIAIOSFODNN7EXAMPLE"), [["KEY", "AKIAIOSFODNN7EXAMPLE"]]);
  assert.deepEqual(types("gh ghp_abcdefghijklmnopqrstuvwxyz0123456789"), [["KEY", "ghp_abcdefghijklmnopqrstuvwxyz0123456789"]]);
  assert.deepEqual(types("gh github_pat_11ABCDEFG0123456789_abcdefghijklmnop"), [["KEY", "github_pat_11ABCDEFG0123456789_abcdefghijklmnop"]]);
  assert.deepEqual(types("slack xoxb-1234567890-abcdefghij"), [["KEY", "xoxb-1234567890-abcdefghij"]]);
  assert.deepEqual(types("g AIzaSyA1234567890abcdefghijklmnopqrstuv"), [["KEY", "AIzaSyA1234567890abcdefghijklmnopqrstuv"]]);
  const bearer = types("Authorization: Bearer abcdefghij1234567890.xyz-ABC");
  assert.deepEqual(bearer, [["KEY", "abcdefghij1234567890.xyz-ABC"]]);
  assert.equal(scrub("Authorization: Bearer abcdefghij1234567890.xyz-ABC").scrubbed, "Authorization: Bearer [KEY_1]");
  assert.deepEqual(types('api_key = "Zm9vYmFyYmF6cXV4MTIzNDU2"'), [["KEY", "Zm9vYmFyYmF6cXV4MTIzNDU2"]]);
  assert.deepEqual(types("secret: 0123456789abcdef0123456789abcdef"), [["KEY", "0123456789abcdef0123456789abcdef"]]);
  assert.deepEqual(types("jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"), [["KEY", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"]]);
  assert.deepEqual(types("the key is short"), []);
});

test("address: street + number, Via Roma, Korean, Japanese, Chinese, postcodes", () => {
  assert.deepEqual(types("lives at 123 Main St now"), [["ADDRESS", "123 Main St"]]);
  assert.deepEqual(types("ship to 1600 Pennsylvania Avenue NW, Suite 200"), [["ADDRESS", "1600 Pennsylvania Avenue NW, Suite 200"]]);
  assert.deepEqual(types("abito in Via Roma 12, Milano"), [["ADDRESS", "Via Roma 12"]]);
  assert.deepEqual(types("Piazza del Duomo 3"), [["ADDRESS", "Piazza del Duomo 3"]]);
  assert.deepEqual(types("주소: 서울 강남구 테헤란로 152 입니다"), [["ADDRESS", "서울 강남구 테헤란로 152"]]);
  assert.deepEqual(types("경기도 성남시 분당구 판교역로 235"), [["ADDRESS", "경기도 성남시 분당구 판교역로 235"]]);
  assert.deepEqual(types("住所は東京都渋谷区神宮前1-2-3です"), [["ADDRESS", "東京都渋谷区神宮前1-2-3"]]);
  assert.deepEqual(types("〒150-0001"), [["ADDRESS", "〒150-0001"]]);
  assert.deepEqual(types("地址：上海市浦东新区世纪大道100号"), [["ADDRESS", "上海市浦东新区世纪大道100号"]]);
  assert.deepEqual(types("zip is CA 90210"), [["ADDRESS", "CA 90210"]]);
  assert.deepEqual(types("at 123 Main St., Apt 4B"), [["ADDRESS", "123 Main St., Apt 4B"]]);
  assert.deepEqual(types("London SW1A 1AA"), [["ADDRESS", "SW1A 1AA"]]);
  assert.deepEqual(types("우편번호 06236"), [["ADDRESS", "우편번호 06236"]]);
});

test("names: EN First Last / Title First Last, KO, JA, ZH, stopwords skipped", () => {
  assert.deepEqual(types("Hi, I'm Ada Lovelace."), [["NAME", "Ada Lovelace"]]);
  assert.deepEqual(types("Dear Dr. Ada Lovelace, thanks"), [["NAME", "Ada Lovelace"]]);
  assert.deepEqual(types("Mr Babbage called"), [["NAME", "Babbage"]]);
  assert.deepEqual(types("Ada Lovelace Email is here"), [["NAME", "Ada Lovelace"]]);
  assert.deepEqual(types("Ada Lovelace Charles Babbage met"), [["NAME", "Ada Lovelace"], ["NAME", "Charles Babbage"]]);
  assert.deepEqual(types("Mary Ann Evans wrote"), [["NAME", "Mary Ann Evans"]]);
  assert.deepEqual(types("The Monday meeting. This Week ChatGPT And Claude. HTTP JSON."), []);
  assert.deepEqual(types("Thanks Ada"), []);
  assert.deepEqual(types("김민수님 안녕하세요"), [["NAME", "김민수"]]);
  assert.deepEqual(types("김민수는 오늘"), [["NAME", "김민수"]]);
  assert.deepEqual(types("이 씨와 박 대리님"), [["NAME", "이"], ["NAME", "박"]]);
  assert.deepEqual(types("이메일을 보냈고 이번에 정보를 확인"), []);
  assert.deepEqual(types("田中太郎さんと佐藤様"), [["NAME", "田中太郎"], ["NAME", "佐藤"]]);
  assert.deepEqual(types("スミスさんが来た"), [["NAME", "スミス"]]);
  assert.deepEqual(types("私は山田花子です"), [["NAME", "山田花子"]]);
  assert.deepEqual(types("王伟先生和小李"), [["NAME", "王伟"], ["NAME", "小李"]]);
  assert.deepEqual(types("我叫张伟，你好"), [["NAME", "张伟"]]);
  assert.deepEqual(types("今天天气很好"), []);
});

test("stable tokens: same entity (normalized) gets the same token, numbering per type from 1", () => {
  const r = scrub("Ada Lovelace met Ada Lovelace and Ada  Lovelace. Charles Babbage too. ada@example.com ADA@EXAMPLE.COM");
  const names = r.entities.filter((e) => e.type === "NAME");
  assert.equal(names.length, 2);
  assert.equal(names[0].token, "[NAME_1]");
  assert.equal(names[0].count, 3);
  assert.equal(names[1].token, "[NAME_2]");
  assert.equal(r.entities.find((e) => e.type === "EMAIL").token, "[EMAIL_1]");
  assert.equal(r.scrubbed, "[NAME_1] met [NAME_1] and [NAME_1]. [NAME_2] too. [EMAIL_1] [EMAIL_1]");
  assert.equal(scrub("Ada Lovelace, ada lovelace").entities.length, 1, "lowercase spelling is not a heuristic hit but never breaks the pass");
});

test("uncheck keeps the original and the other tokens do not renumber", () => {
  const all = scrub(SAMPLE);
  const phone = all.entities.find((e) => e.type === "PHONE");
  const r = scrub(SAMPLE, { disabled: [phone.key] });
  assert.match(r.scrubbed, /phone \+1 202-555-0147,/);
  assert.match(r.scrubbed, /\[NAME_1\]/);
  assert.match(r.scrubbed, /\[EMAIL_1\]/);
  assert.match(r.scrubbed, /\[CARD_1\]/);
  assert.match(r.scrubbed, /\[IP_1\]/);
  assert.match(r.scrubbed, /\[KEY_1\]/);
  assert.equal(r.map["[PHONE_1]"], undefined);
  assert.equal(r.entities.length, 6, "the unchecked row is still listed");
  assert.equal(r.entities.find((e) => e.type === "PHONE").token, "[PHONE_1]");
});

test("custom words: case-insensitive whole word, unicode, become [WORD_n], beat heuristic names", () => {
  const r = scrub("Project Phoenix is go. PROJECT PHOENIX. projectphoenix. 피닉스 계획", { customWords: ["Project Phoenix", "피닉스"] });
  assert.equal(r.scrubbed, "[WORD_1] is go. [WORD_1]. projectphoenix. [WORD_2] 계획");
  assert.deepEqual(r.entities.map((e) => e.type), ["WORD", "WORD"]);
  assert.deepEqual(cleanWords([" Ada ", "ada", "", "Bob"]), ["Ada", "Bob"]);
  assert.equal(scrub("Ada Lovelace Ltd", { customWords: ["Lovelace"] }).scrubbed, "Ada [WORD_1] Ltd");
});

test("overlaps: longest match wins, tokens are never re-scrubbed", () => {
  const r = scrub("Contact John Smith at john.smith@example.com or 123 Main St.");
  assert.equal(r.scrubbed, "Contact [NAME_1] at [EMAIL_1] or [ADDRESS_1].");
  const again = scrub(r.scrubbed);
  assert.equal(again.scrubbed, r.scrubbed);
  assert.equal(again.entities.length, 0);
});

test("restore map round-trips and the JSON shape is stable", () => {
  const r = scrub(SAMPLE);
  const file = buildRestoreMap(r.map, new Date("2026-09-14T00:00:00Z"));
  assert.equal(file.app, "scrubpad");
  assert.equal(file.version, 1);
  assert.equal(file.exportedAt, "2026-09-14T00:00:00.000Z");
  assert.equal(file.map["[NAME_1]"], "Ada Lovelace");
  assert.equal(file.map["[KEY_1]"], "sk-abcDEF1234567890xyz");
  assert.equal(restore(r.scrubbed, parseRestoreMap(JSON.parse(JSON.stringify(file)))), SAMPLE);
  assert.equal(restore("[NAME_10] and [NAME_1]", { "[NAME_1]": "A", "[NAME_10]": "B" }), "B and A");
  assert.equal(parseRestoreMap({ nope: 1 }), null);
});

test("dictionary JSON import / export accepts the object shape and a bare array", () => {
  const file = buildDictionary(["Project Phoenix", "Acme", "acme"]);
  assert.deepEqual(file, { app: "scrubpad", version: 1, words: ["Project Phoenix", "Acme"] });
  assert.deepEqual(parseDictionary(JSON.parse(JSON.stringify(file))), ["Project Phoenix", "Acme"]);
  assert.deepEqual(parseDictionary({ words: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(parseDictionary(["x", "y", "x"]), ["x", "y"]);
  assert.equal(parseDictionary({ words: [1, 2] }), null);
  assert.equal(parseDictionary("nope"), null);
});

test("empty and plain text pass through untouched", () => {
  assert.equal(scrub("").scrubbed, "");
  assert.deepEqual(scrub("").entities, []);
  const plain = "please summarize this paragraph about the weather on monday.";
  assert.equal(scrub(plain).scrubbed, plain);
});
