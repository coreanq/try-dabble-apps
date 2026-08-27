import type { Lang } from "@/lib/i18n";

/**
 * The playable engine (public/assets/index-DCoPmObG.js) paints its HUD, menu
 * and shop straight onto the canvas, and translates most of it itself. This
 * table is the safety net the pre-Vite page carried: any Korean string that
 * still reaches fillText gets swapped for the current language first, so the
 * menu, the shop and the difficulty labels read in ko / en / ja / zh.
 *
 * Ported verbatim from the inline script in the old public/index.html.
 */

type HudLang = Exclude<Lang, "ko">;

const HUD: Record<HudLang, Record<string, string>> = {
    "en": {
      "쉬움": "Easy",
      "보통": "Normal",
      "어려움": "Hard",
      "매우 어려움": "Insane",
      "매우어려움": "Insane",
      "함정 없음. 발판 넓고 가까움": "No traps. Wide, close platforms",
      "가짜·가시 발판. 표준 밸런스": "Fake/spike platforms. Standard balance",
      "함정 더 많음. 가시 빠름": "More traps. Faster spikes",
      "함정 최대. 1회 추락 = 게임오버": "Max traps. One fall = game over",
      "코인 자석": "Coin magnet",
      "코인 흡수 반경 2배": "Coin pickup radius x2",
      "코인 배수": "Coin multiplier",
      "모든 코인 획득 +50%": "All coins +50%",
      "시작 방패": "Start shield",
      "매 판 시작 시 가시 방패 1회 추가": "+1 spike shield each run",
      "높은 점프": "High jump",
      "모든 캐릭터 점프력 +8%": "All characters jump +8%",
      "코요테 연장": "Longer coyote time",
      "코요테 타임 +60%": "Coyote time +60%",
      "다크 스킨": "Dark skin",
      "모든 캐릭터 어두운 색상 해금": "Unlock dark colors for all characters",
      "여분 목숨": "Extra life",
      "이번 판 추락 1회 무효": "Ignore one fall this run",
      "슬로우 가시": "Slow spikes",
      "이번 판 가시 1.5배 느림": "Spikes 1.5x slower this run",
      "코인 더블": "Coin double",
      "이번 판 코인 2배": "Coins x2 this run",
      "시작 부스트": "Start boost",
      "첫 5블록 자동 퍼펙트": "Auto-perfect first 5 blocks",
      "시간 정지": "Time stop",
      "Space 2번 → 3초 가시 정지": "Space x2 → freeze spikes 3s",
      "전사": "Warrior",
      "균형잡힌 기본형": "Balanced starter",
      "닌자": "Ninja",
      "빠른 이동 + 더블 점프": "Fast move + double jump",
      "로봇": "Robot",
      "높은 점프 + 가시 1회 방어": "High jump + one spike guard",
      "유령": "Ghost",
      "저중력 + 가짜 발판 위를 걸음": "Low gravity + walk on fakes",
      "용사": "Hero",
      "강한 점프 + 추락 시 1회 부활": "Strong jump + one fall revive",
      "지하": "Under",
      "땅": "Ground",
      "하늘": "Sky",
      "우주": "Space",
      "난이도: ": "Difficulty: ",
      "난이도:": "Difficulty:",
      "M: 메뉴": "M: Menu",
      "SPACE: 같은 난이도 재시작": "SPACE: Restart same difficulty",
      "1/2/3/4: 난이도 변경 후 시작": "1/2/3/4: Change difficulty and start",
      "🏪 상점": "🏪 Shop",
      "보유중 ✓": "Owned ✓",
      "[장착]": "[eq]",
      "↑↓ 선택   Tab 탭전환   Enter 구매   E 장착 (일회용)   M 메뉴": "↑↓ Select   Tab switch   Enter buy   E equip (once)   M Menu",
      "자석": "Magnet",
      "코인 +": "Coin +",
      "코인 x2": "Coins x2",
      "느린 가시": "Slow spikes",
      "정지 ": "Freeze ",
      "[R] 다크 스킨 ON": "[R] Dark skin ON",
      "[R] 다크 스킨 OFF": "[R] Dark skin OFF",
      "난이도 선택 — 숫자키 1~4 · 5: 타임 어택": "Choose difficulty — keys 1-4 · 5: Time attack",
      "⏱ 타임 어택": "⏱ Time attack",
      "60초 안에 최대 점수 — 보통 난이도 고정": "Max score in 60s — Normal difficulty",
      "키보드: ←→ 이동 · SPACE 점프 · Q/E 캐릭터 · S 상점 · M 메뉴": "Keyboard: ←→ move · SPACE jump · Q/E character · S shop · M menu",
      "터치: 화면 버튼으로 조작 · 메뉴/상점은 항목 탭 · 우상단 🪙 탭하여 상점": "Touch: on-screen buttons · tap menu/shop items · tap 🪙 for shop",
      "이미 보유중": "Already owned",
      "코인 부족": "Not enough coins",
      "구매 완료!": "Purchased!",
      "보유 없음": "None owned",
      "장착됨": "Equipped",
      "장착 해제": "Unequip",
      "🛡️ 방어!": "🛡️ Guard!",
      "💚 부활!": "💚 Revive!",
      "⏱️ 시간 정지!": "⏱️ Time stop!",
      "영구 업그레이드": "Permanent upgrades",
      "일회용 (장착)": "Consumable (equip)",
      "같은 난이도 재시작": "Restart same difficulty",
      "난이도 변경 후 시작": "Change difficulty and start",
      "타임 어택": "Time attack"
    },
    "ja": {
      "쉬움": "易しい",
      "보통": "普通",
      "어려움": "難しい",
      "매우 어려움": "非常に難しい",
      "매우어려움": "非常に難しい",
      "함정 없음. 발판 넓고 가까움": "罠なし。足場は広く近い",
      "가짜·가시 발판. 표준 밸런스": "偽物・トゲ足場。標準バランス",
      "함정 더 많음. 가시 빠름": "罠が多い。トゲが速い",
      "함정 최대. 1회 추락 = 게임오버": "罠最大。1回落下でゲームオーバー",
      "코인 자석": "コインマグネット",
      "코인 흡수 반경 2배": "コイン吸収半径x2",
      "코인 배수": "コイン倍率",
      "모든 코인 획득 +50%": "全コイン+50%",
      "시작 방패": "開始シールド",
      "매 판 시작 시 가시 방패 1회 추가": "毎ゲーム開始時にトゲシールド1回",
      "높은 점프": "ハイジャンプ",
      "모든 캐릭터 점프력 +8%": "全キャラジャンプ+8%",
      "코요테 연장": "コヨーテ延長",
      "코요테 타임 +60%": "コヨーテタイム+60%",
      "다크 스킨": "ダークスキン",
      "모든 캐릭터 어두운 색상 해금": "全キャラの暗い色を解除",
      "여분 목숨": "残機",
      "이번 판 추락 1회 무효": "今回の落下1回を無効",
      "슬로우 가시": "スロートゲ",
      "이번 판 가시 1.5배 느림": "今回トゲが1.5倍遅い",
      "코인 더블": "コイン2倍",
      "이번 판 코인 2배": "今回コインx2",
      "시작 부스트": "スタートブースト",
      "첫 5블록 자동 퍼펙트": "最初の5ブロックを自動パーフェクト",
      "시간 정지": "タイムストップ",
      "Space 2번 → 3초 가시 정지": "Space2回でトゲ3秒停止",
      "전사": "戦士",
      "균형잡힌 기본형": "バランス型",
      "닌자": "忍者",
      "빠른 이동 + 더블 점프": "速い移動+二段ジャンプ",
      "로봇": "ロボット",
      "높은 점프 + 가시 1회 방어": "高いジャンプ+トゲ1回防御",
      "유령": "ゴースト",
      "저중력 + 가짜 발판 위를 걸음": "低重力+偽物足場を歩ける",
      "용사": "勇者",
      "강한 점프 + 추락 시 1회 부활": "強いジャンプ+落下1回復活",
      "지하": "地下",
      "땅": "地上",
      "하늘": "空",
      "우주": "宇宙",
      "난이도: ": "難易度: ",
      "난이도:": "難易度:",
      "M: 메뉴": "M: メニュー",
      "SPACE: 같은 난이도 재시작": "SPACE: 同じ難易度で再開",
      "1/2/3/4: 난이도 변경 후 시작": "1/2/3/4: 難易度を変えて開始",
      "🏪 상점": "🏪 ショップ",
      "보유중 ✓": "所持済 ✓",
      "[장착]": "[装備]",
      "↑↓ 선택   Tab 탭전환   Enter 구매   E 장착 (일회용)   M 메뉴": "↑↓ 選択   Tab切替   Enter購入   E装備(使い切り)   M メニュー",
      "자석": "磁石",
      "코인 +": "コイン+",
      "코인 x2": "コインx2",
      "느린 가시": "遅いトゲ",
      "정지 ": "停止 ",
      "[R] 다크 스킨 ON": "[R] ダークスキン ON",
      "[R] 다크 스킨 OFF": "[R] ダークスキン OFF",
      "난이도 선택 — 숫자키 1~4 · 5: 타임 어택": "難易度選択 — 数字キー1〜4 · 5: タイムアタック",
      "⏱ 타임 어택": "⏱ タイムアタック",
      "60초 안에 최대 점수 — 보통 난이도 고정": "60秒で最大得点 — 普通難易度固定",
      "키보드: ←→ 이동 · SPACE 점프 · Q/E 캐릭터 · S 상점 · M 메뉴": "キーボード: ←→移動 · SPACEジャンプ · Q/Eキャラ · Sショップ · Mメニュー",
      "터치: 화면 버튼으로 조작 · 메뉴/상점은 항목 탭 · 우상단 🪙 탭하여 상점": "タッチ: 画面ボタン操作 · メニュー/ショップは項目タップ · 右上🪙でショップ",
      "이미 보유중": "すでに所持",
      "코인 부족": "コイン不足",
      "구매 완료!": "購入完了!",
      "보유 없음": "未所持",
      "장착됨": "装備中",
      "장착 해제": "装備解除",
      "🛡️ 방어!": "🛡️ 防御!",
      "💚 부활!": "💚 復活!",
      "⏱️ 시간 정지!": "⏱️ タイムストップ!",
      "영구 업그레이드": "永久アップグレード",
      "일회용 (장착)": "使い切り (装備)",
      "같은 난이도 재시작": "同じ難易度で再開",
      "난이도 변경 후 시작": "難易度を変えて開始",
      "타임 어택": "タイムアタック"
    },
    "zh": {
      "쉬움": "简单",
      "보통": "普通",
      "어려움": "困难",
      "매우 어려움": "极难",
      "매우어려움": "极难",
      "함정 없음. 발판 넓고 가까움": "无陷阱。踏板宽且近",
      "가짜·가시 발판. 표준 밸런스": "假踏板与尖刺。标准平衡",
      "함정 더 많음. 가시 빠름": "陷阱更多。尖刺更快",
      "함정 최대. 1회 추락 = 게임오버": "陷阱最多。掉落一次即结束",
      "코인 자석": "金币磁铁",
      "코인 흡수 반경 2배": "金币吸附半径x2",
      "코인 배수": "金币倍率",
      "모든 코인 획득 +50%": "所有金币+50%",
      "시작 방패": "开局护盾",
      "매 판 시작 시 가시 방패 1회 추가": "每局开始获得1次尖刺护盾",
      "높은 점프": "高跳",
      "모든 캐릭터 점프력 +8%": "全角色跳跃+8%",
      "코요테 연장": "延长土狼时",
      "코요테 타임 +60%": "土狼时间+60%",
      "다크 스킨": "暗色皮肤",
      "모든 캐릭터 어두운 색상 해금": "解锁全角色暗色外观",
      "여분 목숨": "额外生命",
      "이번 판 추락 1회 무효": "本局忽略一次坠落",
      "슬로우 가시": "减速尖刺",
      "이번 판 가시 1.5배 느림": "本局尖刺慢1.5倍",
      "코인 더블": "金币翻倍",
      "이번 판 코인 2배": "本局金币x2",
      "시작 부스트": "开局加速",
      "첫 5블록 자동 퍼펙트": "前5块自动完美",
      "시간 정지": "时间静止",
      "Space 2번 → 3초 가시 정지": "连按空格两次，尖刺静止3秒",
      "전사": "战士",
      "균형잡힌 기본형": "均衡基础型",
      "닌자": "忍者",
      "빠른 이동 + 더블 점프": "快速移动+二段跳",
      "로봇": "机器人",
      "높은 점프 + 가시 1회 방어": "高跳+一次尖刺防御",
      "유령": "幽灵",
      "저중력 + 가짜 발판 위를 걸음": "低重力+可走假踏板",
      "용사": "勇者",
      "강한 점프 + 추락 시 1회 부활": "强力跳跃+坠落复活一次",
      "지하": "地下",
      "땅": "地面",
      "하늘": "天空",
      "우주": "宇宙",
      "난이도: ": "难度: ",
      "난이도:": "难度:",
      "M: 메뉴": "M: 菜单",
      "SPACE: 같은 난이도 재시작": "SPACE: 以相同难度重开",
      "1/2/3/4: 난이도 변경 후 시작": "1/2/3/4: 改难度后开始",
      "🏪 상점": "🏪 商店",
      "보유중 ✓": "已拥有 ✓",
      "[장착]": "[已装备]",
      "↑↓ 선택   Tab 탭전환   Enter 구매   E 장착 (일회용)   M 메뉴": "↑↓ 选择   Tab切换   Enter购买   E装备(一次性)   M 菜单",
      "자석": "磁铁",
      "코인 +": "金币+",
      "코인 x2": "金币x2",
      "느린 가시": "慢速尖刺",
      "정지 ": "静止 ",
      "[R] 다크 스킨 ON": "[R] 暗色皮肤 开",
      "[R] 다크 스킨 OFF": "[R] 暗色皮肤 关",
      "난이도 선택 — 숫자키 1~4 · 5: 타임 어택": "选择难度 — 数字键1-4 · 5: 限时挑战",
      "⏱ 타임 어택": "⏱ 限时挑战",
      "60초 안에 최대 점수 — 보통 난이도 고정": "60秒内冲高分 — 固定普通难度",
      "키보드: ←→ 이동 · SPACE 점프 · Q/E 캐릭터 · S 상점 · M 메뉴": "键盘: ←→移动 · 空格跳跃 · Q/E角色 · S商店 · M菜单",
      "터치: 화면 버튼으로 조작 · 메뉴/상점은 항목 탭 · 우상단 🪙 탭하여 상점": "触控: 屏幕按钮 · 点选菜单/商店项 · 右上🪙打开商店",
      "이미 보유중": "已拥有",
      "코인 부족": "金币不足",
      "구매 완료!": "购买完成!",
      "보유 없음": "未拥有",
      "장착됨": "已装备",
      "장착 해제": "卸下",
      "🛡️ 방어!": "🛡️ 防御!",
      "💚 부활!": "💚 复活!",
      "⏱️ 시간 정지!": "⏱️ 时间静止!",
      "영구 업그레이드": "永久升级",
      "일회용 (장착)": "一次性 (装备)",
      "같은 난이도 재시작": "以相同难度重开",
      "난이도 변경 후 시작": "改难度后开始",
      "타임 어택": "限时挑战"
    }
  };

const HAS_HANGUL = /[\uac00-\ud7a3]/;

let hudLang: HudLang | null = null;
let hudKeys: string[] = [];
let patched = false;

function translateHud(text: string): string {
  if (!hudLang || !HAS_HANGUL.test(text)) return text;
  const dict = HUD[hudLang];
  const exact = dict[text];
  if (exact) return exact;
  // Longest key first, so "매우 어려움" never gets eaten by "어려움".
  let out = text;
  for (const key of hudKeys) {
    if (out.includes(key)) out = out.split(key).join(dict[key]);
  }
  return out;
}

/**
 * Patch once, before the engine module is injected: the engine holds no
 * reference we could re-render through, so the canvas text API is the only
 * seam. fillText keeps its arity — some HUD calls pass maxWidth.
 */
function patchFillText(): void {
  if (patched) return;
  patched = true;
  const proto = CanvasRenderingContext2D.prototype;
  const original = proto.fillText;
  proto.fillText = function fillText(
    this: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
  ) {
    const out = typeof text === "string" ? translateHud(text) : text;
    if (maxWidth === undefined) return original.call(this, out, x, y);
    return original.call(this, out, x, y, maxWidth);
  };
}

export function setHudLang(lang: Lang): void {
  patchFillText();
  if (lang === "ko") {
    hudLang = null;
    hudKeys = [];
    return;
  }
  hudLang = lang;
  hudKeys = Object.keys(HUD[lang]).sort((a, b) => b.length - a.length);
}
