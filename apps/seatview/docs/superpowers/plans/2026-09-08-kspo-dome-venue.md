# KSPO DOME 실제 공연장 적용 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개된 KSPO DOME 공식 3D 모델(DAE)에서 좌석 위치와 외형을 뽑아 `public/venues/kspo-dome/{venue.json, shell.glb}`를 만들고 뷰어에서 동작하게 한다.

**Architecture:** DAE는 Blender 5.2가 못 읽으므로 Python(Blender 내장 numpy)으로 직접 스트리밍 파싱해 (1) 의자 위치 점군 `chairs.json`, (2) 의자를 뺀 외형 `shell.obj`를 만든다. 점군을 층·열·구역으로 묶어 기존 스키마의 arc 파라미터로 피팅해 `venue.json`을 쓰고, 외형은 Blender 헤드리스로 감축·Draco glb로 내보낸다. 앱은 `credit` 필드 표시와 Draco 디코더 연결만 바뀐다.

**Tech Stack:** Python 3.13(Blender 내장, numpy 2.x), Blender 5.2 헤드리스(OBJ import, glTF export + Draco), three.js 0.185(GLTFLoader + DRACOLoader), zod 4, Vitest 4.

## Global Constraints

- 스펙: `apps/seatview/docs/superpowers/specs/2026-09-08-kspo-dome-venue-design.md`
- 좌표계: 미터, 원점 = 무대 중앙 바닥, Y 위, 관중석 +Z. arc 각도 0° = +Z, 각도가 커지면 +X(관객이 무대를 볼 때 오른쪽).
- 좌석 좌표는 저장하지 않는다. Box객석·장애인석만 explicit.
- 무대: 1층 16~22구역(슬라이드석) 자리, `size [20, 1.5, 12]`, `facing [0,0,1]`. 16~22구역은 제외.
- 원본 파일은 커밋하지 않는다(`apps/seatview/tools/kspo-dome/work/` gitignore).
- 검증 기준: 구역별 좌석 수 도면 대비 ±5 %, 위치 오차 평균 ≤ 0.3 m·최대 ≤ 1.0 m, `shell.glb` ≤ 8 MB·삼각형 ≤ 30만.
- credit 문자열: `3D 모델: 한국체육산업개발·한국문화정보원 (공공누리 제1유형)`
- 모든 명령은 `apps/seatview`에서 실행한다. Blender Python 경로: `BPY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13`, Blender 실행 파일: `BLENDER=/Applications/Blender.app/Contents/MacOS/Blender`.
- 커밋 메시지 형식은 저장소 관례(`seatview: ...`)를 따르고 끝에 아래 두 줄을 붙인다.
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01TasehGPNhn4J3XxfH72HZq
  ```

## 파일 구조

| 경로 | 역할 |
|---|---|
| `src/core/venue-schema.ts` | `credit` 선택 필드 추가 |
| `src/viewer/venue-page.ts`, `src/viewer/style.css` | infobar에 credit 표시 |
| `src/three/shell-loader.ts` | DRACOLoader 연결 |
| `public/draco/` | three.js 동봉 Draco 디코더 3개 파일 복사 |
| `tools/kspo-dome/README.md` | 실행 순서 |
| `tools/kspo-dome/dae_common.py` | DAE 스트리밍 파서 공용 함수(노드 트리 행렬, 재질/색) |
| `tools/kspo-dome/extract_dae.py` | DAE → `work/chairs.json`, `work/shell.obj`, `work/materials.json` |
| `tools/kspo-dome/analyze_chairs.py` | 점군 → 층·열·각도 클러스터 보고서 + `work/chairs.svg` |
| `tools/kspo-dome/frame.py` | 모델 좌표 → SeatView 좌표 변환(`work/frame.json` 생성·적용) |
| `tools/kspo-dome/fit_sections.py` | `chairs.json` + `sections.json` → `venue.json`, `work/fit-report.txt` |
| `tools/kspo-dome/sections.json` | 구역 정의(손으로 작성, 커밋) |
| `tools/kspo-dome/build_shell.py` | Blender 헤드리스: `shell.obj` → `public/venues/kspo-dome/shell.glb` |
| `tools/kspo-dome/tests/test_*.py` | 파서·피팅 단위 테스트(unittest, `$BPY -m unittest`) |
| `public/venues/kspo-dome/venue.json`, `shell.glb`, `public/venues/index.json` | 산출물 |
| `src/core/kspo-dome.test.ts` | 산출물 검증 테스트 |

DAE 구조(확인됨): `<library_visual_scenes>`가 파일 앞부분(26행~116만 행), 그 뒤 `<library_geometries>`, `<library_materials>`, `<library_effects>`. 단위 인치, Z-up. 노드는 `<node name="group_N|instance_N"><matrix>…</matrix>…</node>`, geometry는 `<vertices>`에 POSITION 소스, `<triangles count material="SYM"><input offset=…/><p>…</p>`. `instance_geometry`의 `bind_material/instance_material symbol → target="#materialId"`. 의자 재질 이름에 `chair` 또는 `charir`가 들어간다.

---

### Task 1: `credit` 필드와 뷰어 표시

**Files:**
- Modify: `src/core/venue-schema.ts` (venueSchema, `shell` 필드 아래)
- Modify: `src/core/venue-schema.test.ts`
- Modify: `src/viewer/venue-page.ts` (`layout()` footer, `load()` 안)
- Modify: `src/viewer/style.css`

**Interfaces:**
- Produces: `Venue.credit?: string`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/core/venue-schema.test.ts` 끝에 추가

```ts
describe('credit', () => {
  it('credit 문자열을 받아들인다', () => {
    const r = validateVenue({ ...minimalVenue(), credit: '3D 모델: 테스트' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.venue.credit).toBe('3D 모델: 테스트')
  })
  it('빈 credit은 거부한다', () => {
    const r = validateVenue({ ...minimalVenue(), credit: '' })
    expect(r.ok).toBe(false)
  })
})
```

파일에 최소 venue를 만드는 헬퍼가 이미 있으면 그 이름을 쓰고, 없으면 파일 상단에 추가한다:

```ts
function minimalVenue() {
  return {
    id: 'v', name: 'V', units: 'm',
    stage: { center: [0, 0, 0], size: [10, 1, 6], facing: [0, 0, 1] },
    sections: [{ id: 'A', shape: { type: 'polygon', points: [[-5, 5], [5, 5], [5, 10], [-5, 10]] }, rows: 2, rowDepth: 1, riser: 0, baseHeight: 0, seatsPerRow: 4 }],
  }
}
```

- [ ] **Step 2: 실패 확인** — `npm test -- venue-schema` → `credit` 테스트 2개 FAIL(strictObject가 알 수 없는 키 거부).

- [ ] **Step 3: 스키마 추가** — `venueSchema`의 `shell:` 줄 아래에

```ts
    credit: z.string().min(1).optional(),
```

- [ ] **Step 4: 통과 확인** — `npm test -- venue-schema` → PASS.

- [ ] **Step 5: 뷰어 표시** — `venue-page.ts` `layout()`의 `<span id="message" class="message"></span>` 앞에 `<span id="credit" class="credit"></span>` 추가. `load()`에서 `document.title = ...` 줄 다음에:

```ts
    $('#credit').textContent = venue.credit ?? ''
```

`style.css` `.message` 규칙 아래에:

```css
.credit { color: #888; font-size: 12px; }
```

모바일 미디어쿼리(`.message { margin-left: 0; width: 100%; }` 옆)에 `.credit { width: 100%; }` 추가.

- [ ] **Step 6: 검증** — `npm run typecheck && npm test` 전부 PASS.

- [ ] **Step 7: 커밋**

```bash
git add src/core/venue-schema.ts src/core/venue-schema.test.ts src/viewer/venue-page.ts src/viewer/style.css
git commit -m "seatview: Add optional venue credit field and show it in the viewer infobar."
```

---

### Task 2: Draco 압축 glb 로더

**Files:**
- Modify: `src/three/shell-loader.ts`
- Create: `public/draco/draco_decoder.js`, `public/draco/draco_decoder.wasm`, `public/draco/draco_wasm_wrapper.js` (복사)

**Interfaces:**
- Produces: `loadShell(url)` 시그니처 변화 없음. Draco 압축 glb도 읽는다.

- [ ] **Step 1: 디코더 복사**

```bash
mkdir -p public/draco
cp node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js public/draco/
ls -la public/draco
```

- [ ] **Step 2: 로더 수정** — `src/three/shell-loader.ts` 전체를

```ts
import type { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { assetUrl } from '../viewer/assets'

let draco: DRACOLoader | null = null

function dracoLoader(): DRACOLoader {
  if (!draco) {
    draco = new DRACOLoader()
    draco.setDecoderPath(assetUrl('draco/'))
  }
  return draco
}

export function loadShell(url: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader())
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}
```

`assetUrl`이 `src/viewer/assets.ts`에 있다. 시그니처 `assetUrl(path: string): string`. `three` 모듈이 아닌 곳(`src/three`)에서 `src/viewer`를 import하는 것이 기존 경계상 어색하면 `assetUrl`을 `src/core/assets.ts`로 옮기고 `src/viewer/assets.ts`에서 re-export한다. (어느 쪽이든 `assets.test.ts`가 계속 통과해야 한다.)

- [ ] **Step 3: 검증** — `npm run typecheck && npm run build` 성공. `dist/draco/draco_decoder.wasm`이 존재.

- [ ] **Step 4: 커밋**

```bash
git add src/three/shell-loader.ts public/draco src/viewer/assets.ts src/core/assets.ts 2>/dev/null
git commit -m "seatview: Load Draco-compressed shell.glb (decoder served from /draco/)."
```

---

### Task 3: DAE 파서 — 의자 점군과 외형 OBJ 추출

**Files:**
- Create: `tools/kspo-dome/README.md`, `tools/kspo-dome/.gitignore`(내용 `work/`)
- Create: `tools/kspo-dome/dae_common.py`
- Create: `tools/kspo-dome/extract_dae.py`
- Create: `tools/kspo-dome/tests/__init__.py`(빈 파일), `tools/kspo-dome/tests/test_extract_dae.py`

**Interfaces:**
- Produces:
  - `work/chairs.json`: `{"units":"m","frame":"model","chairs":[[x,y,z],...]}` 모델 좌표(미터, Z-up), 의자 하나당 좌석 쿠션 바운딩박스 중심.
  - `work/shell.obj`: 의자 재질을 뺀 모든 삼각형, 재질 이름별 `o`/`usemtl` 그룹, 미터, 모델 좌표.
  - `work/materials.json`: `{"재질이름":[r,g,b]}` (0~1).
  - `dae_common.py`: `parse_scene(path) -> Scene`, `iter_geometries(path) -> Iterator[Geometry]`, 아래 dataclass.

- [ ] **Step 1: 원본 준비**

```bash
mkdir -p tools/kspo-dome/work && cd tools/kspo-dome/work
curl -L -A "Mozilla/5.0" -o kspodome_dae.zip https://www.ksponco.or.kr/attachFiles/download/kspo/kspodome_dae.zip
curl -L -A "Mozilla/5.0" -o popimg_acro_seat.jpg https://www.ksponco.or.kr/attachFiles/download/kspo/popimg_acro_seat.jpg
python3 - <<'EOF'
import zipfile, re, os
with zipfile.ZipFile('kspodome_dae.zip') as zf:
    for info in zf.infolist():
        if info.filename.endswith('temp_export.dae') and '_x/' not in info.filename:
            with zf.open(info) as s, open('temp_export.dae', 'wb') as d: d.write(s.read())
EOF
ls -la temp_export.dae   # 475,561,443 bytes
cd ../../..
```

(zip 안 폴더 이름이 cp949라 unzip이 실패한다. 위 스크립트가 필요한 한 파일만 꺼낸다.) 이미 `/private/tmp/claude-501/-Users-charles-1git-try-dabble-apps/b3d154e2-06da-41cb-b9e2-6d18acdedf5f/scratchpad/kspo/`에 받아 둔 것이 있으면 그 `temp_export.dae`와 `popimg_acro_seat.jpg`를 `work/`로 복사해도 된다.

- [ ] **Step 2: 실패하는 테스트 작성** — `tools/kspo-dome/tests/test_extract_dae.py`. 작은 합성 DAE로 파서를 검사한다.

```python
import json, os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dae_common, extract_dae

NS = 'http://www.collada.org/2005/11/COLLADASchema'

def tiny_dae(chair_at_x_inch: float) -> str:
    # 정점 4개짜리 사각형 두 개(삼각형 2개씩). ID_G1은 의자 쿠션(재질 yellow_chair), ID_G2는 벽(재질 wall).
    # 의자 인스턴스는 instance_7 노드 아래에 있고 X로 chair_at_x_inch만큼 옮겨져 있다.
    return f'''<?xml version="1.0"?>
<COLLADA xmlns="{NS}" version="1.4.1">
 <asset><unit meter="0.0254" name="inch"/><up_axis>Z_UP</up_axis></asset>
 <library_visual_scenes><visual_scene id="S">
  <node name="SketchUp">
   <node id="N1" name="group_0"><matrix>1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1</matrix>
    <node id="N2" name="instance_7"><matrix>1 0 0 {chair_at_x_inch} 0 1 0 0 0 0 1 0 0 0 0 1</matrix>
     <node id="N3" name="group_1"><matrix>1 0 0 0 0 1 0 0 0 0 1 10 0 0 0 1</matrix>
      <instance_geometry url="#ID_G1"><bind_material><technique_common>
       <instance_material symbol="Material2" target="#M_CHAIR"/></technique_common></bind_material></instance_geometry>
     </node>
    </node>
    <instance_geometry url="#ID_G2"><bind_material><technique_common>
     <instance_material symbol="Material2" target="#M_WALL"/></technique_common></bind_material></instance_geometry>
   </node>
  </node>
 </visual_scene></library_visual_scenes>
 <library_geometries>
  <geometry id="ID_G1"><mesh>
   <source id="P1"><float_array id="A1" count="12">0 0 0 20 0 0 20 20 0 0 20 0</float_array>
    <technique_common><accessor count="4" source="#A1" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>
   <vertices id="V1"><input semantic="POSITION" source="#P1"/></vertices>
   <triangles count="2" material="Material2"><input offset="0" semantic="VERTEX" source="#V1"/><p>0 1 2 0 2 3</p></triangles>
  </mesh></geometry>
  <geometry id="ID_G2"><mesh>
   <source id="P2"><float_array id="A2" count="12">0 0 0 100 0 0 100 0 100 0 0 100</float_array>
    <technique_common><accessor count="4" source="#A2" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>
   <source id="T2"><float_array id="A3" count="8">0 0 1 0 1 1 0 1</float_array>
    <technique_common><accessor count="4" source="#A3" stride="2"><param name="S" type="float"/><param name="T" type="float"/></accessor></technique_common></source>
   <vertices id="V2"><input semantic="POSITION" source="#P2"/></vertices>
   <triangles count="2" material="Material2"><input offset="0" semantic="VERTEX" source="#V2"/><input offset="1" semantic="TEXCOORD" source="#T2" set="0"/><p>0 0 1 1 2 2 0 0 2 2 3 3</p></triangles>
  </mesh></geometry>
 </library_geometries>
 <library_materials>
  <material id="M_CHAIR" name="yellow_chair__1"><instance_effect url="#E_CHAIR"/></material>
  <material id="M_WALL" name="wall"><instance_effect url="#E_WALL"/></material>
 </library_materials>
 <library_effects>
  <effect id="E_CHAIR"><profile_COMMON><technique sid="COMMON"><lambert><diffuse><color>1 0.8 0 1</color></diffuse></lambert></technique></profile_COMMON></effect>
  <effect id="E_WALL"><profile_COMMON><technique sid="COMMON"><lambert><diffuse><color>0.5 0.5 0.5 1</color></diffuse></lambert></technique></profile_COMMON></effect>
 </library_effects>
</COLLADA>'''

class ExtractTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.dae = os.path.join(self.dir, 't.dae')
        with open(self.dae, 'w') as f: f.write(tiny_dae(100.0))

    def test_scene_collects_instances_with_world_matrix(self):
        scene = dae_common.parse_scene(self.dae)
        self.assertEqual(scene.materials['M_CHAIR'], 'yellow_chair__1')
        self.assertEqual(scene.colors['yellow_chair__1'], [1.0, 0.8, 0.0])
        inst = [i for i in scene.instances if i.geometry_id == 'ID_G1']
        self.assertEqual(len(inst), 1)
        self.assertAlmostEqual(inst[0].matrix[0][3], 100.0)   # X 이동
        self.assertAlmostEqual(inst[0].matrix[2][3], 10.0)    # Z 이동 (group_1)
        self.assertEqual(inst[0].bindings['Material2'], 'M_CHAIR')
        self.assertIsNotNone(inst[0].owner)                    # 가장 가까운 instance_* 조상
        wall = [i for i in scene.instances if i.geometry_id == 'ID_G2'][0]
        self.assertIsNone(wall.owner)

    def test_geometries_use_vertex_offset_only(self):
        geoms = {g.id: g for g in dae_common.iter_geometries(self.dae)}
        self.assertEqual(geoms['ID_G2'].positions.shape, (4, 3))
        self.assertEqual(geoms['ID_G2'].triangles[0].indices.tolist(), [0, 1, 2, 0, 2, 3])
        self.assertEqual(geoms['ID_G2'].triangles[0].symbol, 'Material2')

    def test_extract_writes_chairs_and_obj(self):
        extract_dae.run(self.dae, self.dir)
        chairs = json.load(open(os.path.join(self.dir, 'chairs.json')))
        self.assertEqual(chairs['units'], 'm')
        self.assertEqual(len(chairs['chairs']), 1)
        x, y, z = chairs['chairs'][0]
        self.assertAlmostEqual(x, (100 + 10) * 0.0254, places=4)   # 쿠션 중심 X = 이동 100 + 20/2
        self.assertAlmostEqual(y, 10 * 0.0254, places=4)
        self.assertAlmostEqual(z, 10 * 0.0254, places=4)
        obj = open(os.path.join(self.dir, 'shell.obj')).read()
        self.assertIn('usemtl wall', obj)
        self.assertNotIn('yellow_chair', obj)
        self.assertEqual(obj.count('\nf '), 2)
        self.assertIn('v 2.5400', obj)   # 100 inch → 2.54 m
        mats = json.load(open(os.path.join(self.dir, 'materials.json')))
        self.assertEqual(mats['wall'], [0.5, 0.5, 0.5])

    def test_wide_chair_geometry_is_split_into_seats(self):
        # 폭 3 m(118 inch)짜리 "한 덩어리 의자열"은 0.55 m 간격으로 나뉜다.
        src = tiny_dae(0.0).replace('0 0 0 20 0 0 20 20 0 0 20 0', '0 0 0 118 0 0 118 20 0 0 20 0')
        with open(self.dae, 'w') as f: f.write(src)
        extract_dae.run(self.dae, self.dir)
        chairs = json.load(open(os.path.join(self.dir, 'chairs.json')))['chairs']
        self.assertEqual(len(chairs), round(118 * 0.0254 / 0.55))   # 5
        self.assertTrue(all(abs(c[1] - 10 * 0.0254) < 1e-6 for c in chairs))

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 3: 실패 확인** — `cd tools/kspo-dome && $BPY -m unittest tests.test_extract_dae -v` → ImportError로 FAIL.

- [ ] **Step 4: `dae_common.py` 작성**

```python
"""SketchUp Collada(DAE) 스트리밍 파서. 파일 전체를 메모리에 올리지 않는다."""
from dataclasses import dataclass, field
import xml.etree.ElementTree as ET
import numpy as np

NS = '{http://www.collada.org/2005/11/COLLADASchema}'

def _tag(el):
    return el.tag[len(NS):] if el.tag.startswith(NS) else el.tag

@dataclass
class Instance:
    geometry_id: str
    matrix: np.ndarray            # 4x4 월드 행렬(모델 단위)
    bindings: dict                # symbol -> material id
    owner: int | None             # 가장 가까운 instance_* 조상 노드의 고유 번호(없으면 None)

@dataclass
class Scene:
    unit_meter: float
    instances: list
    materials: dict               # material id -> name
    colors: dict                  # material name -> [r,g,b]

@dataclass
class TriangleBlock:
    symbol: str
    indices: np.ndarray           # 정점 인덱스(3개씩), VERTEX offset만 취함

@dataclass
class Geometry:
    id: str
    positions: np.ndarray         # (N,3) 모델 단위
    triangles: list = field(default_factory=list)

def parse_scene(path):
    """visual_scene의 노드 트리와 materials/effects를 한 번의 스트리밍으로 읽는다. geometry는 건너뛴다."""
    unit = 0.0254
    instances, materials, effects, mat_effect = [], {}, {}, {}
    stack = [np.eye(4)]           # 노드별 누적 행렬
    has_matrix = [True]
    owners = [None]               # 노드별 가장 가까운 instance_* 조상 번호
    counter = 0
    in_geom = False
    for ev, el in ET.iterparse(path, events=('start', 'end')):
        tag = _tag(el)
        if ev == 'start':
            if tag == 'geometry':
                in_geom = True
            elif tag == 'node' and not in_geom:
                name = el.get('name', '')
                owner = owners[-1]
                if name.startswith('instance_'):
                    counter += 1
                    owner = counter
                stack.append(stack[-1]); has_matrix.append(False); owners.append(owner)
            continue
        # end events
        if tag == 'geometry':
            in_geom = False; el.clear(); continue
        if in_geom:
            continue
        if tag == 'unit':
            unit = float(el.get('meter', unit))
        elif tag == 'matrix' and len(stack) > 1 and not has_matrix[-1]:
            m = np.array([float(v) for v in el.text.split()]).reshape(4, 4)
            stack[-1] = stack[-2] @ m
            has_matrix[-1] = True
        elif tag == 'instance_geometry':
            bind = {}
            for im in el.iter(NS + 'instance_material'):
                bind[im.get('symbol')] = im.get('target', '').lstrip('#')
            instances.append(Instance(el.get('url', '').lstrip('#'), stack[-1].copy(), bind, owners[-1]))
            el.clear()
        elif tag == 'node':
            stack.pop(); has_matrix.pop(); owners.pop(); el.clear()
        elif tag == 'material':
            ie = el.find(NS + 'instance_effect')
            materials[el.get('id')] = el.get('name', el.get('id'))
            if ie is not None:
                mat_effect[el.get('id')] = ie.get('url', '').lstrip('#')
            el.clear()
        elif tag == 'effect':
            col = None
            diffuse = el.find(f'.//{NS}diffuse/{NS}color')
            if diffuse is not None:
                col = [float(v) for v in diffuse.text.split()[:3]]
            effects[el.get('id')] = col
            el.clear()
        elif tag in ('float_array', 'source', 'library_images'):
            el.clear()
    colors = {}
    for mid, name in materials.items():
        col = effects.get(mat_effect.get(mid))
        colors[name] = col if col else [0.7, 0.7, 0.7]
    return Scene(unit, instances, materials, colors)

def iter_geometries(path):
    """library_geometries의 geometry를 하나씩 내놓는다."""
    for ev, el in ET.iterparse(path, events=('end',)):
        tag = _tag(el)
        if tag == 'geometry':
            yield _parse_geometry(el)
            el.clear()
        elif tag in ('node', 'visual_scene', 'material', 'effect', 'library_images'):
            el.clear()

def _parse_geometry(el):
    mesh = el.find(NS + 'mesh')
    g = Geometry(el.get('id'), np.zeros((0, 3)))
    if mesh is None:
        return g
    arrays = {}
    for src in mesh.findall(NS + 'source'):
        fa = src.find(NS + 'float_array')
        acc = src.find(f'{NS}technique_common/{NS}accessor')
        if fa is None or acc is None:
            continue
        stride = int(acc.get('stride', 3))
        arrays[src.get('id')] = np.array(fa.text.split(), dtype=np.float64).reshape(-1, stride)
    verts = mesh.find(NS + 'vertices')
    pos_id = None
    for inp in verts.findall(NS + 'input') if verts is not None else []:
        if inp.get('semantic') == 'POSITION':
            pos_id = inp.get('source', '').lstrip('#')
    if pos_id in arrays:
        g.positions = arrays[pos_id][:, :3]
    for tri in mesh.findall(NS + 'triangles'):
        inputs = tri.findall(NS + 'input')
        offsets = [int(i.get('offset', 0)) for i in inputs]
        stride = (max(offsets) + 1) if offsets else 1
        voff = next((int(i.get('offset', 0)) for i in inputs if i.get('semantic') == 'VERTEX'), 0)
        p = tri.find(NS + 'p')
        if p is None or not p.text:
            continue
        idx = np.array(p.text.split(), dtype=np.int64)
        g.triangles.append(TriangleBlock(tri.get('material', ''), idx[voff::stride]))
    return g

def transform_points(matrix, pts):
    """(N,3) 점에 4x4 행렬 적용."""
    return pts @ matrix[:3, :3].T + matrix[:3, 3]

def is_chair_material(name):
    n = name.lower()
    return 'chair' in n or 'charir' in n
```

- [ ] **Step 5: `extract_dae.py` 작성**

```python
"""DAE → work/chairs.json + work/shell.obj + work/materials.json
사용: $BPY extract_dae.py work/temp_export.dae work/
"""
import json, os, sys, time
from collections import defaultdict
import numpy as np
import dae_common as dc

SEAT_PITCH = 0.55   # 한 geometry가 이보다 넓으면 여러 좌석으로 나눈다(m)

def run(dae_path, out_dir):
    t0 = time.time()
    scene = dc.parse_scene(dae_path)
    unit = scene.unit_meter
    by_geom = defaultdict(list)
    for inst in scene.instances:
        by_geom[inst.geometry_id].append(inst)
    print(f'scene: {len(scene.instances)} instances, {len(scene.materials)} materials, {time.time()-t0:.1f}s', flush=True)

    # 재질별 OBJ 버퍼
    obj_verts = defaultdict(list)     # name -> list of (N,3) arrays
    obj_faces = defaultdict(list)     # name -> list of (M,3) index arrays (0-based, 버퍼 내 상대)
    obj_count = defaultdict(int)
    # 의자: owner(컴포넌트 인스턴스)별 바운딩박스
    chair_min, chair_max = {}, {}
    orphan_chairs = []                # owner가 없는 의자 geometry는 자체 bbox 사용

    n_geom = 0
    for geom in dc.iter_geometries(dae_path):
        n_geom += 1
        insts = by_geom.get(geom.id)
        if not insts or geom.positions.shape[0] == 0:
            continue
        for inst in insts:
            world = dc.transform_points(inst.matrix, geom.positions) * unit
            for block in geom.triangles:
                mid = inst.bindings.get(block.symbol, '')
                name = scene.materials.get(mid, 'default')
                idx = block.indices
                if idx.size == 0:
                    continue
                if dc.is_chair_material(name):
                    pts = world[np.unique(idx)]
                    lo, hi = pts.min(0), pts.max(0)
                    key = inst.owner
                    if key is None:
                        orphan_chairs.append((lo, hi))
                    elif key in chair_min:
                        chair_min[key] = np.minimum(chair_min[key], lo)
                        chair_max[key] = np.maximum(chair_max[key], hi)
                    else:
                        chair_min[key], chair_max[key] = lo, hi
                else:
                    used = np.unique(idx)
                    remap = np.full(geom.positions.shape[0], -1, dtype=np.int64)
                    remap[used] = np.arange(used.size)
                    obj_verts[name].append(world[used])
                    obj_faces[name].append(remap[idx].reshape(-1, 3) + obj_count[name])
                    obj_count[name] += used.size
        if n_geom % 10000 == 0:
            print(f'  {n_geom} geometries, {time.time()-t0:.1f}s', flush=True)

    chairs = []
    boxes = list(zip(chair_min.values(), chair_max.values())) + orphan_chairs
    for lo, hi in boxes:
        chairs.extend(split_box(lo, hi))
    chairs.sort()
    with open(os.path.join(out_dir, 'chairs.json'), 'w') as f:
        json.dump({'units': 'm', 'frame': 'model', 'chairs': [[round(float(v), 4) for v in c] for c in chairs]}, f)
    print(f'chairs: {len(chairs)} (from {len(boxes)} chair boxes)', flush=True)

    with open(os.path.join(out_dir, 'shell.obj'), 'w') as f:
        f.write('# KSPO DOME shell, metres, model frame (Z-up)\n')
        base = 0
        total_faces = 0
        for name in sorted(obj_verts):
            V = np.vstack(obj_verts[name])
            F = np.vstack(obj_faces[name]) + base + 1
            safe = ''.join(ch if ch.isalnum() or ch in '_-' else '_' for ch in name)
            f.write(f'o {safe}\nusemtl {safe}\n')
            np.savetxt(f, V, fmt='v %.4f %.4f %.4f')
            np.savetxt(f, F, fmt='f %d %d %d')
            base += V.shape[0]
            total_faces += F.shape[0]
    print(f'shell.obj: {base} vertices, {total_faces} faces', flush=True)

    safe_colors = {}
    for name, col in scene.colors.items():
        safe = ''.join(ch if ch.isalnum() or ch in '_-' else '_' for ch in name)
        safe_colors[safe] = [round(c, 4) for c in col]
    with open(os.path.join(out_dir, 'materials.json'), 'w') as f:
        json.dump(safe_colors, f, ensure_ascii=False, indent=1)
    print(f'done in {time.time()-t0:.1f}s', flush=True)

def split_box(lo, hi):
    """바운딩박스 하나를 좌석 중심 목록으로. 수평 최장변이 SEAT_PITCH보다 길면 등간격으로 나눈다."""
    center = (lo + hi) / 2
    ext = hi - lo
    axis = 0 if ext[0] >= ext[1] else 1
    n = max(1, round(float(ext[axis]) / SEAT_PITCH))
    if n == 1:
        return [center.tolist()]
    out = []
    for i in range(n):
        c = center.copy()
        c[axis] = lo[axis] + (i + 0.5) * ext[axis] / n
        out.append(c.tolist())
    return out

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2])
```

- [ ] **Step 6: 테스트 통과 확인** — `cd tools/kspo-dome && $BPY -m unittest tests.test_extract_dae -v` → 4개 PASS. `test_wide_chair_geometry_is_split_into_seats`의 기대값 5는 `round(2.9972/0.55)=5`다.

- [ ] **Step 7: 실제 파일로 실행**

```bash
cd tools/kspo-dome && $BPY extract_dae.py work/temp_export.dae work/ 2>&1 | tail -8
ls -la work/chairs.json work/shell.obj work/materials.json
$BPY -c "import json;c=json.load(open('work/chairs.json'))['chairs'];import numpy as np;P=np.array(c);print(len(c),P.min(0).round(2),P.max(0).round(2))"
```

기대: 의자 11,000~14,500개, x·y 범위 각각 약 85~95 m, z 0~15 m. shell.obj 면 수는 약 200만. 실행이 10분을 넘기면 `np.savetxt` 대신 `'\n'.join()`으로 바꾼다. 결과 수치를 `work/extract.log`에 남긴다.

- [ ] **Step 8: README와 gitignore**

`tools/kspo-dome/.gitignore`: `work/`

`tools/kspo-dome/README.md`:

```markdown
# KSPO DOME 변환 도구

원본: https://www.ksponco.or.kr/attachFiles/download/kspo/kspodome_dae.zip (공공누리 제1유형, 한국체육산업개발·한국문화정보원).
Blender 5.2에는 Collada 임포터가 없어 DAE를 직접 파싱한다. 모든 스크립트는 Blender 내장 Python으로 실행한다.

    BPY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
    BLENDER=/Applications/Blender.app/Contents/MacOS/Blender

1. `work/`에 zip을 풀어 `temp_export.dae`를 둔다 (zip 안 폴더명이 cp949라 Python zipfile로 꺼낸다).
2. `$BPY extract_dae.py work/temp_export.dae work/` → `chairs.json`, `shell.obj`, `materials.json`
3. `$BPY analyze_chairs.py work/` → `work/chairs.svg`, 층·열·구역 클러스터 보고서
4. `$BPY frame.py work/ --stage-angle <deg> --stage-radius <m>` → `work/frame.json`
5. `$BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json` → venue.json + `work/fit-report.txt`
6. `$BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb`
7. `$BPY -m unittest discover -s tests -v`
```

- [ ] **Step 9: 커밋**

```bash
git add tools/kspo-dome/README.md tools/kspo-dome/.gitignore tools/kspo-dome/dae_common.py tools/kspo-dome/extract_dae.py tools/kspo-dome/tests
git commit -m "seatview: Stream-parse the KSPO DOME Collada file into a chair point cloud and a chair-free shell OBJ."
```

---

### Task 4: 점군 분석과 좌표계(frame)

**Files:**
- Create: `tools/kspo-dome/analyze_chairs.py`
- Create: `tools/kspo-dome/frame.py`
- Create: `tools/kspo-dome/tests/test_frame.py`

**Interfaces:**
- Produces:
  - `frame.py`: `fit_circle(xy) -> (cx, cy, R)`, `arena_center(chairs_model) -> (cx, cy)`(가장 점이 많은 높이 띠의 의자 고리에 원 피팅), `make_frame(chairs_model, stage_angle_deg, stage_radius_m, floor_z=0.0) -> dict`, `apply_frame(frame, pts_model) -> pts_seatview` ((N,3) → (N,3) SeatView 좌표 [x, y(높이), z]), `load_frame(work_dir)`, `load_chairs(work_dir, materials=None) -> (N,3)`, `load_chairs_with_materials(work_dir) -> ((N,3), (N,) str)`. `frame.json`: `{"center_model":[cx,cy], "stage_angle_deg":A, "stage_radius_m":R, "floor_z":f, "materials":[...]}`.
- Consumes: `work/chairs.json`은 `{"units","frame","chairs":[[x,y,z],...],"materials":[name,...]}` — `materials`는 `chairs`와 같은 길이의 병렬 목록(Task 3 fix round 4). 좌석 재질은 `chair_orange`(2·3층 일부), `yellow_chair__1`(1층 1~4·12~15), `yellow_chair__3`(장애인석 84), `red_charir`(Box객석 121). `chair_1`은 팔걸이·레일이므로 항상 제외한다. 모델에는 슬라이드석(1층 5~11, 16~22)이 접혀 있어 의자가 없고 2·3층도 일부 구역만 의자가 있다.
  - SeatView 각도: `angle_deg(pts_sv, center_sv)` = `degrees(atan2(x - cx, z - cz))`, 아레나 중심 `center_sv = [0, R]` (2D [x, z]).

- [ ] **Step 1: 실패하는 테스트** — `tests/test_frame.py`

```python
import os, sys, unittest
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import frame as fr

class FrameTest(unittest.TestCase):
    def test_stage_direction_maps_to_minus_z_and_center_to_plus_z(self):
        # 모델: 아레나 중심 (100, 50), 무대는 중심에서 각도 90°(=+X 방향) 40 m 지점
        # 의자는 반지름 30 m 원 위 한 열(같은 높이)에 있되 한쪽(각도 0~120°)만 있어 평균은 중심에서 벗어난다
        t = np.radians(np.arange(0, 121, 5))
        chairs = np.column_stack([100 + 30 * np.cos(t), 50 + 30 * np.sin(t), np.full(t.size, 1.0)])
        f = fr.make_frame(chairs, stage_angle_deg=90, stage_radius_m=40, floor_z=0.0)
        self.assertAlmostEqual(f['center_model'][0], 100); self.assertAlmostEqual(f['center_model'][1], 50)
        sv = fr.apply_frame(f, np.array([[140.0, 50.0, 0.0], [100.0, 50.0, 2.0], [60.0, 50.0, 0.0]]))
        np.testing.assert_allclose(sv[0], [0, 0, 0], atol=1e-9)        # 무대 중앙 → 원점
        np.testing.assert_allclose(sv[1], [0, 2, 40], atol=1e-9)       # 아레나 중심 → (0, 높이2, +40)
        np.testing.assert_allclose(sv[2], [0, 0, 80], atol=1e-9)       # 무대 반대편 → +Z 멀리
        # 무대를 보고 오른쪽(+X_sv)은 모델에서 어느 쪽인지: 각도 90°에서 시계 방향으로 90° 더 간 180°(-Y 방향)
        right = fr.apply_frame(f, np.array([[100.0, 50.0 - 30.0, 0.0]]))[0]
        self.assertGreater(right[0], 0)

    def test_fit_circle_recovers_centre_and_radius(self):
        t = np.radians(np.arange(0, 360, 10))
        cx, cy, R = fr.fit_circle(np.column_stack([5 + 12 * np.cos(t), -3 + 12 * np.sin(t)]))
        self.assertAlmostEqual(cx, 5.0, places=6); self.assertAlmostEqual(cy, -3.0, places=6); self.assertAlmostEqual(R, 12.0, places=6)

    def test_angle_deg_zero_faces_stage(self):
        pts = np.array([[0, 0, 80.0], [10, 0, 40.0], [-10, 0, 40.0]])
        a = fr.angle_deg(pts, [0, 40])
        np.testing.assert_allclose(a, [0, 90, -90], atol=1e-9)

    def test_load_chairs_filters_by_material(self):
        import json, os, tempfile
        d = tempfile.mkdtemp()
        json.dump({'units': 'm', 'frame': 'model', 'chairs': [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
                   'materials': ['chair_orange', 'chair_1', 'red_charir']}, open(os.path.join(d, 'chairs.json'), 'w'))
        self.assertEqual(fr.load_chairs(d).shape, (3, 3))
        self.assertEqual(fr.load_chairs(d, ['chair_orange', 'red_charir'])[:, 0].tolist(), [0.0, 2.0])
        P, m = fr.load_chairs_with_materials(d)
        self.assertEqual(m.tolist(), ['chair_orange', 'chair_1', 'red_charir'])

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: 실패 확인** — `$BPY -m unittest tests.test_frame -v` → ImportError FAIL.

- [ ] **Step 3: `frame.py` 작성**

```python
"""모델 좌표(m, Z-up) → SeatView 좌표(m, Y-up, 무대 원점, 관중석 +Z).
사용: $BPY frame.py work/ --stage-angle A --stage-radius R [--floor-z F]
모델 각도 규약: theta = atan2(x - cx, y - cy) (deg), 0° = 모델 +Y.
"""
import argparse, json, os
import numpy as np

def fit_circle(xy):
    """Kasa 대수 원 피팅: (cx, cy, R). 점들이 한 원 위에 있을 때 최소제곱 해."""
    xy = np.asarray(xy, dtype=np.float64)
    A = np.column_stack([2 * xy[:, 0], 2 * xy[:, 1], np.ones(len(xy))])
    b = (xy ** 2).sum(1)
    sol = np.linalg.lstsq(A, b, rcond=None)[0]
    cx, cy = sol[0], sol[1]
    return float(cx), float(cy), float(np.sqrt(sol[2] + cx * cx + cy * cy))

def arena_center(chairs_model):
    """아레나 중심. 의자 평균은 구역이 빠진 쪽으로 끌려가므로(이 모델에서 8 m) 쓰지 않는다.
    가장 많은 점이 있는 높이 띠(±0.1 m)의 의자 = 한 열 고리에 원을 맞춘다."""
    P = np.asarray(chairs_model, dtype=np.float64)
    z = P[:, 2]
    hist, edges = np.histogram(z, bins=np.arange(z.min(), z.max() + 0.2, 0.2))
    zc = edges[hist.argmax()] + 0.1
    band = P[np.abs(z - zc) < 0.1]
    cx, cy, _ = fit_circle(band[:, :2])
    return cx, cy

def make_frame(chairs_model, stage_angle_deg, stage_radius_m, floor_z=0.0):
    cx, cy = arena_center(chairs_model)
    return {'center_model': [cx, cy], 'stage_angle_deg': float(stage_angle_deg),
            'stage_radius_m': float(stage_radius_m), 'floor_z': float(floor_z)}

def _rot(frame):
    """모델 XY를 회전해 무대 방향이 +Y가 되게 하는 2x2 행렬."""
    a = np.radians(frame['stage_angle_deg'])
    # theta' = theta - A. theta = atan2(x, y)이므로 (x,y)를 -A만큼 회전: x' = x cosA - y sinA, y' = x sinA + y cosA
    return np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])

def apply_frame(frame, pts_model):
    P = np.asarray(pts_model, dtype=np.float64)
    c = np.array(frame['center_model'])
    xy = (P[:, :2] - c) @ _rot(frame).T            # 무대 방향 = +Y
    xy[:, 1] -= frame['stage_radius_m']            # 무대 중앙 → 원점
    z = P[:, 2] - frame['floor_z']
    # Blender/모델(Z-up, 무대 방향 +Y) → SeatView(Y-up, 관중석 +Z): x_sv = x, y_sv = z, z_sv = -y
    return np.column_stack([xy[:, 0], z, -xy[:, 1]])

def angle_deg(pts_sv, center_sv):
    P = np.asarray(pts_sv)
    return np.degrees(np.arctan2(P[:, 0] - center_sv[0], P[:, 2] - center_sv[1]))

def load_frame(work_dir):
    return json.load(open(os.path.join(work_dir, 'frame.json')))

def load_chairs_with_materials(work_dir):
    """(N,3) 모델 좌표와 (N,) 재질 이름. chairs.json의 materials는 chairs와 같은 길이의 병렬 목록이다."""
    d = json.load(open(os.path.join(work_dir, 'chairs.json')))
    return np.array(d['chairs'], dtype=np.float64), np.array(d['materials'])

def load_chairs(work_dir, materials=None):
    """materials(이름 목록)를 주면 그 재질의 의자만 돌려준다. 좌석이 아닌 팔걸이(chair_1)를 빼는 데 쓴다."""
    P, mats = load_chairs_with_materials(work_dir)
    if materials:
        P = P[np.isin(mats, list(materials))]
    return P

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('work'); ap.add_argument('--stage-angle', type=float, required=True)
    ap.add_argument('--stage-radius', type=float, required=True); ap.add_argument('--floor-z', type=float, default=0.0)
    ap.add_argument('--materials', default='chair_orange,yellow_chair__1,yellow_chair__3,red_charir',
                    help='좌석으로 볼 재질 이름(쉼표 구분). frame.json에 저장되어 뒤 단계가 같은 값을 쓴다')
    a = ap.parse_args()
    mats = [m for m in a.materials.split(',') if m]
    f = make_frame(load_chairs(a.work, mats), a.stage_angle, a.stage_radius, a.floor_z)
    f['materials'] = mats
    json.dump(f, open(os.path.join(a.work, 'frame.json'), 'w'), indent=1)
    sv = apply_frame(f, load_chairs(a.work, mats))
    print('frame.json written', f)
    print('seatview bbox min', sv.min(0).round(2), 'max', sv.max(0).round(2))
```

- [ ] **Step 4: 통과 확인** — `$BPY -m unittest tests.test_frame -v` → 4개 PASS. (첫 테스트의 "오른쪽" 단언이 실패하면 `_rot`의 부호가 뒤집힌 것이다. 규약을 바꾸지 말고 행렬을 고친다.)

- [ ] **Step 5: `analyze_chairs.py` 작성** — 모델 좌표 점군을 층·열·각도 덩어리로 요약하고 SVG 평면도를 만든다.

```python
"""chairs.json 요약: 층(z), 열(반경), 각도 덩어리(통로로 나뉜 구역 후보). 사용: $BPY analyze_chairs.py work/ [--frame]
--frame을 주면 frame.json을 적용해 SeatView 좌표·각도로 보고한다(없으면 모델 좌표, 각도 0° = 모델 +Y)."""
import argparse, json, os
import numpy as np
import frame as fr

TIER_GAP = 1.5      # 이보다 큰 z 간격이면 층이 바뀐다(m)
ROW_GAP = 0.35      # 이보다 큰 반경 간격이면 열이 바뀐다(m)
AISLE_DEG = 1.0     # 이 각도만큼 빈 구간이면 통로

def clusters_1d(values, gap):
    """정렬된 1차원 값들을 gap보다 큰 틈에서 나눈다. 각 덩어리의 (min, max, count) 목록."""
    v = np.sort(values)
    if v.size == 0:
        return []
    cuts = np.where(np.diff(v) > gap)[0] + 1
    out = []
    for part in np.split(v, cuts):
        out.append((float(part[0]), float(part[-1]), int(part.size)))
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('work'); ap.add_argument('--frame', action='store_true')
    ap.add_argument('--materials', default='chair_orange,yellow_chair__1,yellow_chair__3,red_charir')
    a = ap.parse_args()
    mats = [m for m in a.materials.split(',') if m]
    P, allm = fr.load_chairs_with_materials(a.work)
    keep = np.isin(allm, mats); P, allm = P[keep], allm[keep]
    print('materials:', {m: int((allm == m).sum()) for m in mats})
    if a.frame:
        f = fr.load_frame(a.work)
        S = fr.apply_frame(f, P)
        center = [0.0, f['stage_radius_m']]
        x, h, z = S[:, 0], S[:, 1], S[:, 2]
        r = np.hypot(x - center[0], z - center[1]); ang = fr.angle_deg(S, center)
    else:
        c = P[:, :2].mean(0)
        x, z, h = P[:, 0] - c[0], P[:, 1] - c[1], P[:, 2]
        r = np.hypot(x, z); ang = np.degrees(np.arctan2(x, z))
    print(f'{len(P)} chairs; height {h.min():.2f}..{h.max():.2f}; radius {r.min():.1f}..{r.max():.1f}')
    tiers = clusters_1d(h, TIER_GAP)
    for ti, (lo, hi, n) in enumerate(tiers):
        m = (h >= lo) & (h <= hi)
        rows = clusters_1d(r[m], ROW_GAP)
        print(f'\n== tier {ti}: height {lo:.2f}..{hi:.2f}, {n} chairs, {len(rows)} rows, radius {r[m].min():.1f}..{r[m].max():.1f}')
        # 각도 덩어리(통로): 0.25° 격자로 점유 여부를 보고 AISLE_DEG 이상 비면 자른다
        bins = np.zeros(1440, dtype=bool)
        bins[((ang[m] + 180) / 0.25).astype(int) % 1440] = True
        empty_run = 0; starts = []; occupied = False; start = None
        for i in range(1441):
            occ = bins[i % 1440]
            if occ and not occupied:
                occupied = True; start = i
            elif not occ and occupied:
                occupied = False; starts.append((start, i))
        blocks = []
        for s, e in starts:
            a0, a1 = s * 0.25 - 180, e * 0.25 - 180
            if blocks and a0 - blocks[-1][1] < AISLE_DEG:
                blocks[-1][1] = a1
            else:
                blocks.append([a0, a1])
        for bi, (a0, a1) in enumerate(blocks):
            mm = m & (ang >= a0) & (ang < a1)
            rows_b = clusters_1d(r[mm], ROW_GAP)
            by_mat = ','.join(f'{k}={int((allm[mm] == k).sum())}' for k in mats if (allm[mm] == k).any())
            print(f'  block {bi:2d}: angle {a0:7.2f}..{a1:7.2f}  chairs {mm.sum():5d}  rows {len(rows_b):2d}  '
                  f'r {r[mm].min():.1f}..{r[mm].max():.1f}  h {h[mm].min():.2f}..{h[mm].max():.2f}  {by_mat}')
    # SVG 평면도
    W = 1400; scale = W / (r.max() * 2.2)
    def sx(v): return W / 2 + v * scale
    def sy(v): return W / 2 - v * scale
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" style="background:#fff">']
    for ti, (lo, hi, _) in enumerate(tiers):
        m = (h >= lo) & (h <= hi)
        for px, pz in zip(x[m], z[m]):
            parts.append(f'<circle cx="{sx(px):.1f}" cy="{sy(pz):.1f}" r="1.2" fill="{colors[ti % 5]}"/>')
    for d in range(0, 360, 30):
        t = np.radians(d)
        parts.append(f'<line x1="{sx(0)}" y1="{sy(0)}" x2="{sx(np.sin(t)*r.max()*1.05):.1f}" y2="{sy(np.cos(t)*r.max()*1.05):.1f}" stroke="#ccc"/>')
        parts.append(f'<text x="{sx(np.sin(t)*r.max()*1.08):.1f}" y="{sy(np.cos(t)*r.max()*1.08):.1f}" font-size="14" fill="#666">{d if d <= 180 else d - 360}°</text>')
    parts.append('</svg>')
    open(os.path.join(a.work, 'chairs.svg'), 'w').write('\n'.join(parts))
    print('\nwrote chairs.svg (x right, z(or model y) up; tiers coloured)')

if __name__ == '__main__':
    main()
```

- [ ] **Step 6: 분석 실행과 무대 방향 결정**

```bash
cd tools/kspo-dome && $BPY analyze_chairs.py work/ | tee work/analyze-model.txt
```

`work/chairs.svg`를 PNG로 바꿔(`/Applications/Blender.app/Contents/MacOS/Blender`가 필요 없다. `qlmanage -t -s 1400 -o work work/chairs.svg` 또는 브라우저) `work/popimg_acro_seat.jpg`(좌석배치도)와 나란히 본다. 결정할 것:

1. **무대 각도 A(모델 좌표, 0° = 모델 +Y, 시계 방향 +)**: 좌석배치도에서 1층 16~22구역(왼쪽, 7개 구역이 가장 깊은 블록)과 Box객석(오른쪽 위·아래 바깥)의 위치를 SVG의 덩어리 패턴과 맞춰, 16~22구역 블록 중앙 방향을 A로 정한다. 모델에 16~22구역 의자가 펼쳐진 상태로 들어 있으면 그 블록의 각도 중앙, 접혀 있으면 1층 고리에서 가장 넓게 비는 각도 범위의 중앙이다.
2. **무대 반경 R**: 아레나는 원형이다(2·3층 orange 열과 1층 yellow 열 모두 같은 중심의 원호, 잔차 < 0.1 m). 무대 뒷면이 1층 첫 열보다 2 m 안쪽에 오도록 `R = (1층 첫 열 반경) - 2 - 6` (무대 깊이 12의 절반). 1층 첫 열 반경은 `yellow_chair__1`의 가장 낮은 열(z 최소 ±0.06)을 `arena_center`에 원 피팅한 R이다(약 24.3 m). 소수 첫째 자리까지.
3. **바닥 높이 F**: 모델에서 아레나 바닥 z. 1층 첫 열 의자 높이 − 0.45(의자 쿠션 높이)가 0에 가까우면 0, 아니면 그 값.

```bash
$BPY frame.py work/ --stage-angle <A> --stage-radius <R> --floor-z <F>
$BPY analyze_chairs.py work/ --frame | tee work/analyze-seatview.txt
```

`--frame` 보고서에서 확인할 것: `yellow_chair__1` 블록 8개(1층 1~4, 12~15)가 각도 ±90° 근처 양쪽에 4개씩, `red_charir`(Box객석)가 5~11구역 쪽(각도 0° 근처의 바깥 고리)에, `yellow_chair__3`(장애인석)가 0° 근처 안쪽에 있어야 한다. 무대 방향(A)은 1층 의자가 없는 두 틈(접힌 슬라이드석 5~11과 16~22) 중 Box객석·장애인석의 **반대쪽**이다. Box객석이 있는 쪽이 각도 양수·음수 어느 쪽인지가 좌석배치도(무대를 보고 오른쪽 = +)와 맞는지도 확인한다. 안 맞으면 A를 180° 돌리거나 좌우가 뒤집힌 것이므로 `frame.py`가 아니라 A를 다시 본다(회전만으로 좌우 반전은 못 고친다. 좌우가 뒤집혔다면 좌석배치도를 뒤집어 본 것이다).

결정한 A, R, F와 근거를 `work/frame-notes.txt`에 적고, 같은 내용을 `tools/kspo-dome/README.md` 끝에 "결정값" 절로 남긴다(작업 폴더는 커밋되지 않으므로).

- [ ] **Step 7: 커밋**

```bash
git add tools/kspo-dome/analyze_chairs.py tools/kspo-dome/frame.py tools/kspo-dome/tests/test_frame.py tools/kspo-dome/README.md
git commit -m "seatview: Chair-cloud analysis and model-to-SeatView frame for KSPO DOME."
```

---

### Task 5: 구역 피팅 → venue.json

**Files:**
- Create: `tools/kspo-dome/fit_sections.py`
- Create: `tools/kspo-dome/sections.json`
- Create: `tools/kspo-dome/tests/test_fit_sections.py`
- Create: `public/venues/kspo-dome/venue.json` (생성물)

**Interfaces:**
- Consumes: `frame.py`의 `load_chairs_with_materials`, `load_frame`, `apply_frame`, `angle_deg`; `analyze_chairs.clusters_1d`. `frame.json`의 `materials`.
- Produces: `fit_sections.py`: `fit_arc(section_cfg, pts_sv, center_sv) -> (section_dict, report_dict)`, `place_arc(section_dict) -> (N,3)`(seat-engine의 arcPlacer를 그대로 옮긴 것), `template_section(cfg, base_section) -> section_dict`(모델에 의자가 없는 구역을 본뜨기), `explicit_section(cfg, pts, center)`, `run(work, sections_path, out_path)`.
- 모델에 의자가 없는 구역(슬라이드석 5~11, 2·3층 일부)은 `"like": "<구역 id>"`로 같은 층의 피팅된 구역을 본뜬다: rows·rowDepth·riser·baseHeight·radiusStart·center를 복사하고 각도 범위는 자기 것, `seatsPerRow`는 base의 열별 좌석 비율을 `expected`에 맞춰 늘려 쓴다(고르게 나누면 base의 부채꼴이 사라지므로 최종 구현에서 바꿨다. 내림 후 나머지는 소수부가 큰 열부터 1석씩).
- `sections.json` 형식:

```json
{
  "id": "kspo-dome",
  "name": "KSPO DOME (올림픽 체조경기장)",
  "credit": "3D 모델: 한국체육산업개발·한국문화정보원 (공공누리 제1유형)",
  "stage": { "size": [20, 1.5, 12] },
  "seatMaterials": ["chair_orange", "yellow_chair__1", "yellow_chair__3", "red_charir"],
  "tiers": [ { "hMin": -0.5, "hMax": 6.0 }, { "hMin": 6.0, "hMax": 30.0 } ],
  "arcs": [
    { "id": "1", "label": "1층 1구역", "tier": 0, "angleStart": -110.0, "angleEnd": -97.0, "expected": 282, "material": "yellow_chair__1" },
    { "id": "5", "label": "1층 5구역", "tier": 0, "angleStart": -40.0, "angleEnd": -29.0, "expected": 292, "like": "4" }
  ],
  "explicit": [
    { "id": "BOX-1", "label": "Box객석 1", "tier": 1, "angleStart": 60.0, "angleEnd": 66.0, "material": "red_charir", "expected": 14 },
    { "id": "WHEEL", "label": "장애인석", "tier": 0, "angleStart": -60.0, "angleEnd": 60.0, "material": "yellow_chair__3", "expected": 84 }
  ],
  "floor": [
    { "id": "FLOOR-D", "label": "플로어 D (공연별 상이)", "x": [-18, -6], "z": [10, 34] },
    { "id": "FLOOR-C", "label": "플로어 C (공연별 상이)", "x": [-5.5, 5.5], "z": [10, 34] },
    { "id": "FLOOR-B", "label": "플로어 B (공연별 상이)", "x": [6, 18], "z": [10, 34] }
  ]
}
```

`angleStart/End`는 SeatView 각도(0° = 무대 정면, 오른쪽 +). `tier`는 `tiers` 배열 인덱스(높이 범위로 의자를 고른다). `rMin`/`rMax`(선택)는 같은 각도 범위의 다른 고리 의자를 빼기 위한 반경 한계. `material`(선택)은 그 재질의 의자만 고른다. `like`(선택)는 의자가 없는 구역을 본뜰 구역 id(같은 목록에서 먼저 나와야 한다). `seatMaterials`에 없는 재질(`chair_1` 팔걸이)은 처음부터 버린다.

- [ ] **Step 1: 실패하는 테스트** — `tests/test_fit_sections.py`. 합성 arc 점군을 만들어 파라미터가 복원되는지 본다.

```python
import os, sys, unittest
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fit_sections as fs

def synth_arc(center, radius0, row_depth, riser, base_h, a0, a1, seats_per_row):
    """seat-engine arcPlacer와 같은 규칙으로 의자 점을 만든다."""
    pts = []
    span = a1 - a0
    for r, n in enumerate(seats_per_row):
        radius = radius0 + (r + 0.5) * row_depth
        for s in range(n):
            a = np.radians(a0 + (s + 0.5) / n * span)
            pts.append([center[0] + radius * np.sin(a), base_h + r * riser, center[1] + radius * np.cos(a)])
    return np.array(pts)

class FitTest(unittest.TestCase):
    def test_recovers_arc_parameters(self):
        center = [0.0, 40.0]
        pts = synth_arc(center, 30.0, 0.9, 0.4, 1.5, -20.0, 10.0, [20, 21, 22, 23])
        cfg = {'id': '5', 'label': '1층 5구역', 'tier': 0, 'angleStart': -25, 'angleEnd': 15, 'expected': 86}
        sec, rep = fs.fit_arc(cfg, pts, center)
        self.assertEqual(sec['rows'], 4)
        self.assertEqual(sec['seatsPerRow'], [20, 21, 22, 23])
        self.assertAlmostEqual(sec['rowDepth'], 0.9, places=2)
        self.assertAlmostEqual(sec['riser'], 0.4, places=2)
        self.assertAlmostEqual(sec['baseHeight'], 1.5, places=2)
        self.assertAlmostEqual(sec['shape']['radiusStart'], 30.0, places=1)
        self.assertAlmostEqual(sec['shape']['angleStart'], -20.0, places=1)
        self.assertAlmostEqual(sec['shape']['angleEnd'], 10.0, places=1)
        self.assertLess(rep['meanErr'], 0.05)
        self.assertLess(rep['maxErr'], 0.1)
        self.assertEqual(rep['count'], 86)

    def test_place_arc_matches_engine_rule(self):
        sec = {'id': 'x', 'shape': {'type': 'arc', 'center': [0, 40], 'radiusStart': 30, 'angleStart': 0, 'angleEnd': 90},
               'rows': 1, 'rowDepth': 1.0, 'riser': 0.0, 'baseHeight': 2.0, 'seatsPerRow': [2]}
        P = fs.place_arc(sec)
        np.testing.assert_allclose(P[0], [30.5 * np.sin(np.radians(22.5)), 2.0, 40 + 30.5 * np.cos(np.radians(22.5))], atol=1e-9)

    def test_template_section_copies_rows_and_splits_expected(self):
        base = {'id': '4', 'label': '1층 4구역', 'shape': {'type': 'arc', 'center': [0, 40], 'radiusStart': 30.0, 'angleStart': -60.0, 'angleEnd': -50.0},
                'rows': 4, 'rowDepth': 0.9, 'riser': 0.4, 'baseHeight': 1.5, 'seatsPerRow': [20, 21, 22, 23]}
        sec = fs.template_section({'id': '5', 'label': '1층 5구역', 'angleStart': -49.0, 'angleEnd': -39.0, 'expected': 90}, base)
        self.assertEqual(sec['id'], '5')
        self.assertEqual(sec['rows'], 4)
        self.assertEqual(sec['seatsPerRow'], [22, 22, 23, 23])       # 90 = 22*4 + 2, 나머지는 뒷열부터
        self.assertEqual(sec['shape']['angleStart'], -49.0)
        self.assertEqual(sec['shape']['radiusStart'], 30.0)
        self.assertEqual(base['shape']['angleStart'], -60.0)          # 원본은 그대로

    def test_explicit_rows_are_front_to_back_and_left_to_right(self):
        pts = np.array([[1.0, 5.0, 60.0], [-1.0, 5.0, 60.0], [0.0, 5.4, 61.0]])   # 앞열 2석(각도 순), 뒷열 1석
        sec = fs.explicit_section({'id': 'BOX-1', 'label': 'Box객석 1'}, pts, [0.0, 40.0])
        self.assertEqual([(s['row'], s['seat']) for s in sec['seats']], [('1', 1), ('1', 2), ('2', 1)])
        self.assertEqual(sec['seats'][0]['position'][0], -1.0)   # 왼쪽(-X)이 1번

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: 실패 확인** — `$BPY -m unittest tests.test_fit_sections -v` → ImportError FAIL.

- [ ] **Step 3: `fit_sections.py` 작성**

```python
"""chairs.json + sections.json → venue.json + work/fit-report.txt
사용: $BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json"""
import json, os, sys
import numpy as np
import frame as fr
from analyze_chairs import clusters_1d, ROW_GAP

def select(pts_sv, mats, center, cfg, tiers):
    h = pts_sv[:, 1]
    t = tiers[cfg['tier']]
    ang = fr.angle_deg(pts_sv, center)
    r = np.hypot(pts_sv[:, 0] - center[0], pts_sv[:, 2] - center[1])
    m = (h >= t['hMin']) & (h < t['hMax']) & (ang >= cfg['angleStart']) & (ang < cfg['angleEnd'])
    if 'rMin' in cfg: m &= r >= cfg['rMin']
    if 'rMax' in cfg: m &= r < cfg['rMax']
    if 'material' in cfg: m &= mats == cfg['material']
    return pts_sv[m], r[m], ang[m]

def template_section(cfg, base):
    """의자가 없는 구역: base(피팅된 구역)의 열 구조를 복사하고 base의 열별 좌석 비율대로 expected를 나눈다(최종 구현. 계획 당시의 균등 분배는 base의 부채꼴을 지웠다)."""
    rows = base['rows']; exp = int(cfg['expected'])
    per = [exp // rows] * rows
    for i in range(exp - sum(per)):
        per[rows - 1 - i] += 1
    return {**base, 'id': cfg['id'], 'label': cfg['label'], 'seatsPerRow': per if len(set(per)) > 1 else per[0],
            'shape': {**base['shape'], 'angleStart': cfg['angleStart'], 'angleEnd': cfg['angleEnd']}}

def fit_arc(cfg, pts, center):
    """구역의 의자들로 arc 파라미터를 맞춘다. pts: (N,3) SeatView 좌표."""
    r = np.hypot(pts[:, 0] - center[0], pts[:, 2] - center[1])
    ang = fr.angle_deg(pts, center)
    rows = clusters_1d(r, ROW_GAP)
    row_r, row_h, counts, a_lo, a_hi = [], [], [], [], []
    for lo, hi, n in rows:
        m = (r >= lo) & (r <= hi)
        row_r.append(float(r[m].mean())); row_h.append(float(pts[m, 1].mean())); counts.append(int(n))
        pitch = (ang[m].max() - ang[m].min()) / max(n - 1, 1) if n > 1 else 0.0
        a_lo.append(float(ang[m].min() - pitch / 2)); a_hi.append(float(ang[m].max() + pitch / 2))
    n_rows = len(rows)
    row_depth = float(np.median(np.diff(row_r))) if n_rows > 1 else 0.9
    riser = float(np.median(np.diff(row_h))) if n_rows > 1 else 0.0
    sec = {
        'id': cfg['id'], 'label': cfg['label'],
        'shape': {'type': 'arc', 'center': [round(center[0], 2), round(center[1], 2)],
                  'radiusStart': round(row_r[0] - row_depth / 2, 2),
                  'angleStart': round(float(np.median(a_lo)), 2), 'angleEnd': round(float(np.median(a_hi)), 2)},
        'rows': n_rows, 'rowDepth': round(row_depth, 3), 'riser': round(max(riser, 0.0), 3),
        'baseHeight': round(row_h[0], 2), 'seatsPerRow': counts,
    }
    if len(set(counts)) == 1:
        sec['seatsPerRow'] = counts[0]
    gen = place_arc(sec)
    rep = error_report(gen, pts)
    rep['count'] = int(sum(counts)); rep['expected'] = cfg.get('expected')
    return sec, rep

def place_arc(sec):
    """seat-engine arcPlacer 규칙: radius = radiusStart + (r+0.5)*rowDepth, angle = start + (s+0.5)/n*span."""
    sh = sec['shape']; cx, cz = sh['center']; span = sh['angleEnd'] - sh['angleStart']
    spr = sec['seatsPerRow']
    out = []
    for ri in range(sec['rows']):
        n = spr if isinstance(spr, int) else spr[ri]
        radius = sh['radiusStart'] + (ri + 0.5) * sec['rowDepth']
        for s in range(n):
            a = np.radians(sh['angleStart'] + (s + 0.5) / n * span)
            out.append([cx + radius * np.sin(a), sec['baseHeight'] + ri * sec['riser'], cz + radius * np.cos(a)])
    return np.array(out)

def error_report(gen, pts):
    if gen.shape[0] == 0 or pts.shape[0] == 0:
        return {'meanErr': float('nan'), 'maxErr': float('nan')}
    d = np.sqrt(((gen[:, None, :] - pts[None, :, :]) ** 2).sum(-1)).min(1)
    return {'meanErr': float(d.mean()), 'maxErr': float(d.max())}

def explicit_section(cfg, pts, center):
    """Box·장애인석: 열은 반경으로(앞→뒤), 열 안은 각도 순(왼쪽→오른쪽)."""
    r = np.hypot(pts[:, 0] - center[0], pts[:, 2] - center[1])
    ang = fr.angle_deg(pts, center)
    seats = []
    for ri, (lo, hi, _) in enumerate(clusters_1d(r, ROW_GAP)):
        idx = np.where((r >= lo) & (r <= hi))[0]
        idx = idx[np.argsort(ang[idx])]
        for si, i in enumerate(idx):
            seats.append({'row': str(ri + 1), 'seat': si + 1, 'position': [round(float(v), 2) for v in pts[i]]})
    return {'id': cfg['id'], 'label': cfg['label'], 'shape': {'type': 'explicit'}, 'seats': seats}

def floor_section(cfg):
    x0, x1 = cfg['x']; z0, z1 = cfg['z']
    return {'id': cfg['id'], 'label': cfg['label'],
            'shape': {'type': 'polygon', 'points': [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]},
            'rows': int(round((z1 - z0) / 1.0)), 'rowDepth': 1.0, 'riser': 0, 'baseHeight': 0,
            'seatsPerRow': int(round((x1 - x0) / 0.5))}

def run(work, sections_path, out_path):
    cfg = json.load(open(sections_path))
    f = fr.load_frame(work)
    P, mats = fr.load_chairs_with_materials(work)
    keep = np.isin(mats, cfg['seatMaterials'])
    pts, mats = fr.apply_frame(f, P[keep]), mats[keep]
    center = [0.0, f['stage_radius_m']]
    sections, lines = [], []
    fitted = {}
    lines.append(f'{"section":10} {"count":>6} {"expect":>6} {"diff%":>6} {"meanErr":>8} {"maxErr":>7}  rows')
    bad = 0
    for c in cfg['arcs']:
        if 'like' in c:
            sec = template_section(c, fitted[c['like']])
            sections.append(sec); fitted[sec['id']] = sec
            lines.append(f'{c["id"]:10} {c["expected"]:6d} {c["expected"]:6d} {0.0:6.1f} {"template":>8} {c["like"]:>7}  {sec["rows"]}')
            continue
        sel, _, _ = select(pts, mats, center, c, cfg['tiers'])
        if sel.shape[0] == 0:
            lines.append(f'{c["id"]:10} NO CHAIRS'); bad += 1; continue
        sec, rep = fit_arc(c, sel, center)
        sections.append(sec); fitted[sec['id']] = sec
        exp = rep['expected'] or rep['count']
        diff = (rep['count'] - exp) / exp * 100
        flag = '' if abs(diff) <= 5 and rep['meanErr'] <= 0.3 and rep['maxErr'] <= 1.0 else '  <-- CHECK'
        if flag: bad += 1
        lines.append(f'{c["id"]:10} {rep["count"]:6d} {exp:6d} {diff:6.1f} {rep["meanErr"]:8.3f} {rep["maxErr"]:7.3f}  {sec["rows"]}{flag}')
    for c in cfg['explicit']:
        sel, _, _ = select(pts, mats, center, c, cfg['tiers'])
        sec = explicit_section(c, sel, center)
        sections.append(sec)
        exp = c.get('expected', len(sec['seats']))
        flag = '' if abs(len(sec['seats']) - exp) <= max(1, exp * 0.05) else '  <-- CHECK'
        if flag: bad += 1
        lines.append(f'{c["id"]:10} {len(sec["seats"]):6d} {exp:6d} {"":6} {"explicit":>8}{flag}')
    for c in cfg.get('floor', []):
        sections.append(floor_section(c))
    total = 0
    for s in sections:
        if 'seats' in s: total += len(s['seats'])
        else: total += sum(s['seatsPerRow']) if isinstance(s['seatsPerRow'], list) else s['seatsPerRow'] * s['rows']
    venue = {
        'id': cfg['id'], 'name': cfg['name'], 'units': 'm',
        'stage': {'center': [0, 0, 0], 'size': cfg['stage']['size'], 'facing': [0, 0, 1]},
        'sections': sections, 'obstacles': [],
        'shell': {'glb': f'/venues/{cfg["id"]}/shell.glb'},
        'credit': cfg['credit'],
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    json.dump(venue, open(out_path, 'w'), ensure_ascii=False, indent=1)
    lines.append(f'\nTOTAL seats {total}; sections {len(sections)}; flagged {bad}')
    report = '\n'.join(lines)
    open(os.path.join(work, 'fit-report.txt'), 'w').write(report)
    print(report)

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[3])
```

- [ ] **Step 4: 통과 확인** — `$BPY -m unittest tests.test_fit_sections -v` → 4개 PASS.

- [ ] **Step 5: `sections.json` 작성** — Task 4의 `work/analyze-seatview.txt`(블록별 각도 범위·의자 수·열 수)와 좌석배치도를 대조해 각 블록에 구역 번호를 붙인다. 규칙:

- 좌석배치도 번호는 위에서 시작해 시계 방향으로 는다. SeatView 각도도 시계 방향(+)으로 늘어난다(무대를 보고 오른쪽 +). 5~11구역(무대 정면)이 각도 0° 근처에 있고 번호가 늘수록 각도가 커진다(5 → 11이 −40° → +40° 정도). 1~4는 −90° 근처(왼쪽), 12~15는 +90° 근처(오른쪽). 2·3층은 23부터 시계 방향으로 52까지.
- 각 arc 항목의 `angleStart/End`는 보고서의 블록 경계(통로 중앙). `expected`는 좌석배치도 표의 값(예: 1~4: 282, 5~11: 292, 12~15: 282, 23: 417, 24: 270, 25: 236, 26: 217, 27: 248, 28: 247, 29: 244, 30: 259, 31: 306, 32: 326, 33: 250, 34: 245, 35: 326, 36: 306, 37: 269, 38: 241, 39: 248, 40: 248, 41: 219, 42: 244, 43: 277, 44: 288, 45: 329, 46: 221, 47: 206, 48: 116, 49: 104, 50: 176, 51: 160, 52: 233).
- 1층 1~4·12~15는 `material: "yellow_chair__1"`로 피팅한다(모델에 정확히 8×282석이 있다). 1층 5~11은 모델에서 접혀 있으므로 `like`로 본뜬다: 5·6·7은 `"like": "4"`(같은 쪽 이웃), 9·10·11은 `"like": "12"`, 8은 `"like": "4"`. 각도 범위는 좌석배치도상 5~11이 -45°..45° 사이를 7등분한 값에서 시작해, 12·13 사이 통로 각도와 대칭이 되게 맞춘다.
- 2·3층은 `chair_orange` 블록이 있는 구역만 피팅하고, 의자가 없는 구역은 같은 층의 가장 가까운 피팅된 구역을 `like`로 본뜬다. 보고서 블록 표의 `chair_orange=` 개수가 도면 좌석 수의 절반 이하인 블록은 부분 모델이므로 `like`로 처리한다.
- 16~22구역은 넣지 않는다(무대 자리). 모델에 그 의자가 있어도 무시한다.
- 한 블록에 두 구역이 붙어 있으면(통로가 좁아 안 갈라진 경우) `expected` 좌석 수 비율로 각도를 나눠 두 항목을 만든다.
- 2층과 3층이 같은 각도에서 반경만 다르면 `tiers`를 세 개로 나누거나 `rMin/rMax`를 쓴다.
- Box객석 1~8(14, 12, 17, 10, 10, 19, 21, 12석)은 `material: "red_charir"`, 장애인석(84석, 1층 5~11구역 앞 난간을 따라 한 줄)은 `material: "yellow_chair__3"`으로 `explicit`에 넣는다. Box객석은 `red_charir` 블록 8개의 각도 범위를 그대로 쓴다.
- `floor`는 아레나 바닥 크기에 맞춘다: 1층 첫 열 반경(보고서 tier 0 최소 r)을 R0라 할 때 `z` 범위는 `[8, R + R0 - 3]`, 블록 폭은 각 12 m, 사이 1 m.

- [ ] **Step 6: 피팅 실행과 반복**

```bash
$BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json
```

`<-- CHECK`가 붙은 구역마다: 각도 경계 조정(통로 위치), `rMin/rMax`, 구역 분할, `tiers` 높이 범위 조정. 열 수가 지나치게 많이 잡히면(예: 30 이상) 같은 열이 두 개로 갈라진 것이므로 그 구역만 별도 `rowGap`을 줄 수 있게 `cfg.get('rowGap', ROW_GAP)`을 `fit_arc`에 전달한다(`clusters_1d(r, cfg.get('rowGap', ROW_GAP))`). 전 구역이 기준(±5 %, 평균 ≤ 0.3 m, 최대 ≤ 1.0 m)을 만족할 때까지 반복. 최종 보고서를 `tools/kspo-dome/fit-report.txt`로 복사해 커밋한다(근거 보존).

- [ ] **Step 7: 앱 검증 테스트** — `src/core/kspo-dome.test.ts` (`sample-venue.test.ts`와 같은 형식). 좌석 수는 `fit-report.txt`의 TOTAL 값을 넣는다.

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateVenue } from './venue-schema'
import { allSeats, seatCount } from './seat-engine'

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
}

describe('kspo-dome', () => {
  it('index.json에 등록되어 있다', () => {
    const index = loadJson('../../public/venues/index.json') as { id: string; name: string }[]
    expect(index.some((v) => v.id === 'kspo-dome')).toBe(true)
  })

  it('스키마를 통과하고 좌석 수가 보고서와 같다', () => {
    const r = validateVenue(loadJson('../../public/venues/kspo-dome/venue.json'))
    expect(r.ok, r.ok ? '' : r.errors.join('\n')).toBe(true)
    if (!r.ok) return
    expect(seatCount(r.venue)).toBe(TOTAL_FROM_FIT_REPORT)
    expect(r.venue.credit).toContain('공공누리')
    expect(r.venue.shell?.glb).toBe('/venues/kspo-dome/shell.glb')
  })

  it('모든 좌석이 아레나 안(무대 중심에서 120 m 이내)에 있고 높이가 -0.5 이상 40 m 미만이다', () => {
    const r = validateVenue(loadJson('../../public/venues/kspo-dome/venue.json'))
    if (!r.ok) throw new Error(r.errors.join('\n'))
    for (const s of allSeats(r.venue)) {
      expect(Math.hypot(s.position[0], s.position[2]), s.id).toBeLessThan(120)
      expect(s.position[1], s.id).toBeGreaterThanOrEqual(-0.5)
      expect(s.position[1], s.id).toBeLessThan(40)
    }
  })
})
```

`TOTAL_FROM_FIT_REPORT`는 실제 숫자로 바꾼다. `public/venues/index.json`에 `{ "id": "kspo-dome", "name": "KSPO DOME (올림픽 체조경기장)" }`을 추가한다.

- [ ] **Step 8: 검증** — `npm test` 전부 PASS, `npm run typecheck` 성공.

- [ ] **Step 9: 커밋**

```bash
git add tools/kspo-dome/fit_sections.py tools/kspo-dome/sections.json tools/kspo-dome/fit-report.txt tools/kspo-dome/tests/test_fit_sections.py public/venues/kspo-dome/venue.json public/venues/index.json src/core/kspo-dome.test.ts
git commit -m "seatview: Fit KSPO DOME sections from the official chair cloud and register the venue."
```

---

### Task 6: 외형 shell.glb

**Files:**
- Create: `tools/kspo-dome/build_shell.py`
- Create: `public/venues/kspo-dome/shell.glb` (생성물)

**Interfaces:**
- Consumes: `work/shell.obj`(모델 좌표, m), `work/materials.json`, `work/frame.json`.
- Produces: `shell.glb` — 원점 무대 중앙 바닥, Y 위, +Z 관중석(glTF 내보내기의 Y-up 변환에 맡긴다: Blender에서는 Z-up, 관중석 −Y).

- [ ] **Step 1: `build_shell.py` 작성**

```python
"""Blender 헤드리스: work/shell.obj → Draco glb.
사용: $BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb [--max-tris 300000]"""
import argparse, json, math, os, sys
import bpy

def args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(); ap.add_argument('work'); ap.add_argument('out')
    ap.add_argument('--max-tris', type=int, default=300000)
    return ap.parse_args(argv)

def main():
    a = args()
    work = os.path.abspath(a.work); out = os.path.abspath(a.out)
    frame = json.load(open(os.path.join(work, 'frame.json')))
    colors = json.load(open(os.path.join(work, 'materials.json')))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.obj_import(filepath=os.path.join(work, 'shell.obj'), forward_axis='Y', up_axis='Z')
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    print('imported', len(objs), 'objects', flush=True)

    # 모델 좌표 → Blender 작업 좌표: (xy - center) 회전(-A) → y -= R → z -= floor
    A = math.radians(frame['stage_angle_deg']); cx, cy = frame['center_model']
    cosA, sinA = math.cos(A), math.sin(A)
    import numpy as np
    for o in objs:
        me = o.data
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        x, y = co[:, 0] - cx, co[:, 1] - cy
        co[:, 0] = x * cosA - y * sinA
        co[:, 1] = (x * sinA + y * cosA) - frame['stage_radius_m']
        co[:, 2] -= frame['floor_z']
        me.vertices.foreach_set('co', co.ravel()); me.update()
        # frame.apply_frame과 같은 회전. SeatView의 +Z(관중석)는 여기서 -Y다. glTF 내보내기가 Y-up으로 바꿔 준다.

    # 재질 색
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if m is None: continue
            m.use_nodes = True
            bsdf = m.node_tree.nodes.get('Principled BSDF')
            col = colors.get(m.name, [0.7, 0.7, 0.7])
            if bsdf: bsdf.inputs['Base Color'].default_value = (col[0], col[1], col[2], 1.0)
            m.use_backface_culling = False

    # 정점 병합 + 감축
    total = sum(len(o.data.polygons) for o in objs)
    ratio = min(1.0, a.max_tris / max(total, 1))
    print('tris before', total, 'ratio', round(ratio, 3), flush=True)
    for o in objs:
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.remove_doubles(threshold=0.01); bpy.ops.object.mode_set(mode='OBJECT')
        if ratio < 1.0 and len(o.data.polygons) > 200:
            mod = o.modifiers.new('dec', 'DECIMATE'); mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
        o.select_set(False)
    after = sum(len(o.data.polygons) for o in objs)
    print('tris after', after, flush=True)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_texcoords=False, export_colors=False,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                              export_draco_position_quantization=14)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB', flush=True)

main()
```

Blender 5.2 glTF exporter의 인자 이름이 다르면(`export_colors` 등) `bpy.ops.export_scene.gltf.get_rna_type().properties.keys()`로 확인해 맞춘다. 원본 OBJ의 `remove_doubles`가 오래 걸리면(10분 이상) 생략한다.

- [ ] **Step 2: 실행**

```bash
cd tools/kspo-dome && $BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb 2>&1 | grep -vE "^(Blender|Read|Info:|register_class|\[INFO)" | tail -20
ls -la ../../public/venues/kspo-dome/shell.glb
```

기준: ≤ 8 MB, 삼각형 ≤ 30만. 넘으면 `--max-tris 200000`으로 다시.

- [ ] **Step 3: 정렬 검증** — `npm run dev`로 뷰어를 열고(`http://localhost:5173/#/v/kspo-dome`) 1층·2층·3층 좌석 각 1곳(예: 5구역 1열 중앙, 8구역 마지막 열, 33구역 중간 열)을 검색해 시야 스크린샷을 `tools/kspo-dome/screenshots/`에 저장한다(파일당 500 KB 이하로 줄인다). 파라미터로 생성된 관중석 단·좌석 점과 외형의 계단·난간·벽이 같은 위치에 겹쳐 보여야 한다. 어긋나면 원인은 셋 중 하나다: (a) `frame.json`의 A/R/F(둘 다 같은 값을 쓰므로 좌석과 외형이 함께 틀리면 무대 위치·방향 문제 → Task 4 Step 6으로), (b) `build_shell.py`의 회전 부호(외형만 돈다 → `frame.py._rot`와 같은 부호인지 대조), (c) glTF Y-up 변환(외형이 눕는다 → `export_yup`). 외형 로딩이 실패하면 브라우저 콘솔에서 Draco 디코더 404인지 확인한다(Task 2).

- [ ] **Step 4: 커밋**

```bash
git add tools/kspo-dome/build_shell.py public/venues/kspo-dome/shell.glb tools/kspo-dome/screenshots
git commit -m "seatview: Build the KSPO DOME shell.glb from the official model (chairs removed, decimated, Draco)."
```

---

### Task 7: 문서와 마무리

**Files:**
- Modify: `README.md` ("공연장 추가" 절)
- Modify: `docs/HANDOFF.md`
- Modify: `tools/kspo-dome/README.md` (결정값·최종 수치)

- [ ] **Step 1: README** — "공연장 추가" 절 끝에 한 문단:

```markdown
5. 공식 3D 모델이 있으면 좌석배치도 대신 모델에서 만든다. 예시는 `tools/kspo-dome/`(KSPO DOME): DAE를 파싱해 의자 점군과 외형 OBJ를 뽑고, 점군을 구역 arc 파라미터로 피팅해 `venue.json`을, 외형은 Blender 헤드리스로 Draco glb를 만든다. 출처 표시가 필요한 데이터는 `venue.json`의 `credit`에 적으면 뷰어 하단에 표시된다.
```

- [ ] **Step 2: HANDOFF** — "현재 상태"에 KSPO DOME이 추가됐음을 한 줄 넣고(좌석 수·glb 크기·피팅 오차 요약), "알려진 후속 과제"에 "플로어 배치는 대표 구성 1개", "슬라이드석 16~22 제외", "실사 사진 비교 미실시"를 추가한다. "다음 작업: 모바일 UX" 절은 그대로 둔다.

- [ ] **Step 3: 최종 검증**

```bash
npm run typecheck && npm test && npm run build && ls -la dist/venues/kspo-dome dist/draco
cd tools/kspo-dome && $BPY -m unittest discover -s tests -v
```

전부 성공해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add README.md docs/HANDOFF.md tools/kspo-dome/README.md
git commit -m "seatview: Document the KSPO DOME pipeline and update the handoff notes."
```
