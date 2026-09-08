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
4. `$BPY frame.py work/ --stage-angle <deg> --stage-radius <m>` → `work/frame.json`
5. `$BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json` → venue.json + `work/fit-report.txt`
6. `$BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb`
7. `$BPY -m unittest discover -s tests -v`
