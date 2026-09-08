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
4. `$BPY frame.py work/ --stage-angle 180 --stage-radius 16.3 --floor-z 0` → `work/frame.json`
   (`$BPY analyze_chairs.py work/ --frame`로 확인. 값의 근거는 아래 "결정값")
5. `$BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json` → venue.json + `work/fit-report.txt`
6. `$BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb`
   결과: 1.61 MB, 181,120 삼각형 (Draco 압축, 디코더는 three 동봉본을 Vite가 번들에 넣는다).
7. `$BPY -m unittest discover -s tests -v`

## 결정값 (frame.json)

`work/`는 커밋하지 않으므로 값과 근거를 여기 남긴다. 자세한 계산은 `work/frame-notes.txt`.

    A(stage_angle_deg) = 180.0   R(stage_radius_m) = 16.3   F(floor_z) = 0.0
    center_model = (105.443, 71.327)   # arena_center(): 가장 점이 많은 높이 띠에 원 피팅

아레나는 원형이다. 의자 평균(106.399, 79.819)은 좌석이 빠진 쪽 때문에 중심에서 8 m 밀리므로
쓰지 않는다. 원 피팅 결과(중심·반경·잔차 rms/최대):

| 대상 | n | 중심 | R | 잔차 rms / 최대 |
|---|---|---|---|---|
| 가장 점이 많은 높이 띠 (z≈9.14) = `arena_center` | 378 | (105.44, 71.33) | 54.39 | 0.079 / 0.168 |
| `chair_orange` 중앙 높이 열 | 348 | (105.44, 71.44) | 53.49 | 0.074 / 0.139 |
| `yellow_chair__1` 첫 열 (z 최저 ±0.06) | 64 | (105.63, 71.26) | 24.28 | 0.034 / 0.051 |

모델 각도 = `atan2(x-cx, y-cy)`, 0° = 모델 +Y. 배치도와의 대응:
모델 0° = 5~11(오른쪽), 180° = 16~22(왼쪽·무대), -90° = 1~4(위), +90° = 12~15(아래).
근거는 `red_charir` 덩어리 크기가 배치도 Box객석과 정확히 맞는다는 것이다
(음수쪽 14·12·17·10 = Box1~4, 양수쪽 10·19·21·12 = Box5~8, 둘 다 5~11 옆).
장애인석 84석도 0° 쪽(-49.0..+49.2)에 있으므로 무대는 반대쪽 180°다.

- **A = 180.0** — 1층 고리의 두 틈 중앙이 179.90°(무대 쪽)와 0.14°다. 무대는 Box·장애인석
  반대쪽 틈이므로 179.9 ≈ **180.0**. A=180.0이면 yellow 두 덩어리가 SeatView
  +60.11..+112.77 과 -112.56..-60.38 로 마주 보아 좌우 대칭 오차가 0.21°/0.27°다
  (A=180.5면 0.73°/1.21°). 좌우 확인: SeatView + 쪽 Box가 59석(=Box1~4, 배치도 오른쪽 위 =
  무대 보고 오른쪽), - 쪽이 62석(=Box5~8)으로 배치도와 맞는다.
- **R = 16.3** — 1층 첫 열(yellow 최저 열) 원 반경 24.28에서 `24.28 - 2 - 6 = 16.3`.
  무대는 모델 y 49.0..61.0(SeatView z -6..+6)에 선다. 모델에 좌석이 없는 무대 쪽 1층 첫 열을
  shell 구조물(첫 열 높이 z 0.1..1.2)로 재면 반경 23.68이라 무대 뒷면(22.3)과 1.4 m 뜬다
  (구조물 반경은 어느 방향이든 23.60~24.54).
- **F = 0.0** — `shell.obj`의 지면이 z 0.00이고 아레나 바닥 영역에 다른 면이 없다. 1층 첫 열은
  0.2 m 발판 위에 있어 좌석 상자 중심이 0.84다(브리프의 `0.84 - 0.45 = 0.39`는 쓰지 않았다).
- 아레나 바닥은 반경 약 24.3 m(지름 48.6 m)의 원, 중심 (105.44, 71.33).

## 구역 피팅 (sections.json → venue.json)

`sections.json`이 배치도 구역 번호·좌석 수와 SeatView 각도 범위를 담고, `fit_sections.py`가
`chairs.json`에서 그 범위의 의자를 골라 arc 파라미터(rows·rowDepth·riser·baseHeight·seatsPerRow)를
맞춘다. 결과 요약과 편차 근거는 커밋된 `fit-report.txt`에 있다(총 13776석, 58구역, 12구역 플래그).

구역 번호는 좌석배치도의 마젠타 구획선 각도를 재서 붙였다(배치도 위 = SeatView +X, 시계방향 = 각도 감소,
0°가 33|34, 180°가 48|49 사이). 모델에 의자가 없는 구역(1층 5~11, 2·3층 23~28·39~44)과
배치도의 86 %만 있는 31·32·35·36구역은 이웃 구역을 `like`로 본떴다(좌석 수는 본뜬 구역의 열별 비율대로 나눈다).

좌석 수는 전 구역 ±5 % 안이다(최대 -3.4 %). 플래그 12구역은 모두 `maxErr > 1.0 m`이고, **그 중 6구역
(45·46·47·50·51·52)은 `meanErr > 0.3 m`이기도 하다**(0.380 / 0.332 / 0.334 / 0.415 / 0.389 / 0.489).
원인은 구역 안 포탈·가로통로라 열마다 각도 폭이 다르고(33구역 1~4열 3.7°..10.4° vs 5~6열 0.8°..10.4°)
좌석 간격까지 달라지는 것이다(52구역 1.05 → 0.645 → 0.478 m). 각도 격자 탐색·반경 분할·`rowGap`
어느 것으로도 못 고쳐(자세한 수치는 `fit-report.txt` 메모) 티켓 구역 번호를 지키려고 구역을 쪼개지 않았다.
피팅 5112석 중 1 m 초과는 146석(2.9 %)이다.

`error_report`는 생성 좌석 → 가장 가까운 실제 의자 한 방향이라 덮이지 않은 실제 의자에 벌점이 없다.
구역 각도를 좁히면 `maxErr`가 '통과'하지만 실제 좌석이 비므로 이 지표에 맞춰 각도를 손대면 안 된다.
