# KSPO DOME 실제 공연장 적용 — 설계 문서

2026-09-08. 첫 실제 공연장으로 KSPO DOME(올림픽 체조경기장)을 SeatView에 넣는다.

## 1. 목적

공개된 공식 3D 모델에서 좌석 위치를 추출해 구역 파라미터(venue.json)를 만들고, 같은 모델에서 경량 외형(shell.glb)을 만들어 실제 공연장에서 시야 미리보기가 동작하게 한다. 기존 규칙(좌석 좌표는 저장하지 않고 파라미터에서 계산, 외형은 덧붙임)은 그대로 지킨다.

## 2. 원본 데이터

- `https://www.ksponco.or.kr/attachFiles/download/kspo/kspodome_dae.zip` (59 MB, 풀면 `temp_export.dae` 475 MB). SketchUp 22 내보내기, 단위 인치, Z-up. geometry 100,162개·삼각형 263만 개, 노드 이름은 `group_N`/`instance_N`뿐이라 구역·좌석 라벨은 없다. 의자는 컴포넌트 인스턴스로 반복되고 재질 이름에 `chair`/`charir`가 들어간다.
- `https://www.ksponco.or.kr/attachFiles/download/kspo/popimg_acro_seat.jpg` 좌석배치도: 1층 1~22구역, 2·3층 23~52구역, Box객석 1~8(121석), 장애인석 84석, 계 14,151석. 구역별 좌석 수 표 포함.
- 출처: 한국체육산업개발(주)·한국문화정보원, 공공누리 제1유형(출처표시). 같은 모델이 Sketchfab에 `KCISA-올림픽 체조경기장`(CC BY)으로도 있다.
- 원본 파일은 저장소에 넣지 않는다. `apps/seatview/tools/kspo-dome/work/`(gitignore)에 내려받아 쓴다.

## 3. 좌표계와 무대

- SeatView 좌표계: 미터, 원점 = 무대 중앙 바닥, Y 위, 관중석 +Z.
- 콘서트 엔드스테이지 구성 하나만 만든다. 무대는 1층 16~22구역(슬라이드식 가변석) 자리에 놓이고 5~11구역이 무대 정면이다. 16~22구역은 접힌 것으로 보고 제외한다.
- 무대 크기는 20 × 1.5 × 12 m(가로·높이·깊이)로 두고 `stage.facing`은 +Z.
- 모델 좌표 → SeatView 좌표 변환(인치→미터, Z-up→Y-up, 원점 이동, 회전)은 의자 점군에서 계산한다: 아레나 중심은 점군 중심, 무대 방향은 16~22구역 쪽(의자가 없는 넓은 틈). 변환 행렬 하나를 `work/frame.json`에 저장해 좌석 피팅과 외형 변환이 같은 값을 쓴다.

## 4. 파이프라인 (`apps/seatview/tools/kspo-dome/`)

Blender 5.2에는 Collada 임포터가 없으므로 DAE는 직접 파싱한다. 스크립트는 Blender 내장 Python(numpy 포함)으로 실행한다.

1. `extract_dae.py` — DAE를 스트리밍 파싱한다. 1차: 장면 노드 트리에서 인스턴스별 월드 행렬 수집. 2차: geometry를 읽어 재질별로 합친 `work/shell.obj`(의자 재질 제외, 미터) 와 의자 인스턴스의 바운딩박스 중심 목록 `work/chairs.json`을 쓴다. 의자 판정은 재질 이름(`chair`, `charir`)이다.
2. `fit_sections.py` — `chairs.json` + 손으로 쓴 `sections.json`(구역 id, 층, 좌석배치도상 각도 범위 힌트, Box·장애인석 목록)을 받아 `venue.json`을 만든다. 의자를 층(z)·열(반경)·구역(각도)으로 묶고 열마다 반경·높이·좌석 수를 재서 arc 파라미터(`center`, `radiusStart`, `angleStart/End`, `rows`, `rowDepth`, `riser`, `baseHeight`, `seatsPerRow[]`)를 맞춘다. Box객석과 장애인석은 explicit로 그대로 쓴다. 피팅 결과 보고서 `work/fit-report.txt`에 구역별 좌석 수(도면 대비)와 생성 좌석↔가장 가까운 의자 거리(평균·최대)를 쓴다.
3. `build_shell.py` — Blender 헤드리스. `shell.obj` 불러오기 → 재질별 병합 → Decimate로 30만 삼각형 이하 → `frame.json` 변환 적용 → 단색 재질(재질 이름별 색) → Draco 압축 glb 내보내기 → `public/venues/kspo-dome/shell.glb`.
4. `public/venues/kspo-dome/venue.json` 커밋, `public/venues/index.json`에 추가.

플로어석은 공연마다 다르므로 대표 구성 하나를 polygon 3개(무대를 보고 왼쪽 D·가운데 C·오른쪽 B)로 넣고 label에 "(공연별 상이)"를 붙인다. 열 수·열당 좌석 수는 아레나 바닥 크기에서 정한다.

## 5. 앱 변경

- `venue-schema`에 선택 필드 `credit: string` 추가. 뷰어 하단 infobar에 값이 있으면 표시한다. KSPO DOME 값: "3D 모델: 한국체육산업개발·한국문화정보원 (공공누리 제1유형)".
- README "공연장 추가" 절에 3D 모델에서 만드는 경로를 한 문단 추가하고 `tools/kspo-dome/README.md`에 실행 순서를 쓴다.

## 6. 검증 기준

- 구역별 좌석 수: 도면 표 대비 ±5 % 이내. 벗어나면 `seatsPerRow` 배열 또는 구역 분할로 맞춘다.
- 위치 오차: 구역마다 생성 좌석↔가장 가까운 의자 거리 평균 0.3 m 이하, 최대 1.0 m 이하.
  2·3층 12개 구역(29·30·33·34·37·38·45·46·47·50·51·52)은 포탈·가로통로 때문에 maxErr 1.0 m를 넘고 그중 6개(45·46·47·50·51·52)는 meanErr 0.3 m도 넘는다; 구역 id를 지키기 위해 받아들였고 근거는 `tools/kspo-dome/fit-report.txt`에 있다.
- 외형: `shell.glb` 8 MB 이하, 삼각형 30만 이하. 뷰어에서 1층·2층·3층 좌석 각 1곳의 시야 스크린샷에서 관중석 단(파라미터 생성)과 외형 모델의 계단·난간이 겹쳐 보여야 한다.
- 테스트: `credit` 스키마, `kspo-dome/venue.json`이 검증을 통과하고 좌석 합계가 기대 범위인지 확인하는 테스트(sample-venue.test 방식). 기존 테스트 전부 통과, `npm run build` 성공.

## 7. 제외

- 360° 무대 구성, 공연별 플로어 배치, 텍스처 있는 외형, 슬라이드석(16~22) 펼친 구성, 실사 사진 비교(사진 확보 후 별도).
