/**
 * The free core library. Every pose is a name, tips, a hand-position chip,
 * Voice Coach steps (all four languages) and a 17-point MoveNet skeleton
 * normalized to a 0–1 portrait frame. Skeletons are built from joint angles
 * (see figure()) so the ghost overlay and the Match score share one source.
 *
 * Nothing here is locked: no premium flag exists on purpose (Photogenik
 * capped the free tier at two poses; this library does not have a cap).
 */
import { I18N, type Lang, type MsgKey } from "./i18n.ts";

export type L = Record<Lang, string>;
export type Category = "solo" | "couple" | "travel" | "grad" | "casual" | "formal";
export const CATEGORIES: Category[] = ["solo", "couple", "travel", "grad", "casual", "formal"];
export type Gender = "female" | "male" | "any";
export type Difficulty = "easy" | "medium" | "hard";

export const KEYPOINT_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;
export type KeypointName = (typeof KEYPOINT_NAMES)[number];

export interface Keypoint {
  name: KeypointName;
  x: number;
  y: number;
}

export interface Pose {
  id: string;
  name: L;
  category: Category;
  gender: Gender;
  adaptive?: boolean;
  seated?: boolean;
  difficulty: Difficulty;
  tips: L[];
  handTip: L;
  voiceSteps: L[];
  keypoints: Keypoint[];
}

/** Bone list for drawing the ghost: pairs of keypoint names. */
export const BONES: [KeypointName, KeypointName][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

function L(ko: string, en: string, ja: string, zh: string): L {
  return { ko, en, ja, zh };
}

/* ------------------------------------------------------------------ */
/* Figure builder: joint angles → normalized keypoints                  */
/* ------------------------------------------------------------------ */

/** Degrees from straight down. Positive swings the segment outward (away
 *  from the body's centre line); past 180 it comes back over the head. */
export interface Limb {
  upper: number;
  lower: number;
}

export interface FigureSpec {
  leftArm: Limb;
  rightArm: Limb;
  leftLeg?: Limb;
  rightLeg?: Limb;
  /** Front-view seated: knees come toward the camera, feet drop below. */
  seated?: boolean;
  /** Shoulder centre offset from the hip centre (x, fraction of frame). */
  lean?: number;
  /** Nose offset from the neck (x): a turned head, a look over the shoulder. */
  head?: number;
  /** Extra hip drop on one side for a weight shift (x, fraction). */
  hipShift?: number;
}

const HIP = { x: 0.5, y: 0.56 };
const TORSO = 0.2;
const SHOULDER_HALF = 0.085;
const HIP_HALF = 0.06;
const UPPER_ARM = 0.13;
const FOREARM = 0.12;
const THIGH = 0.17;
const SHIN = 0.17;
const STAND_LEG: Limb = { upper: 4, lower: 2 };

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function seg(from: { x: number; y: number }, len: number, deg: number, side: 1 | -1) {
  return { x: from.x + side * len * Math.sin(rad(deg)), y: from.y + len * Math.cos(rad(deg)) };
}

/**
 * Subject faces the camera in an un-mirrored frame, so the subject's LEFT
 * side is on the image RIGHT (larger x). The overlay container is mirrored
 * together with the front camera, and Match tries both orientations, so this
 * convention never leaks into the UI.
 */
export function figure(spec: FigureSpec): Keypoint[] {
  const lean = spec.lean ?? 0;
  const head = spec.head ?? 0;
  const hipShift = spec.hipShift ?? 0;
  const neck = { x: HIP.x + lean, y: HIP.y - TORSO };
  const nose = { x: neck.x + head, y: neck.y - 0.075 };

  const pts: Record<KeypointName, { x: number; y: number }> = {
    nose,
    left_eye: { x: nose.x + 0.022, y: nose.y - 0.02 },
    right_eye: { x: nose.x - 0.022, y: nose.y - 0.02 },
    left_ear: { x: nose.x + 0.045, y: nose.y - 0.012 },
    right_ear: { x: nose.x - 0.045, y: nose.y - 0.012 },
    left_shoulder: { x: neck.x + SHOULDER_HALF, y: neck.y },
    right_shoulder: { x: neck.x - SHOULDER_HALF, y: neck.y },
    left_hip: { x: HIP.x + HIP_HALF + hipShift, y: HIP.y + (hipShift > 0 ? -0.012 : 0) },
    right_hip: { x: HIP.x - HIP_HALF + hipShift, y: HIP.y + (hipShift < 0 ? -0.012 : 0) },
  } as Record<KeypointName, { x: number; y: number }>;

  const arm = (side: 1 | -1, limb: Limb) => {
    const sh = side === 1 ? pts.left_shoulder : pts.right_shoulder;
    const el = seg(sh, UPPER_ARM, limb.upper, side);
    const wr = seg(el, FOREARM, limb.lower, side);
    return { el, wr };
  };
  const la = arm(1, spec.leftArm);
  const ra = arm(-1, spec.rightArm);
  pts.left_elbow = la.el;
  pts.left_wrist = la.wr;
  pts.right_elbow = ra.el;
  pts.right_wrist = ra.wr;

  const leg = (side: 1 | -1, limb: Limb) => {
    const hip = side === 1 ? pts.left_hip : pts.right_hip;
    if (spec.seated) {
      const kn = { x: hip.x + side * 0.03, y: hip.y + 0.1 };
      const an = { x: kn.x + side * 0.01, y: kn.y + 0.17 };
      return { kn, an };
    }
    const kn = seg(hip, THIGH, limb.upper, side);
    const an = seg(kn, SHIN, limb.lower, side);
    return { kn, an };
  };
  const ll = leg(1, spec.leftLeg ?? STAND_LEG);
  const rl = leg(-1, spec.rightLeg ?? STAND_LEG);
  pts.left_knee = ll.kn;
  pts.left_ankle = ll.an;
  pts.right_knee = rl.kn;
  pts.right_ankle = rl.an;

  // Fit the whole figure into the portrait frame: head near the top, feet
  // near the bottom, centred horizontally, keeping proportions.
  const all = Object.values(pts);
  const minY = Math.min(...all.map((p) => p.y)) - 0.05;
  const maxY = Math.max(...all.map((p) => p.y)) + 0.02;
  const scale = 0.8 / (maxY - minY);
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const cx = (minX + maxX) / 2;

  return KEYPOINT_NAMES.map((name) => {
    const p = pts[name];
    return {
      name,
      x: Math.round((0.5 + (p.x - cx) * scale) * 1000) / 1000,
      y: Math.round((0.1 + (p.y - minY) * scale) * 1000) / 1000,
    };
  });
}

/* Shared limb shapes. */
const HANG: Limb = { upper: 6, lower: 4 };
const ON_HIP: Limb = { upper: 42, lower: -115 };
const POCKET: Limb = { upper: 12, lower: -38 };
const CROSSED: Limb = { upper: 22, lower: -100 };
const CHEST: Limb = { upper: 26, lower: -100 };
const UP: Limb = { upper: 168, lower: 172 };
const WAVE: Limb = { upper: 155, lower: 198 };
const POINT: Limb = { upper: 92, lower: 92 };
const WIDE: Limb = { upper: 128, lower: 134 };
const HAIR: Limb = { upper: 62, lower: -158 };
const REACH: Limb = { upper: 48, lower: 46 };
const FORWARD: Limb = { upper: 30, lower: -62 };
const CLASP: Limb = { upper: 16, lower: -78 };
const APART: Limb = { upper: 16, lower: 14 };
const CROSS_LEG: Limb = { upper: -12, lower: -20 };
const STEP: Limb = { upper: 14, lower: -4 };

/* ------------------------------------------------------------------ */
/* The library                                                          */
/* ------------------------------------------------------------------ */

export const POSES: Pose[] = [
  {
    id: "hand-on-hip",
    name: L("한 손 허리", "Hand on hip", "片手を腰に", "单手叉腰"),
    category: "solo",
    gender: "female",
    difficulty: "easy",
    tips: [
      L("한쪽 다리에 무게를 싣고 반대쪽 무릎을 살짝 굽히세요.", "Put your weight on one leg and soften the other knee.", "片方の脚に体重をかけ、反対の膝を少しゆるめます。", "重心放在一条腿上，另一条腿膝盖微屈。"),
      L("턱을 조금 내리고 카메라 위쪽을 보세요.", "Drop your chin slightly and look just above the lens.", "あごを少し引いて、レンズの少し上を見ます。", "下巴略收，看向镜头上方一点。"),
    ],
    handTip: L("손등이 아니라 손가락을 허리뼈에 올려 두세요.", "Rest fingertips, not the back of your hand, on the hip bone.", "手の甲ではなく指先を腰骨に添えます。", "把指尖而不是手背放在髋骨上。"),
    voiceSteps: [
      L("한 손을 허리에 올리세요.", "Put one hand on your hip.", "片手を腰に当てます。", "一只手放在腰上。"),
      L("팔꿈치를 옆으로 밀어 삼각형을 만드세요.", "Push the elbow out to make a triangle.", "ひじを横に出して三角形を作ります。", "手肘向外推，形成三角形。"),
      L("반대쪽 어깨를 조금 내리고 미소.", "Drop the other shoulder a touch and smile.", "反対の肩を少し下げて、笑顔。", "另一侧肩膀略放低，微笑。"),
    ],
    keypoints: figure({ leftArm: ON_HIP, rightArm: HANG, leftLeg: STAND_LEG, rightLeg: { upper: 8, lower: 6 }, hipShift: 0.012 }),
  },
  {
    id: "hair-tuck",
    name: L("머리 넘기기", "Hair tuck", "髪をかき上げ", "撩头发"),
    category: "solo",
    gender: "female",
    difficulty: "easy",
    tips: [
      L("손을 귀 뒤에서 멈추고 손가락은 벌리세요.", "Pause the hand behind the ear with fingers relaxed.", "耳の後ろで手を止め、指はリラックス。", "手停在耳后，手指放松。"),
      L("시선은 카메라 옆이나 아래로 자연스럽게.", "Let your eyes drift beside or below the lens.", "視線はレンズの横か下に自然に。", "视线自然落在镜头旁边或下方。"),
    ],
    handTip: L("손바닥이 카메라를 보지 않게 손날을 보여 주세요.", "Show the edge of the hand, never the palm, to the camera.", "手のひらではなく手の側面をカメラに見せます。", "让手的侧面对着镜头，别露手掌。"),
    voiceSteps: [
      L("한 손을 들어 머리카락을 귀 뒤로.", "Lift one hand and tuck hair behind the ear.", "片手を上げて髪を耳にかけます。", "抬起一只手，把头发别到耳后。"),
      L("팔꿈치는 몸에서 살짝 떨어뜨리세요.", "Keep the elbow a little away from the body.", "ひじを体から少し離します。", "手肘略微离开身体。"),
      L("고개를 살짝 기울이고 부드럽게 웃으세요.", "Tilt the head a touch and soften the smile.", "頭を少し傾けて、やわらかく笑います。", "头微微倾斜，笑容放柔。"),
    ],
    keypoints: figure({ leftArm: HAIR, rightArm: HANG, head: 0.012, lean: 0.006 }),
  },
  {
    id: "over-shoulder",
    name: L("어깨 너머 시선", "Over the shoulder", "肩越しの視線", "回眸"),
    category: "solo",
    gender: "female",
    difficulty: "medium",
    tips: [
      L("몸은 카메라에서 돌리고 얼굴만 돌아보세요.", "Turn the body away and bring only the face back.", "体はカメラから外し、顔だけ振り向きます。", "身体转开，只把脸转回来。"),
      L("뒤쪽 어깨를 내리면 목선이 길어 보입니다.", "Drop the far shoulder to lengthen the neck line.", "奥の肩を下げると首筋が長く見えます。", "远端肩膀放低，脖颈线条更长。"),
    ],
    handTip: L("앞쪽 손은 허벅지 옆에 가볍게, 뒤쪽 손은 보이지 않아도 됩니다.", "Near hand rests lightly on the thigh; the far hand can hide.", "手前の手は太ももに軽く、奥の手は隠れてOK。", "近侧手轻放大腿旁，远侧手可以藏起来。"),
    voiceSteps: [
      L("카메라에 등을 반쯤 돌리세요.", "Turn half away from the camera.", "カメラに半分背を向けます。", "身体半转背对镜头。"),
      L("어깨 너머로 천천히 돌아보세요.", "Slowly look back over your shoulder.", "肩越しにゆっくり振り向きます。", "慢慢从肩膀上方回头看。"),
      L("턱을 어깨 쪽으로 조금 내리세요.", "Lower the chin toward the shoulder a little.", "あごを肩のほうに少し下げます。", "下巴朝肩膀略微下沉。"),
    ],
    keypoints: figure({ leftArm: { upper: 8, lower: 4 }, rightArm: { upper: 4, lower: 2 }, head: -0.035, lean: -0.02 }),
  },
  {
    id: "walking-candid",
    name: L("걷는 척 캔디드", "Walking candid", "歩くふり", "假装走路"),
    category: "solo",
    gender: "female",
    difficulty: "medium",
    tips: [
      L("실제로 한 걸음 내디디고 셔터 순간에 멈추지 마세요.", "Actually take a step; do not freeze at the shutter.", "実際に一歩踏み出し、シャッターの瞬間に止まらないこと。", "真的迈一步，快门时别僵住。"),
      L("팔은 자연스럽게 흔들고 시선은 옆으로.", "Swing the arms naturally and look off to the side.", "腕は自然に振り、視線は横へ。", "手臂自然摆动，视线看向一侧。"),
    ],
    handTip: L("한 손은 가방끈이나 머리, 다른 손은 흔들리게 두세요.", "One hand on a bag strap or your hair, the other swinging free.", "片手はバッグの持ち手か髪、もう片方は自然に振ります。", "一只手扶包带或头发，另一只手自然摆动。"),
    voiceSteps: [
      L("카메라를 향해 천천히 걸으세요.", "Walk slowly toward the camera.", "カメラに向かってゆっくり歩きます。", "慢慢朝镜头走。"),
      L("앞발에 무게를 옮기는 순간을 잡습니다.", "The shot is when your weight lands on the front foot.", "前足に体重が乗る瞬間を狙います。", "重心落到前脚的那一刻就是快门时机。"),
      L("시선은 옆으로, 입은 살짝 벌리세요.", "Eyes to the side, lips slightly parted.", "視線は横、口は少し開けて。", "视线看向一侧，嘴唇微张。"),
    ],
    keypoints: figure({ leftArm: { upper: 22, lower: -10 }, rightArm: { upper: -18, lower: -30 }, leftLeg: STEP, rightLeg: { upper: -10, lower: 6 }, head: 0.02 }),
  },
  {
    id: "crossed-legs-standing",
    name: L("다리 꼬고 서기", "Crossed legs standing", "脚をクロスして立つ", "站姿交叉腿"),
    category: "solo",
    gender: "female",
    difficulty: "medium",
    tips: [
      L("앞쪽 다리를 뒤쪽 다리 앞으로 교차하고 발끝을 세우세요.", "Cross the front leg over the back one and point the toe.", "前の脚を後ろの脚の前でクロスし、つま先を立てます。", "前腿交叉到后腿前面，脚尖点地。"),
      L("골반을 뒤로 빼지 말고 몸통을 세우세요.", "Keep the torso tall; do not push the hips back.", "骨盤を後ろに引かず、上体を起こします。", "上身挺直，别把胯往后推。"),
    ],
    handTip: L("양손은 허벅지 앞에서 가볍게 포개세요.", "Fold the hands lightly in front of the thighs.", "両手を太ももの前で軽く重ねます。", "双手轻轻叠放在大腿前。"),
    voiceSteps: [
      L("한쪽 다리를 다른 다리 앞으로 교차하세요.", "Cross one leg in front of the other.", "片方の脚をもう一方の前にクロスします。", "一条腿交叉到另一条腿前面。"),
      L("발끝으로 바닥을 짚으세요.", "Touch the floor with the toe of the front foot.", "前の足のつま先で床に触れます。", "前脚脚尖轻点地面。"),
      L("양손을 앞에서 모으고 어깨를 내리세요.", "Bring the hands together in front and drop the shoulders.", "両手を前で合わせ、肩を下げます。", "双手在身前合拢，肩膀放松下沉。"),
    ],
    keypoints: figure({ leftArm: CLASP, rightArm: CLASP, leftLeg: CROSS_LEG, rightLeg: { upper: 6, lower: 4 } }),
  },
  {
    id: "arms-up-stretch",
    name: L("두 팔 위로", "Arms up", "両腕を上げる", "双臂高举"),
    category: "solo",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("팔을 V자로 벌리고 손바닥은 안쪽을 향하게.", "Open the arms into a V with palms facing in.", "腕をV字に開き、手のひらは内側に。", "手臂张成 V 字，掌心朝内。"),
      L("고개를 조금 들면 목이 시원하게 보입니다.", "Lift the chin a little to open the neck.", "あごを少し上げると首がすっきり見えます。", "下巴微抬，颈部线条更舒展。"),
    ],
    handTip: L("손가락을 쫙 펴지 말고 자연스럽게 살짝 굽히세요.", "Do not splay the fingers; let them curl softly.", "指は広げすぎず、自然に軽く曲げます。", "手指别张太开，自然微曲。"),
    voiceSteps: [
      L("두 팔을 머리 위로 올리세요.", "Raise both arms over your head.", "両腕を頭の上に上げます。", "双臂举过头顶。"),
      L("팔을 V자로 넓게 벌리세요.", "Open them wide into a V.", "腕をV字に広げます。", "张开成宽宽的 V 字。"),
      L("숨을 들이쉬고 가슴을 펴세요.", "Breathe in and open the chest.", "息を吸って胸を開きます。", "吸气，挺胸。"),
    ],
    keypoints: figure({ leftArm: WIDE, rightArm: WIDE, leftLeg: { upper: 10, lower: 8 }, rightLeg: { upper: 10, lower: 8 } }),
  },
  {
    id: "hands-in-pockets",
    name: L("주머니에 손", "Hands in pockets", "ポケットに手", "手插口袋"),
    category: "solo",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("엄지는 밖으로 빼서 손이 있다는 걸 보여 주세요.", "Leave the thumbs out so the hands still read.", "親指は外に出して、手があることを見せます。", "大拇指露在外面，让人看得出有手。"),
      L("발은 어깨너비, 한쪽 발끝을 살짝 바깥으로.", "Feet shoulder-width, one toe turned slightly out.", "足は肩幅、片方のつま先を少し外へ。", "双脚与肩同宽，一只脚尖略朝外。"),
    ],
    handTip: L("손 전체가 아니라 손가락만 앞주머니에 넣으세요.", "Fingers only into the front pockets, not the whole hand.", "手全体ではなく指だけを前ポケットに入れます。", "只把手指插进前口袋，不是整只手。"),
    voiceSteps: [
      L("양손 손가락을 앞주머니에 넣으세요.", "Slide your fingers into the front pockets.", "両手の指を前ポケットに入れます。", "手指插进前口袋。"),
      L("엄지는 밖에 두세요.", "Keep the thumbs outside.", "親指は外に。", "大拇指留在外面。"),
      L("어깨를 뒤로 살짝 열고 편하게 서세요.", "Roll the shoulders back a little and stand easy.", "肩を少し後ろに開いて楽に立ちます。", "肩膀略微向后打开，放松站立。"),
    ],
    keypoints: figure({ leftArm: POCKET, rightArm: POCKET, leftLeg: { upper: 12, lower: 10 }, rightLeg: { upper: 12, lower: 10 } }),
  },
  {
    id: "arms-crossed",
    name: L("팔짱", "Arms crossed", "腕組み", "双臂交叉"),
    category: "solo",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("팔짱은 가슴 높이보다 조금 낮게.", "Cross a little below chest height, not high up.", "腕組みは胸より少し低い位置で。", "交叉的位置略低于胸口。"),
      L("한쪽 손은 팔뚝 위에 보이게 두세요.", "Let one hand show on top of the forearm.", "片方の手は前腕の上に見せます。", "让一只手露在前臂上面。"),
    ],
    handTip: L("손을 겨드랑이에 숨기지 말고 팔뚝 위에 올려 두세요.", "Do not tuck the hands under the arms; rest them on the forearms.", "手をわきに隠さず、前腕の上に置きます。", "别把手藏进腋下，放在前臂上。"),
    voiceSteps: [
      L("두 팔을 가슴 앞에서 교차하세요.", "Cross both arms in front of your chest.", "両腕を胸の前で組みます。", "双臂在胸前交叉。"),
      L("한 손은 위로 보이게 두세요.", "Keep one hand visible on top.", "片方の手は上に見せます。", "一只手放在上面露出来。"),
      L("발을 벌리고 턱을 살짝 들어 보세요.", "Widen the stance and lift the chin slightly.", "足を広げてあごを少し上げます。", "双脚分开，下巴微抬。"),
    ],
    keypoints: figure({ leftArm: CROSSED, rightArm: CROSSED, leftLeg: APART, rightLeg: APART }),
  },
  {
    id: "lean-on-wall",
    name: L("벽에 기대기", "Lean on a wall", "壁にもたれる", "靠墙"),
    category: "solo",
    gender: "male",
    difficulty: "medium",
    tips: [
      L("어깨만 벽에 대고 엉덩이는 떼세요.", "Only the shoulder touches the wall; keep the hips off it.", "肩だけ壁につけ、腰は離します。", "只有肩膀靠墙，胯部离开墙面。"),
      L("벽 쪽 발을 벽에 붙이면 자세가 안정됩니다.", "Plant the wall-side foot against the wall for balance.", "壁側の足を壁につけると安定します。", "靠墙那只脚抵住墙面会更稳。"),
    ],
    handTip: L("한 손은 주머니, 다른 손은 편하게 늘어뜨리세요.", "One hand in a pocket, the other hanging loose.", "片手はポケット、もう片方は自然に下ろします。", "一只手插口袋，另一只自然垂下。"),
    voiceSteps: [
      L("한쪽 어깨를 벽에 기대세요.", "Lean one shoulder against the wall.", "片方の肩を壁にもたれさせます。", "一侧肩膀靠在墙上。"),
      L("한 손을 주머니에 넣으세요.", "Put one hand in a pocket.", "片手をポケットに入れます。", "一只手插进口袋。"),
      L("카메라 옆쪽을 바라보세요.", "Look off to the side of the camera.", "カメラの横のほうを見ます。", "看向镜头的侧面。"),
    ],
    keypoints: figure({ leftArm: POCKET, rightArm: HANG, lean: -0.03, head: -0.02, leftLeg: { upper: 18, lower: 14 } }),
  },
  {
    id: "jacket-adjust",
    name: L("재킷 매만지기", "Jacket adjust", "ジャケットを直す", "整理外套"),
    category: "formal",
    gender: "male",
    difficulty: "medium",
    tips: [
      L("단추나 옷깃을 잡는 순간에 시선을 아래로.", "Look down at the button or lapel as you touch it.", "ボタンや襟に触れる瞬間、視線を下に。", "手碰到扣子或衣领时，视线向下。"),
      L("몸을 카메라에서 살짝 비틀면 어깨가 넓어 보입니다.", "Angle the body slightly off camera to broaden the shoulders.", "体を少しカメラから外すと肩幅が広く見えます。", "身体稍微侧向镜头，肩膀显得更宽。"),
    ],
    handTip: L("한 손은 단추, 다른 손은 소매 끝을 잡으세요.", "One hand on a button, the other at the cuff.", "片手はボタン、もう片方は袖口に。", "一只手扶扣子，另一只手捏袖口。"),
    voiceSteps: [
      L("한 손으로 재킷 단추를 잡으세요.", "Take hold of the jacket button with one hand.", "片手でジャケットのボタンをつまみます。", "一只手捏住外套扣子。"),
      L("다른 손은 소매를 정리하세요.", "Straighten a cuff with the other hand.", "もう片方の手で袖口を整えます。", "另一只手整理袖口。"),
      L("고개를 살짝 숙이고 눈은 아래로.", "Dip the head a little and look down.", "頭を少し下げて視線は下に。", "头微低，眼睛向下看。"),
    ],
    keypoints: figure({ leftArm: { upper: 30, lower: -118 }, rightArm: { upper: 12, lower: -96 }, lean: 0.01, head: -0.008 }),
  },
  {
    id: "look-away-pocket",
    name: L("먼 곳 보기", "Look away", "遠くを見る", "望向远方"),
    category: "solo",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("실제로 뭔가를 보는 것처럼 눈에 초점을 두세요.", "Actually focus on something; the eyes give it away.", "本当に何かを見るように目に焦点を。", "真的看着某样东西，眼神才自然。"),
      L("옆얼굴이 3/4 정도 보이게 돌리세요.", "Turn until about three-quarters of the face shows.", "顔が4分の3見えるくらいまで回します。", "转到能看到四分之三侧脸。"),
    ],
    handTip: L("한 손은 주머니, 다른 손은 목 뒤나 턱에.", "One hand in a pocket, the other at the back of the neck or the chin.", "片手はポケット、もう片方は首の後ろかあごに。", "一只手插口袋，另一只放在后颈或下巴。"),
    voiceSteps: [
      L("한 손을 주머니에 넣으세요.", "Put one hand in your pocket.", "片手をポケットに入れます。", "一只手插进口袋。"),
      L("고개를 돌려 카메라 밖 먼 곳을 보세요.", "Turn your head and look far past the camera.", "頭を回してカメラの外の遠くを見ます。", "转头看向镜头外的远处。"),
      L("다른 손을 턱에 가볍게 대세요.", "Bring the other hand lightly to your chin.", "もう片方の手をあごに軽く添えます。", "另一只手轻轻托着下巴。"),
    ],
    keypoints: figure({ leftArm: { upper: 40, lower: -150 }, rightArm: POCKET, head: 0.03 }),
  },
  {
    id: "couple-hand-reach",
    name: L("손 내밀기", "Hand reach", "手を差し出す", "伸手牵"),
    category: "couple",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("상대를 향해 팔을 뻗고 손바닥을 위로.", "Extend the arm toward your partner with the palm up.", "相手に向かって腕を伸ばし、手のひらを上に。", "朝对方伸出手臂，掌心向上。"),
      L("혼자 찍을 때는 프레임 밖을 향해 뻗어도 됩니다.", "Solo? Reach toward the edge of the frame; it still reads.", "一人なら画面の端に向かって伸ばしてもOK。", "一个人拍时，朝画面边缘伸手也可以。"),
    ],
    handTip: L("손가락은 모으고 손목은 살짝 아래로 떨어뜨리세요.", "Fingers together, wrist dropped a touch.", "指をそろえ、手首を少し下げます。", "手指并拢，手腕略微下沉。"),
    voiceSteps: [
      L("한 팔을 옆으로 아래쪽으로 뻗으세요.", "Reach one arm out and down to the side.", "片腕を横下に伸ばします。", "一只手臂向侧下方伸出。"),
      L("손바닥을 위로 열어 두세요.", "Open the palm upward.", "手のひらを上に開きます。", "掌心朝上打开。"),
      L("손 쪽으로 몸을 살짝 기울이세요.", "Lean slightly toward the hand.", "手のほうに少し体を傾けます。", "身体略微朝手的方向倾斜。"),
    ],
    keypoints: figure({ leftArm: REACH, rightArm: HANG, lean: 0.012, head: 0.01 }),
  },
  {
    id: "couple-back-to-back",
    name: L("등 맞대기", "Back to back", "背中合わせ", "背靠背"),
    category: "couple",
    gender: "any",
    difficulty: "medium",
    tips: [
      L("어깨뼈를 맞대고 팔짱을 끼세요.", "Touch shoulder blades and fold the arms.", "肩甲骨を合わせて腕を組みます。", "肩胛骨相靠，双臂交叉。"),
      L("고개는 서로 반대 방향으로 돌리세요.", "Turn your heads in opposite directions.", "顔はお互い反対方向へ。", "两人的头朝相反方向转。"),
    ],
    handTip: L("팔짱을 낮게 끼고 한 손은 보이게.", "Fold the arms low and keep one hand visible.", "腕組みは低めに、片手は見せます。", "手臂交叉位置放低，露出一只手。"),
    voiceSteps: [
      L("상대와 등을 맞대세요.", "Stand back to back with your partner.", "相手と背中を合わせます。", "和对方背靠背站。"),
      L("팔짱을 끼세요.", "Cross your arms.", "腕を組みます。", "双臂交叉。"),
      L("고개를 카메라 반대쪽으로 살짝 돌리세요.", "Turn the head a little away from the camera.", "顔をカメラから少しそらします。", "头略微转离镜头。"),
    ],
    keypoints: figure({ leftArm: CROSSED, rightArm: CROSSED, lean: -0.018, head: 0.018 }),
  },
  {
    id: "couple-forehead",
    name: L("이마 맞대기", "Forehead lean", "おでこを合わせる", "额头相抵"),
    category: "couple",
    gender: "any",
    difficulty: "medium",
    tips: [
      L("눈을 감고 이마만 살짝 닿게.", "Close the eyes and let only the foreheads touch.", "目を閉じて、おでこだけ軽く触れます。", "闭上眼，只让额头轻轻相碰。"),
      L("양손은 상대의 팔이나 허리에.", "Hands on your partner's arms or waist.", "両手は相手の腕か腰に。", "双手放在对方的手臂或腰上。"),
    ],
    handTip: L("손은 앞으로 뻗어 상대의 팔꿈치 높이에 두세요.", "Reach forward and hold at your partner's elbow height.", "手を前に伸ばし、相手のひじの高さで支えます。", "手向前伸，停在对方手肘的高度。"),
    voiceSteps: [
      L("상대와 마주 서세요.", "Face your partner.", "相手と向かい合います。", "和对方面对面站。"),
      L("이마를 살짝 맞대세요.", "Touch foreheads gently.", "おでこをそっと合わせます。", "额头轻轻相抵。"),
      L("양손을 앞으로 내밀어 상대를 잡으세요.", "Bring both hands forward and hold your partner.", "両手を前に出して相手を支えます。", "双手向前扶住对方。"),
    ],
    keypoints: figure({ leftArm: FORWARD, rightArm: FORWARD, lean: 0.015, head: 0.02 }),
  },
  {
    id: "travel-point",
    name: L("랜드마크 가리키기", "Point at the landmark", "名所を指さす", "指向地标"),
    category: "travel",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("가리키는 손 쪽으로 시선도 함께 보내세요.", "Send your eyes where the finger points.", "指さす先に視線も送ります。", "眼睛也看向手指的方向。"),
      L("팔을 완전히 펴지 말고 팔꿈치를 살짝 굽히세요.", "Do not lock the arm; keep a soft bend at the elbow.", "腕を伸ばしきらず、ひじを少し曲げます。", "手臂别完全伸直，手肘略弯。"),
    ],
    handTip: L("검지만 펴고 나머지는 느슨하게 말아 두세요.", "Index finger out, the rest loosely curled.", "人差し指だけ伸ばし、ほかは軽く曲げます。", "只伸出食指，其余手指松松卷起。"),
    voiceSteps: [
      L("한 팔을 옆으로 들어 랜드마크를 가리키세요.", "Raise one arm to the side and point at the landmark.", "片腕を横に上げて名所を指さします。", "一只手臂抬向侧面，指向地标。"),
      L("그쪽을 보세요.", "Look that way.", "そちらを見ます。", "看向那边。"),
      L("다른 손은 허리에 올리세요.", "Put the other hand on your hip.", "もう片方の手を腰に当てます。", "另一只手叉腰。"),
    ],
    keypoints: figure({ leftArm: POINT, rightArm: ON_HIP, head: 0.03 }),
  },
  {
    id: "travel-arms-wide",
    name: L("두 팔 활짝", "Arms wide open", "両腕を広げる", "张开双臂"),
    category: "travel",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("팔을 어깨보다 조금 높게 올리면 배경이 더 보입니다.", "Lift the arms a little above the shoulders to show more background.", "腕を肩より少し高く上げると背景がよく見えます。", "手臂抬得比肩膀略高，背景露出更多。"),
      L("눈을 감고 바람을 느끼는 표정도 좋습니다.", "Eyes closed, as if feeling the wind, also works.", "目を閉じて風を感じる表情もおすすめ。", "闭眼感受风的表情也很好。"),
    ],
    handTip: L("손바닥은 앞을 향하고 손가락은 편하게.", "Palms forward, fingers relaxed.", "手のひらは前へ、指はリラックス。", "掌心朝前，手指放松。"),
    voiceSteps: [
      L("두 팔을 양옆으로 활짝 벌리세요.", "Spread both arms wide to the sides.", "両腕を左右に大きく広げます。", "双臂向两侧张开。"),
      L("손바닥을 카메라 쪽으로 돌리세요.", "Turn the palms toward the camera.", "手のひらをカメラに向けます。", "掌心转向镜头。"),
      L("고개를 조금 들고 크게 웃으세요.", "Lift the chin and smile big.", "あごを少し上げて大きく笑います。", "下巴微抬，大大地笑。"),
    ],
    keypoints: figure({ leftArm: { upper: 100, lower: 104 }, rightArm: { upper: 100, lower: 104 }, leftLeg: { upper: 8, lower: 6 }, rightLeg: { upper: 8, lower: 6 } }),
  },
  {
    id: "travel-walk-away",
    name: L("걸어가는 뒷모습", "Walking away", "歩き去る後ろ姿", "背影走开"),
    category: "travel",
    gender: "female",
    difficulty: "medium",
    tips: [
      L("한 손을 뒤로 흔들거나 모자를 잡으세요.", "Swing one hand back or hold onto a hat.", "片手を後ろに振るか帽子を押さえます。", "一只手向后摆，或者扶着帽子。"),
      L("발걸음은 크게, 어깨는 내리세요.", "Take a long stride and drop the shoulders.", "歩幅は大きく、肩は下げます。", "步子迈大，肩膀放松。"),
    ],
    handTip: L("한 손은 머리 위 모자에, 다른 손은 옆으로 자연스럽게.", "One hand up on a hat, the other swinging at your side.", "片手は帽子に、もう片方は横で自然に。", "一只手扶头上的帽子，另一只手在身侧自然摆。"),
    voiceSteps: [
      L("카메라에 등을 돌리세요.", "Turn your back to the camera.", "カメラに背を向けます。", "背对镜头。"),
      L("한 손을 머리나 모자에 올리세요.", "Raise one hand to your head or hat.", "片手を頭か帽子に上げます。", "一只手抬到头顶或帽子上。"),
      L("한 걸음 크게 내딛으세요.", "Take one long step forward.", "大きく一歩踏み出します。", "向前迈一大步。"),
    ],
    keypoints: figure({ leftArm: { upper: 110, lower: -165 }, rightArm: { upper: 14, lower: 10 }, leftLeg: STEP, rightLeg: { upper: -8, lower: 4 }, head: 0.0 }),
  },
  {
    id: "travel-backpack-look",
    name: L("배낭 메고 돌아보기", "Backpack look back", "リュックで振り向く", "背包回头"),
    category: "travel",
    gender: "male",
    difficulty: "medium",
    tips: [
      L("양손으로 배낭 끈을 잡으면 어깨가 정리됩니다.", "Holding both straps tidies the shoulders.", "両手でリュックのひもを持つと肩が整います。", "双手抓住背包带，肩膀线条更整齐。"),
      L("몸은 앞으로, 얼굴만 카메라로.", "Body forward, only the face turns to the camera.", "体は前、顔だけカメラへ。", "身体朝前，只有脸转向镜头。"),
    ],
    handTip: L("양손으로 가슴 높이의 배낭 끈을 잡으세요.", "Grip the backpack straps at chest height with both hands.", "両手で胸の高さのリュックひもを握ります。", "双手抓住胸前高度的背包带。"),
    voiceSteps: [
      L("카메라에 반쯤 등을 돌리세요.", "Turn half away from the camera.", "カメラに半分背を向けます。", "身体半转背对镜头。"),
      L("양손으로 배낭 끈을 잡으세요.", "Hold the backpack straps with both hands.", "両手でリュックのひもを持ちます。", "双手抓住背包带。"),
      L("어깨 너머로 돌아보세요.", "Look back over your shoulder.", "肩越しに振り向きます。", "从肩膀上方回头看。"),
    ],
    keypoints: figure({ leftArm: { upper: 24, lower: -128 }, rightArm: { upper: 24, lower: -128 }, head: -0.03, lean: -0.015 }),
  },
  {
    id: "grad-cap-toss",
    name: L("학사모 던지기", "Cap toss", "角帽を投げる", "抛学士帽"),
    category: "grad",
    gender: "any",
    difficulty: "hard",
    tips: [
      L("실제로 던지기 직전, 팔이 가장 높을 때를 잡으세요.", "Shoot at the top of the arm swing, just before the release.", "投げる直前、腕が一番高い瞬間を狙います。", "在抛出前手臂最高的瞬间按快门。"),
      L("시선은 모자를 따라 위로.", "Eyes follow the cap upward.", "視線は帽子を追って上に。", "眼睛跟着帽子往上看。"),
    ],
    handTip: L("한 손은 머리 위로 쭉, 다른 손은 옆에서 균형.", "One hand straight up, the other out for balance.", "片手を頭上にまっすぐ、もう片方は横でバランス。", "一只手直举过头，另一只手在侧面保持平衡。"),
    voiceSteps: [
      L("학사모를 한 손에 쥐세요.", "Hold the cap in one hand.", "角帽を片手に持ちます。", "一只手拿着学士帽。"),
      L("그 팔을 머리 위로 높이 올리세요.", "Raise that arm high above your head.", "その腕を頭の上に高く上げます。", "把那只手臂高举过头。"),
      L("위를 보고 셋에 던지세요.", "Look up and toss on three.", "上を見て、3で投げます。", "抬头看，数到三就抛。"),
    ],
    keypoints: figure({ leftArm: UP, rightArm: { upper: 40, lower: 42 }, leftLeg: { upper: 10, lower: 8 }, rightLeg: { upper: 10, lower: 8 }, head: 0.01 }),
  },
  {
    id: "grad-diploma-f",
    name: L("졸업장 들기", "Diploma hold", "卒業証書を持つ", "手持毕业证"),
    category: "grad",
    gender: "female",
    difficulty: "easy",
    tips: [
      L("졸업장을 가슴 앞에서 살짝 비스듬히.", "Hold the diploma at chest height, slightly tilted.", "卒業証書を胸の前で少し斜めに。", "毕业证放在胸前，稍微倾斜。"),
      L("몸을 카메라에서 살짝 틀고 얼굴은 정면.", "Angle the body a little; face stays to the camera.", "体を少し斜めに、顔は正面。", "身体略侧，脸朝镜头。"),
    ],
    handTip: L("양손으로 졸업장 양 끝을 잡고 팔꿈치를 몸에 붙이세요.", "Both hands on the ends, elbows tucked in.", "両手で両端を持ち、ひじを体に寄せます。", "双手握住两端，手肘贴近身体。"),
    voiceSteps: [
      L("졸업장을 양손으로 드세요.", "Hold the diploma in both hands.", "卒業証書を両手で持ちます。", "双手拿起毕业证。"),
      L("가슴 앞으로 올리세요.", "Bring it up to your chest.", "胸の前に上げます。", "举到胸前。"),
      L("한쪽 다리에 무게를 싣고 웃으세요.", "Shift onto one leg and smile.", "片脚に体重をかけて笑います。", "重心移到一条腿上，微笑。"),
    ],
    keypoints: figure({ leftArm: CHEST, rightArm: CHEST, hipShift: 0.01, leftLeg: STAND_LEG, rightLeg: { upper: 8, lower: 6 } }),
  },
  {
    id: "grad-diploma-m",
    name: L("졸업장과 정면", "Diploma, square on", "卒業証書と正面", "正面持证"),
    category: "grad",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("졸업장을 한 손으로 옆구리 높이에 들고 다른 손은 주머니.", "Diploma in one hand at hip height, other hand in a pocket.", "卒業証書を片手で腰の高さに、もう片方はポケット。", "一只手在胯部高度拿毕业证，另一只手插口袋。"),
      L("발은 어깨너비, 가슴을 펴세요.", "Feet shoulder-width, chest open.", "足は肩幅、胸を張ります。", "双脚与肩同宽，挺胸。"),
    ],
    handTip: L("졸업장은 세로로 세워 한 손으로, 팔은 자연스럽게.", "Hold the diploma upright in one hand, arm relaxed.", "証書は縦に片手で、腕は自然に。", "毕业证竖着单手拿，手臂自然。"),
    voiceSteps: [
      L("졸업장을 한 손에 세워 드세요.", "Hold the diploma upright in one hand.", "卒業証書を片手で縦に持ちます。", "一只手竖着拿毕业证。"),
      L("다른 손은 주머니에 넣으세요.", "Put the other hand in a pocket.", "もう片方の手をポケットに入れます。", "另一只手插进口袋。"),
      L("발을 벌리고 정면을 보세요.", "Widen the stance and look straight ahead.", "足を開いて正面を見ます。", "双脚分开，目视前方。"),
    ],
    keypoints: figure({ leftArm: { upper: 14, lower: -20 }, rightArm: POCKET, leftLeg: APART, rightLeg: APART }),
  },
  {
    id: "grad-cap-tip",
    name: L("학사모 잡기", "Cap tip", "角帽に手を添える", "扶学士帽"),
    category: "grad",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("모자 챙을 살짝 잡고 고개를 조금 숙이세요.", "Hold the brim lightly and dip the head slightly.", "つばを軽くつまみ、頭を少し下げます。", "轻捏帽檐，头稍微低一点。"),
      L("눈은 위로 올려 카메라를 보세요.", "Raise the eyes to the camera.", "目だけ上げてカメラを見ます。", "眼睛抬起看镜头。"),
    ],
    handTip: L("한 손은 모자 챙, 다른 손은 허리나 주머니에.", "One hand on the brim, the other on the hip or in a pocket.", "片手はつば、もう片方は腰かポケットに。", "一只手扶帽檐，另一只手叉腰或插口袋。"),
    voiceSteps: [
      L("한 손을 올려 학사모 챙을 잡으세요.", "Raise one hand and hold the cap's brim.", "片手を上げて角帽のつばをつまみます。", "抬手扶住学士帽帽檐。"),
      L("고개를 살짝 숙이세요.", "Dip your head slightly.", "頭を少し下げます。", "头微低。"),
      L("눈은 카메라를 보세요.", "Eyes to the camera.", "目はカメラへ。", "眼睛看镜头。"),
    ],
    keypoints: figure({ leftArm: { upper: 70, lower: -165 }, rightArm: ON_HIP, head: 0.0 }),
  },
  {
    id: "casual-steps",
    name: L("계단에 앉기", "Sitting on steps", "階段に座る", "坐台阶"),
    category: "casual",
    gender: "any",
    seated: true,
    difficulty: "easy",
    tips: [
      L("한 계단 위에 팔꿈치를 올리면 몸이 열립니다.", "Rest an elbow on the step above to open the body.", "一段上にひじを置くと体が開きます。", "手肘搭在上一级台阶上，身体更舒展。"),
      L("무릎을 카메라 쪽으로 향하지 말고 옆으로.", "Point the knees to the side, not at the camera.", "膝はカメラに向けず横へ。", "膝盖朝侧面，别正对镜头。"),
    ],
    handTip: L("한 손은 무릎 위, 다른 손은 뒤쪽 계단을 짚으세요.", "One hand on a knee, the other braced on the step behind.", "片手は膝の上、もう片方は後ろの段に。", "一只手放膝盖上，另一只手撑在后面的台阶上。"),
    voiceSteps: [
      L("계단에 비스듬히 앉으세요.", "Sit on the steps at an angle.", "階段に斜めに座ります。", "斜坐在台阶上。"),
      L("한 손을 무릎에 올리세요.", "Rest one hand on your knee.", "片手を膝に置きます。", "一只手放在膝盖上。"),
      L("다른 손으로 뒤를 짚고 어깨를 내리세요.", "Brace the other hand behind you and drop the shoulders.", "もう片方の手を後ろにつき、肩を下げます。", "另一只手撑在身后，肩膀放松。"),
    ],
    keypoints: figure({ leftArm: { upper: 24, lower: -40 }, rightArm: { upper: 34, lower: 20 }, seated: true, lean: -0.01 }),
  },
  {
    id: "casual-coffee",
    name: L("커피 들기", "Coffee cup", "コーヒーを持つ", "端咖啡"),
    category: "casual",
    gender: "female",
    difficulty: "easy",
    tips: [
      L("컵을 입 가까이 들되 얼굴을 가리지 마세요.", "Bring the cup near the mouth without hiding the face.", "カップを口の近くに、顔は隠さないように。", "杯子靠近嘴边，但别挡住脸。"),
      L("다른 손은 컵 아래를 받치거나 팔꿈치를 잡으세요.", "The other hand cradles the cup or holds the elbow.", "もう片方の手はカップの底かひじを支えます。", "另一只手托杯底或扶手肘。"),
    ],
    handTip: L("양손으로 컵을 감싸고 손가락은 자연스럽게.", "Wrap both hands around the cup, fingers soft.", "両手でカップを包み、指は自然に。", "双手捧杯，手指自然。"),
    voiceSteps: [
      L("양손으로 컵을 잡으세요.", "Hold the cup with both hands.", "両手でカップを持ちます。", "双手拿杯子。"),
      L("컵을 턱 높이까지 올리세요.", "Raise it to chin height.", "あごの高さまで上げます。", "举到下巴高度。"),
      L("고개를 살짝 기울이고 웃으세요.", "Tilt the head a touch and smile.", "頭を少し傾けて笑います。", "头微倾，微笑。"),
    ],
    keypoints: figure({ leftArm: { upper: 26, lower: -120 }, rightArm: { upper: 22, lower: -118 }, head: 0.01 }),
  },
  {
    id: "casual-phone",
    name: L("폰 보기", "Phone check", "スマホを見る", "看手机"),
    category: "casual",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("폰은 가슴 높이, 시선은 폰으로.", "Phone at chest height, eyes on the phone.", "スマホは胸の高さ、視線はスマホへ。", "手机在胸口高度，眼睛看手机。"),
      L("한쪽 어깨를 낮추고 발을 엇갈리게.", "Drop one shoulder and stagger the feet.", "片方の肩を下げ、足を前後にずらします。", "一侧肩膀放低，双脚前后错开。"),
    ],
    handTip: L("한 손은 폰, 다른 손은 주머니.", "One hand on the phone, the other in a pocket.", "片手はスマホ、もう片方はポケット。", "一只手拿手机，另一只手插口袋。"),
    voiceSteps: [
      L("한 손으로 폰을 가슴 높이에 드세요.", "Hold the phone at chest height in one hand.", "片手でスマホを胸の高さに持ちます。", "一只手把手机拿到胸口高度。"),
      L("다른 손은 주머니에.", "Other hand in a pocket.", "もう片方はポケットに。", "另一只手插口袋。"),
      L("고개를 숙여 폰을 보세요.", "Look down at the phone.", "スマホを見下ろします。", "低头看手机。"),
    ],
    keypoints: figure({ leftArm: { upper: 22, lower: -108 }, rightArm: POCKET, head: -0.004, leftLeg: STEP, rightLeg: { upper: 6, lower: 4 } }),
  },
  {
    id: "power-stance-m",
    name: L("파워 스탠스", "Power stance", "パワースタンス", "力量站姿"),
    category: "formal",
    gender: "male",
    difficulty: "easy",
    tips: [
      L("발은 어깨보다 넓게, 무릎은 곧게.", "Feet wider than the shoulders, knees straight.", "足は肩幅より広く、膝はまっすぐ。", "双脚比肩宽，膝盖伸直。"),
      L("턱을 살짝 당기고 카메라를 똑바로 보세요.", "Tuck the chin slightly and look straight at the lens.", "あごを少し引いてレンズをまっすぐ見ます。", "下巴微收，直视镜头。"),
    ],
    handTip: L("양손을 허리에, 엄지는 뒤로.", "Both hands on the hips, thumbs to the back.", "両手を腰に、親指は後ろ。", "双手叉腰，拇指朝后。"),
    voiceSteps: [
      L("발을 어깨보다 넓게 벌리세요.", "Set your feet wider than your shoulders.", "足を肩幅より広く開きます。", "双脚分开比肩宽。"),
      L("양손을 허리에 올리세요.", "Put both hands on your hips.", "両手を腰に当てます。", "双手叉腰。"),
      L("가슴을 펴고 카메라를 보세요.", "Open the chest and look at the camera.", "胸を張ってカメラを見ます。", "挺胸，看镜头。"),
    ],
    keypoints: figure({ leftArm: ON_HIP, rightArm: ON_HIP, leftLeg: { upper: 20, lower: 18 }, rightLeg: { upper: 20, lower: 18 } }),
  },
  {
    id: "power-stance-f",
    name: L("파워 포즈", "Power pose", "パワーポーズ", "力量姿态"),
    category: "formal",
    gender: "female",
    difficulty: "easy",
    tips: [
      L("한 발을 앞으로, 양손은 허리.", "One foot forward, both hands on the hips.", "片足を前に、両手は腰。", "一只脚在前，双手叉腰。"),
      L("어깨를 뒤로 열고 턱을 살짝 들어 보세요.", "Roll the shoulders back and lift the chin a little.", "肩を後ろに開き、あごを少し上げます。", "肩膀向后打开，下巴微抬。"),
    ],
    handTip: L("양손 손가락을 허리뼈 위에, 팔꿈치는 넓게.", "Fingertips on the hip bones, elbows wide.", "両手の指先を腰骨に、ひじは広く。", "指尖放在髋骨上，手肘张开。"),
    voiceSteps: [
      L("양손을 허리에 올리세요.", "Put both hands on your hips.", "両手を腰に当てます。", "双手叉腰。"),
      L("한 발을 앞으로 내딛으세요.", "Step one foot forward.", "片足を前に出します。", "一只脚向前迈。"),
      L("어깨를 뒤로 열고 턱을 드세요.", "Open the shoulders and lift the chin.", "肩を開いてあごを上げます。", "打开肩膀，抬起下巴。"),
    ],
    keypoints: figure({ leftArm: ON_HIP, rightArm: ON_HIP, leftLeg: STEP, rightLeg: { upper: 8, lower: 6 }, hipShift: 0.008 }),
  },
  {
    id: "hands-clasped",
    name: L("두 손 모으기", "Hands clasped", "両手を前で組む", "双手交握"),
    category: "formal",
    gender: "any",
    difficulty: "easy",
    tips: [
      L("손은 허리띠 높이에서 가볍게.", "Clasp lightly at belt height.", "ベルトの高さで軽く組みます。", "在腰带高度轻轻交握。"),
      L("팔꿈치를 살짝 굽혀 팔이 굳어 보이지 않게.", "Keep a soft bend so the arms do not look stiff.", "ひじを少し曲げて腕が硬く見えないように。", "手肘略弯，手臂别显得僵硬。"),
    ],
    handTip: L("한 손이 다른 손을 감싸고 손가락은 깍지 끼지 마세요.", "One hand cups the other; no interlaced fingers.", "片手でもう片方を包み、指は組まない。", "一只手包住另一只手，别十指交叉。"),
    voiceSteps: [
      L("양손을 앞에서 모으세요.", "Bring both hands together in front.", "両手を前で合わせます。", "双手在身前合拢。"),
      L("팔꿈치를 살짝 굽히세요.", "Soften the elbows.", "ひじを少し曲げます。", "手肘略弯。"),
      L("어깨를 내리고 부드럽게 웃으세요.", "Drop the shoulders and smile gently.", "肩を下げてやさしく笑います。", "肩膀放松，轻轻微笑。"),
    ],
    keypoints: figure({ leftArm: CLASP, rightArm: CLASP }),
  },
  {
    id: "seated-lap",
    name: L("앉아서 손 무릎에", "Seated, hands on lap", "座って手を膝に", "坐姿手放腿上"),
    category: "casual",
    gender: "any",
    adaptive: true,
    seated: true,
    difficulty: "easy",
    tips: [
      L("휠체어나 의자에서 등을 세우고 양손은 무릎 위.", "In a wheelchair or chair, sit tall with both hands on the lap.", "車いすや椅子で背筋を伸ばし、両手は膝の上。", "在轮椅或椅子上坐直，双手放在腿上。"),
      L("카메라를 눈높이로 낮춰 달라고 하세요.", "Ask for the camera to come down to your eye level.", "カメラを目の高さまで下げてもらいましょう。", "请对方把镜头降到你的视线高度。"),
    ],
    handTip: L("한 손을 다른 손 위에 포개고 손가락은 편하게.", "Layer one hand over the other, fingers relaxed.", "片手をもう片方に重ね、指はリラックス。", "一只手叠在另一只手上，手指放松。"),
    voiceSteps: [
      L("등을 곧게 세우세요.", "Sit up tall.", "背筋を伸ばします。", "坐直。"),
      L("양손을 무릎 위에 포개세요.", "Rest both hands on your lap.", "両手を膝の上に重ねます。", "双手叠放在腿上。"),
      L("어깨를 내리고 카메라를 보세요.", "Drop the shoulders and look at the camera.", "肩を下げてカメラを見ます。", "肩膀放松，看镜头。"),
    ],
    keypoints: figure({ leftArm: { upper: 14, lower: -52 }, rightArm: { upper: 14, lower: -52 }, seated: true }),
  },
  {
    id: "seated-wave",
    name: L("앉아서 손 흔들기", "Seated wave", "座って手を振る", "坐姿挥手"),
    category: "casual",
    gender: "any",
    adaptive: true,
    seated: true,
    difficulty: "easy",
    tips: [
      L("한 손을 어깨 높이 위로 들고 손바닥을 카메라로.", "Raise one hand above shoulder height, palm to the camera.", "片手を肩より上に上げ、手のひらをカメラへ。", "一只手举过肩膀，掌心朝镜头。"),
      L("다른 손은 팔걸이나 무릎에.", "The other hand on the armrest or knee.", "もう片方はひじ掛けか膝に。", "另一只手放扶手或膝盖上。"),
    ],
    handTip: L("흔드는 손은 손가락을 모으고, 다른 손은 무릎.", "Waving hand fingers together, other hand on the knee.", "振る手は指をそろえ、もう片方は膝に。", "挥的手手指并拢，另一只手放膝盖。"),
    voiceSteps: [
      L("한 손을 얼굴 옆까지 올리세요.", "Raise one hand up beside your face.", "片手を顔の横まで上げます。", "一只手举到脸旁。"),
      L("손바닥을 카메라 쪽으로.", "Palm toward the camera.", "手のひらをカメラへ。", "掌心朝镜头。"),
      L("다른 손은 무릎에 두고 웃으세요.", "Other hand on the knee, and smile.", "もう片方は膝に置いて笑います。", "另一只手放膝盖上，微笑。"),
    ],
    keypoints: figure({ leftArm: WAVE, rightArm: { upper: 14, lower: -52 }, seated: true }),
  },
  {
    id: "seated-side-lean",
    name: L("앉아서 옆으로 기대기", "Seated side lean", "座って横にもたれる", "坐姿侧靠"),
    category: "solo",
    gender: "female",
    adaptive: true,
    seated: true,
    difficulty: "medium",
    tips: [
      L("팔걸이에 팔꿈치를 올리고 턱을 손에 살짝.", "Elbow on the armrest, chin resting lightly on the hand.", "ひじ掛けにひじを置き、あごを手に軽く。", "手肘搭在扶手上，下巴轻轻靠在手上。"),
      L("몸통을 기대는 쪽으로 조금 기울이세요.", "Tilt the torso a little toward the leaning side.", "上体をもたれる側に少し傾けます。", "上身略向靠的那一侧倾斜。"),
    ],
    handTip: L("한 손은 턱 아래, 다른 손은 무릎 위에.", "One hand under the chin, the other on the knee.", "片手はあごの下、もう片方は膝の上。", "一只手托下巴，另一只手放膝盖上。"),
    voiceSteps: [
      L("한쪽 팔꿈치를 팔걸이에 올리세요.", "Rest one elbow on the armrest.", "片方のひじをひじ掛けに置きます。", "一只手肘搭在扶手上。"),
      L("턱을 그 손에 살짝 기대세요.", "Rest your chin lightly on that hand.", "あごをその手に軽く乗せます。", "下巴轻轻靠在那只手上。"),
      L("몸을 그쪽으로 조금 기울이세요.", "Lean the body a little that way.", "体をそちらに少し傾けます。", "身体略向那边倾斜。"),
    ],
    keypoints: figure({ leftArm: { upper: 48, lower: -165 }, rightArm: { upper: 12, lower: -50 }, seated: true, lean: 0.02, head: 0.012 }),
  },
  {
    id: "seated-arms-crossed",
    name: L("앉아서 팔짱", "Seated arms crossed", "座って腕組み", "坐姿抱臂"),
    category: "formal",
    gender: "male",
    adaptive: true,
    seated: true,
    difficulty: "easy",
    tips: [
      L("휠체어 등받이에서 등을 떼고 팔짱은 낮게.", "Come off the backrest and cross the arms low.", "背もたれから背を離し、腕組みは低めに。", "背离开靠背，双臂交叉位置放低。"),
      L("턱을 살짝 들고 카메라를 정면으로.", "Lift the chin slightly and face the camera.", "あごを少し上げてカメラを正面に。", "下巴微抬，正对镜头。"),
    ],
    handTip: L("한 손은 팔뚝 위에 보이게, 다른 손은 겨드랑이 아래.", "One hand visible on the forearm, the other tucked under.", "片手は前腕の上に見せ、もう片方はわきの下。", "一只手露在前臂上，另一只手收在下面。"),
    voiceSteps: [
      L("등받이에서 등을 살짝 떼세요.", "Sit slightly forward from the backrest.", "背もたれから少し背を離します。", "身体略微离开靠背。"),
      L("두 팔을 가슴 앞에서 교차하세요.", "Cross both arms in front of the chest.", "両腕を胸の前で組みます。", "双臂在胸前交叉。"),
      L("턱을 들고 카메라를 보세요.", "Lift the chin and look at the camera.", "あごを上げてカメラを見ます。", "抬起下巴，看镜头。"),
    ],
    keypoints: figure({ leftArm: CROSSED, rightArm: CROSSED, seated: true }),
  },
  {
    id: "seated-point",
    name: L("앉아서 가리키기", "Seated point", "座って指さす", "坐姿指向"),
    category: "travel",
    gender: "any",
    adaptive: true,
    seated: true,
    difficulty: "easy",
    tips: [
      L("한 팔을 옆으로 뻗어 풍경을 가리키고 시선도 그쪽으로.", "Point one arm at the view and look that way too.", "片腕を横に伸ばして景色を指さし、視線もそちらへ。", "一只手臂指向风景，眼睛也看过去。"),
      L("휠체어 바퀴가 보여도 괜찮습니다. 프레임에 넣으세요.", "Wheels in the frame are fine; include them.", "車いすの車輪が写ってもOK。フレームに入れましょう。", "轮椅轮子入镜没关系，放进画面里。"),
    ],
    handTip: L("가리키는 손은 검지만, 다른 손은 팔걸이.", "Pointing hand index out, other hand on the armrest.", "指さす手は人差し指だけ、もう片方はひじ掛け。", "指的那只手只伸食指，另一只手放扶手上。"),
    voiceSteps: [
      L("한 팔을 옆으로 뻗으세요.", "Reach one arm out to the side.", "片腕を横に伸ばします。", "一只手臂向侧面伸出。"),
      L("검지로 풍경을 가리키세요.", "Point at the view with your index finger.", "人差し指で景色を指さします。", "用食指指向风景。"),
      L("그쪽을 보고 웃으세요.", "Look that way and smile.", "そちらを見て笑います。", "看向那边，微笑。"),
    ],
    keypoints: figure({ leftArm: POINT, rightArm: { upper: 22, lower: 6 }, seated: true, head: 0.03 }),
  },
];

/* ------------------------------------------------------------------ */
/* Filtering / navigation                                               */
/* ------------------------------------------------------------------ */

export type CategoryFilter = "all" | Category | "adaptive";
export type GenderFilterValue = "all" | "female" | "male";

export interface PoseFilter {
  category?: CategoryFilter;
  gender?: GenderFilterValue;
  query?: string;
  lang?: Lang;
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKC").trim();
}

const CATEGORY_MSG: Record<Category, MsgKey> = {
  solo: "catSolo",
  couple: "catCouple",
  travel: "catTravel",
  grad: "catGrad",
  casual: "catCasual",
  formal: "catFormal",
};

/** The category's label in the reader's language, so "졸업" finds every grad pose. */
export function categoryLabel(category: Category, lang: Lang): string {
  return I18N[lang][CATEGORY_MSG[category]];
}

/**
 * Male filter returns poses tagged male OR any (a "hands in pockets" pose is
 * for men; "arms wide open" is for everyone). Adaptive is a category chip
 * that selects the seated / wheelchair variants across all categories.
 */
export function filterPoses(list: Pose[], f: PoseFilter): Pose[] {
  const cat = f.category ?? "all";
  const gender = f.gender ?? "all";
  const q = norm(f.query ?? "");
  return list.filter((p) => {
    if (cat === "adaptive") {
      if (!p.adaptive && !p.seated) return false;
    } else if (cat !== "all" && p.category !== cat) {
      return false;
    }
    if (gender !== "all" && p.gender !== "any" && p.gender !== gender) return false;
    if (q) {
      const hay = [
        p.id,
        ...Object.values(p.name),
        p.category,
        ...(f.lang
          ? [categoryLabel(p.category, f.lang), p.handTip[f.lang], ...p.tips.map((t) => t[f.lang!])]
          : []),
      ]
        .map(norm)
        .join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function findPose(id: string): Pose | undefined {
  return POSES.find((p) => p.id === id);
}

export function poseIndex(list: Pose[], id: string): number {
  return list.findIndex((p) => p.id === id);
}

/** Next / previous within the currently filtered list, wrapping around. */
export function stepPose(list: Pose[], currentId: string, dir: 1 | -1): Pose | undefined {
  if (list.length === 0) return undefined;
  const i = poseIndex(list, currentId);
  if (i < 0) return list[0];
  return list[(i + dir + list.length) % list.length];
}

export function randomPose(list: Pose[], excludeId?: string, rand: () => number = Math.random): Pose | undefined {
  if (list.length === 0) return undefined;
  const pool = list.length > 1 ? list.filter((p) => p.id !== excludeId) : list;
  return pool[Math.floor(rand() * pool.length)];
}
