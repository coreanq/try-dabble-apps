# KSPO DOME 변환 도구

원본: https://www.ksponco.or.kr/attachFiles/download/kspo/kspodome_dae.zip (공공누리 제1유형, 한국체육산업개발·한국문화정보원).
Blender 5.2에는 Collada 임포터가 없어 DAE를 직접 파싱한다. 모든 스크립트는 Blender 내장 Python으로 실행한다.

    BPY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
    BLENDER=/Applications/Blender.app/Contents/MacOS/Blender

1. `work/`에 zip을 풀어 `temp_export.dae`를 둔다 (zip 안 폴더명이 cp949라 Python zipfile로 꺼낸다).
2. `$BPY extract_dae.py work/temp_export.dae work/` → `chairs.json`, `shell.obj`, `materials.json`.
   `chairs.json`은 `chairs`와 길이가 같은 `materials` 목록을 함께 담는다(점 하나당 재질 이름 하나).
   실제 좌석 재질은 `yellow_chair__1`(1층 1~4·12~15, 2256), `yellow_chair__3`(장애인석, 84),
   `red_charir`(Box객석, 121), `chair_orange`(2·3층, 4154) 넷이다(총 6615점).
   `chair_1`은 팔걸이·브래킷·레일이라 좌석이 아니므로 병합 전에 버린다 — `chairs.json`에 나오지 않는다.
3. `$BPY analyze_chairs.py work/` → `work/chairs.svg`, 층·열·구역 클러스터 보고서
4. `$BPY frame.py work/ --stage-angle 180 --stage-radius 23.7 --floor-z 0` → `work/frame.json`
   (`$BPY analyze_chairs.py work/ --frame`로 확인. 값의 근거는 아래 "결정값")
5. `$BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json` → venue.json + `work/fit-report.txt`
6. `$BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb`
7. `$BPY -m unittest discover -s tests -v`

## 결정값 (frame.json)

`work/`는 커밋하지 않으므로 값과 근거를 여기 남긴다. 자세한 계산은 `work/frame-notes.txt`.

    A(stage_angle_deg) = 180.0   R(stage_radius_m) = 23.7   F(floor_z) = 0.0
    center_model = (106.399, 79.819)  # chairs.json 6615점의 XY 평균

모델 각도 = `atan2(x-cx, y-cy)`, 0° = 모델 +Y. 배치도와의 대응:
모델 0° = 5~11(오른쪽), 180° = 16~22(왼쪽·무대), -90° = 1~4(위), +90° = 12~15(아래).
근거는 `red_charir` 덩어리 크기가 배치도 Box객석과 정확히 맞는다는 것이다
(음수쪽 14·12·17·10 = Box1~4, 양수쪽 10·19·21·12 = Box5~8, 둘 다 5~11 옆).
장애인석 84석도 0° 쪽에 있으므로 무대는 반대쪽 180°다.

- **A = 180.0** — 1층 고리의 두 틈은 중앙 -0.4°와 180.9°. 무대는 Box·장애인석 반대쪽 틈.
  1층 앞열이 x = 82.8 / 128.4 직선이라 아레나 축과 모델 축이 나란해서 180.0으로 맞췄다
  (그러면 yellow 덩어리 두 개가 SeatView ±(70.7..128.7)로 0.5° 안에서 대칭이 된다).
- **R = 23.7** — 1층 슬라이드석 5~11·16~22은 쿠션이 모델에 없지만 스탠드 구조는 펼쳐진 채
  들어 있다. `shell.obj`에서 z 0.1..1.2(첫 열 높이)의 스탠드 구조(`__stand_paint`·
  `stand_frame_iron`) 최소 반경은 ±90°에서 21.24 / 22.79 m인데 그 자리의 1층 첫 열 좌석 중심이
  21.20 / 22.74 m로 5 cm 안에서 같다. 즉 이 구조의 최소 반경이 곧 첫 열 반경이다.
  A 방향에서는 31.73 m(±15°의 `arm__1` 팔걸이로도 31.72 m)이므로 `31.73 - 2 - 6 = 23.7`.
  (브리프의 대체값 = yellow 앞열 20.78 → R 12.8은 쓰지 않았다.
  `center_model`이 아레나 바닥 중심에서 +Y로 8 m 치우쳐 방향별 첫 열 반경이 16~32 m로 크게
  다르고, 12.8이면 무대가 아레나 한가운데에 선다.)
- **F = 0.0** — `shell.obj`의 지면이 z 0.00이고 아레나 바닥 영역에 다른 면이 없다. 1층 첫 열은
  0.2 m 발판 위에 있어 좌석 상자 중심이 0.84다(브리프의 `0.84 - 0.45 = 0.39`는 쓰지 않았다).
- 아레나 바닥 ≈ 45.6 m(모델 X) × 47.1 m(모델 Y), 중심 (105.6, 71.8).
