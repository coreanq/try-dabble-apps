# SeatView

공연장 좌석을 고르면 그 자리에서 무대가 어떻게 보이는지 3D로 보여주는 정적 웹앱.

## 실행

    npm install
    npm run dev        # http://localhost:5173/  (뷰어), http://localhost:5173/admin/ (디지타이징 도구)
    npm test
    npm run typecheck
    npm run build      # dist/ 정적 파일 (index.html, admin/index.html, venues/)

## 공연장 추가

1. 티켓 사이트 좌석배치도 이미지를 저장한다.
2. `/admin/`에서 이미지를 올리고 순서대로 입력한다: 스케일(실제 거리를 아는 두 점) → 원점(무대 중앙) → 관중석 방향 → 무대 모서리 → 구역(다각형은 무대에 가까운 변의 두 점을 먼저 클릭, 호는 숫자 입력) → 방해물. 다각형 구역의 좌석은 첫 두 점(앞변) 기준으로 열 수 × 열 간격만큼 뒤로 배치되므로, 그린 다각형의 깊이를 그 값에 맞춘다. 층별 이미지가 다르면 새 이미지에서 스케일·원점을 다시 잡는다. 박스석 같은 explicit 구역은 JSON에서 직접 작성한다. 하단 3D 미리보기에서 "시야 보기"로 즉시 확인한다. 작업 중 상태는 브라우저 localStorage에 자동 저장된다.
3. "venue.json 다운로드" → `public/venues/<id>/venue.json`에 두고 `public/venues/index.json`에 `{ "id": "<id>", "name": "..." }`을 추가한다.
4. (선택) Blender로 만든 외형 glb를 `public/venues/<id>/shell.glb`에 두고 venue.json에 `"shell": { "glb": "/venues/<id>/shell.glb" }`를 추가한다. glb 원점은 무대 중앙 바닥, Y 위, +Z가 관중석 방향.

## 데이터 모델

`docs/superpowers/specs/2026-09-07-seat-view-design.md` 참고. 좌표계: 미터, 원점 = 무대 중앙 바닥, Y 위, 관중석 +Z. 좌석 좌표는 저장하지 않고 구역 파라미터(arc / polygon / explicit)에서 계산한다.

URL로 좌석을 공유할 수 있다: `/#/v/<venueId>?s=<구역>&r=<열>&n=<번호>`

## 구조

- `src/core` — 스키마 검증, 좌석 생성, 카메라, 검색, 2D 수학. three.js 의존 없음, 단위 테스트 대상.
- `src/three` — 메시 생성(InstancedMesh), 렌더러, 1인칭 둘러보기, glb 로더.
- `src/ui` — 2D 좌석도 캔버스.
- `src/viewer` — 사용자 화면(해시 라우팅). `src/admin` — 디지타이징 도구.
