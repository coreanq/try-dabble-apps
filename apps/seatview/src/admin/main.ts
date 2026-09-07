import { ImageCanvas } from './image-canvas'
import { SectionForm } from './section-form'
import { Preview } from './preview'
import { clearState, isCalibrated, loadState, pxToWorld, saveState, type AdminState } from './admin-state'
import { downloadText, serializeVenue } from './export'
import { parseSeatQuery } from '../core/seat-search'
import { sectionOutline, type Vec2 } from '../core/section-outline'
import { pointInPolygon } from '../core/seatmap-math'
import type { GridSection, Section } from '../core/venue-schema'

type Mode = 'idle' | 'scale' | 'origin' | 'audience' | 'stage' | 'polygon' | 'arc' | 'pillar' | 'railing' | 'select'

const root = document.getElementById('app')!
root.innerHTML = `
  <header class="topbar">
    <h1>SeatView Admin</h1>
    <label>id <input id="venueId" /></label>
    <label>이름 <input id="venueName" /></label>
    <label class="file">좌석도 이미지 <input id="imageFile" type="file" accept="image/*" /></label>
    <button id="resetBtn" type="button" class="danger">초안 지우기</button>
  </header>
  <div class="body">
    <aside class="tools">
      <section>
        <h2>1. 캘리브레이션</h2>
        <button data-mode="scale">스케일: 두 점 찍기</button>
        <div id="scaleInput" hidden><label>두 점 사이 실제 거리(m) <input id="scaleMeters" type="number" step="0.1" /></label><button id="scaleApply" type="button">적용</button></div>
        <button data-mode="origin">원점: 무대 중앙 클릭</button>
        <button data-mode="audience">관중석 방향 클릭</button>
        <p id="calStatus" class="status"></p>
      </section>
      <section>
        <h2>2. 무대</h2>
        <button data-mode="stage">무대: 모서리 두 점</button>
        <label>무대 바닥 높이(m) <input id="stageHeight" type="number" step="0.1" /></label>
      </section>
      <section>
        <h2>3. 구역</h2>
        <button data-mode="polygon">다각형 구역 그리기</button>
        <button id="polygonDone" type="button" hidden>점 찍기 끝 → 입력</button>
        <button data-mode="arc">호(arc) 구역 추가</button>
        <button data-mode="select">구역 선택/수정</button>
        <div id="sectionForm"></div>
        <ul id="sectionList" class="section-list"></ul>
      </section>
      <section>
        <h2>4. 방해물</h2>
        <button data-mode="pillar">기둥: 위치 클릭</button>
        <button data-mode="railing">난간: 두 점</button>
        <div id="obstacleForm" hidden>
          <label>반경(m, 기둥) <input id="obRadius" type="number" step="0.05" value="0.4" /></label>
          <label>높이(m) <input id="obHeight" type="number" step="0.1" value="1.0" /></label>
          <label>바닥 높이(m) <input id="obBase" type="number" step="0.1" value="0" /></label>
        </div>
        <ul id="obstacleList" class="section-list"></ul>
      </section>
      <section>
        <h2>5. 확인·내보내기</h2>
        <form id="gotoForm"><input id="gotoInput" placeholder="예: A구역 12열 7번" /><button type="submit">시야 보기</button></form>
        <button id="overviewBtn" type="button">전체 보기</button>
        <p id="seatTotal" class="status"></p>
        <button id="exportBtn" type="button" class="primary">venue.json 다운로드</button>
        <p id="exportErrors" class="error"></p>
      </section>
    </aside>
    <main class="work">
      <canvas id="image"></canvas>
      <p id="modeHint" class="hint"></p>
    </main>
  </div>
  <section class="preview" id="preview"></section>`

const $ = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T

let state: AdminState = loadState()
let mode: Mode = 'idle'
let clicks: Vec2[] = []          // 현재 모드에서 찍은 픽셀 점
let draftSection: GridSection | null = null
let form: SectionForm | null = null
let editingId: string | null = null

const preview = new Preview($('#preview'))
const canvas = new ImageCanvas($('#image'), state, { onClick: handleClick })

const HINTS: Record<Mode, string> = {
  idle: '좌석도 이미지를 올리고 1번부터 진행하세요. 휠로 확대, 드래그로 이동.',
  scale: '실제 거리를 아는 두 점을 차례로 클릭하세요 (예: 무대 양 끝).',
  origin: '무대 중앙을 클릭하세요. 이 점이 (0,0)이 됩니다.',
  audience: '관중석이 있는 쪽 아무 곳이나 클릭하세요.',
  stage: '무대 사각형의 마주보는 두 모서리를 클릭하세요.',
  polygon: '구역 윤곽을 따라 점을 클릭하세요. 무대에 가까운 변의 두 점을 먼저 찍습니다(좌석은 이 변 기준으로 열 수 × 열 간격만큼 배치되므로 다각형 깊이를 그에 맞추세요). 끝나면 "점 찍기 끝".',
  arc: '왼쪽 폼에서 호 파라미터를 조정하세요. 캘리브레이션이 끝났으면 이미지에 윤곽이 바로 표시됩니다.',
  pillar: '기둥 위치를 클릭하세요.',
  railing: '난간의 시작점과 끝점을 클릭하세요.',
  select: '수정할 구역을 클릭하세요.',
}

function persist(): void {
  const saved = saveState(state)
  canvas.setState(draftState())
  preview.rebuild(draftState().venue)
  renderLists()
  renderStatus()
  if (!saved) {
    $('#modeHint').textContent =
      '자동 저장 실패: 이미지가 너무 커서 브라우저 저장소 한도를 넘었습니다. 작업 내용은 화면에만 남아 있으니 JSON을 바로 다운로드하세요.'
  }
}

function setMode(m: Mode): void {
  mode = m
  clicks = []
  canvas.pendingPx = []
  $('#modeHint').textContent = HINTS[m]
  $('#scaleInput').hidden = true
  $('#polygonDone').hidden = m !== 'polygon'
  $('#obstacleForm').hidden = m !== 'pillar' && m !== 'railing'
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m))
  if (m !== 'polygon' && m !== 'arc' && m !== 'select') closeForm()
  if (m === 'arc') {
    editingId = null
    openForm('arc', [], null)
  }
  canvas.draw()
}

function requireCalibration(): boolean {
  if (isCalibrated(state.calibration)) return true
  alertMsg('먼저 스케일과 원점을 지정하세요.')
  return false
}

function alertMsg(text: string): void {
  $('#modeHint').textContent = text
}

function handleClick(px: Vec2): void {
  switch (mode) {
    case 'scale':
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      if (clicks.length === 2) $('#scaleInput').hidden = false
      canvas.draw()
      break
    case 'origin':
      state.calibration.originPx = px
      persist()
      setMode('idle')
      break
    case 'audience': {
      if (!state.calibration.originPx) { alertMsg('원점을 먼저 지정하세요.'); break }
      state.calibration.zSign = px[1] >= state.calibration.originPx[1] ? 1 : -1
      persist()
      setMode('idle')
      break
    }
    case 'stage': {
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      if (clicks.length < 2) break
      const a = pxToWorld(state.calibration, clicks[0])
      const b = pxToWorld(state.calibration, clicks[1])
      const w = Math.abs(a[0] - b[0])
      const d = Math.abs(a[1] - b[1])
      if (!(w > 0 && d > 0)) {
        alertMsg('무대 모서리 두 점이 한 줄에 있습니다. 다시 찍으세요.')
        clicks = []
        canvas.pendingPx = []
        canvas.draw()
        break
      }
      const cx = (a[0] + b[0]) / 2
      const cz = (a[1] + b[1]) / 2
      const h = state.venue.stage.size[1]
      state.venue.stage = { center: [cx, 0, cz], size: [w, h, d], facing: [0, 0, 1] }
      persist()
      setMode('idle')
      break
    }
    case 'polygon':
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      break
    case 'pillar': {
      if (!requireCalibration()) break
      const p = pxToWorld(state.calibration, px)
      state.venue.obstacles.push({
        type: 'pillar',
        position: [p[0], Number($<HTMLInputElement>('#obBase').value) || 0, p[1]],
        radius: Number($<HTMLInputElement>('#obRadius').value) || 0.4,
        height: Number($<HTMLInputElement>('#obHeight').value) || 1,
      })
      persist()
      break
    }
    case 'railing': {
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      if (clicks.length < 2) break
      const a = pxToWorld(state.calibration, clicks[0])
      const b = pxToWorld(state.calibration, clicks[1])
      const base = Number($<HTMLInputElement>('#obBase').value) || 0
      state.venue.obstacles.push({
        type: 'railing',
        from: [a[0], base, a[1]],
        to: [b[0], base, b[1]],
        height: Number($<HTMLInputElement>('#obHeight').value) || 1,
      })
      clicks = []
      canvas.pendingPx = []
      persist()
      break
    }
    case 'select': {
      if (!requireCalibration()) break
      const w = pxToWorld(state.calibration, px)
      const hit = state.venue.sections.find((s) => {
        try { return pointInPolygon(w, sectionOutline(s, state.venue.stage)) } catch { return false }
      })
      if (!hit) break
      if (!('rows' in hit)) { alertMsg('explicit 구역은 JSON에서 직접 수정하세요.'); break }
      const pts = hit.shape.type === 'polygon' ? hit.shape.points : []
      openForm(hit.shape.type, pts, hit)
      editingId = hit.id
      break
    }
    default:
      break
  }
}

function openForm(kind: 'polygon' | 'arc', points: Vec2[], initial: GridSection | null): void {
  closeForm()
  form = new SectionForm($('#sectionForm'), kind, points, initial, {
    onChange(section) {
      draftSection = section
      canvas.setState(draftState())
      preview.rebuild(draftState().venue)
    },
    onSave(section) {
      const dup = state.venue.sections.some((s) => s.id === section.id && s.id !== editingId)
      if (dup) { alertMsg(`구역 id "${section.id}"가 이미 있습니다.`); return }
      const idx = editingId ? state.venue.sections.findIndex((s) => s.id === editingId) : -1
      if (idx >= 0) state.venue.sections[idx] = section
      else state.venue.sections.push(section)
      draftSection = null
      editingId = null
      closeForm()
      persist()
      setMode('idle')
    },
    onCancel() {
      draftSection = null
      editingId = null
      closeForm()
      persist()
      setMode('idle')
    },
  })
}

/** 편집 중 구역을 포함한 상태 (캔버스 윤곽 표시용). 편집 중인 기존 구역은 초안으로 대체한다. */
function draftState(): AdminState {
  if (!draftSection) return state
  const d = draftSection
  const sections: Section[] = [...state.venue.sections.filter((s) => s.id !== d.id && s.id !== editingId), d]
  return { ...state, venue: { ...state.venue, sections } }
}

function closeForm(): void {
  form?.dispose()
  form = null
  draftSection = null
  editingId = null
}

function renderLists(): void {
  const sl = $('#sectionList')
  sl.innerHTML = state.venue.sections
    .map((s) => `<li>${escText(s.label ?? s.id)} <small>(${escText(s.id)}, ${s.shape.type})</small> <button data-del-section="${escText(s.id)}">삭제</button></li>`)
    .join('')
  sl.querySelectorAll<HTMLButtonElement>('[data-del-section]').forEach((b) =>
    b.addEventListener('click', () => {
      state.venue.sections = state.venue.sections.filter((s) => s.id !== b.dataset.delSection)
      persist()
    }),
  )
  const ol = $('#obstacleList')
  ol.innerHTML = state.venue.obstacles
    .map((o, i) => `<li>${o.type === 'pillar' ? '기둥' : '난간'} #${i + 1} <button data-del-obstacle="${i}">삭제</button></li>`)
    .join('')
  ol.querySelectorAll<HTMLButtonElement>('[data-del-obstacle]').forEach((b) =>
    b.addEventListener('click', () => {
      state.venue.obstacles.splice(Number(b.dataset.delObstacle), 1)
      persist()
    }),
  )
}

function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderStatus(): void {
  const c = state.calibration
  $('#calStatus').textContent = isCalibrated(c)
    ? `스케일 ${c.pxPerMeter.toFixed(2)} px/m · 원점 (${c.originPx[0]}, ${c.originPx[1]}) · 관중석 ${c.zSign === 1 ? '아래' : '위'}`
    : `스케일 ${c.pxPerMeter ? '완료' : '미지정'} · 원점 ${c.originPx ? '완료' : '미지정'}`
  const r = serializeVenue(state.venue)
  $('#seatTotal').textContent = r.ok ? `총 좌석 수: ${r.seatCount.toLocaleString('ko-KR')}석` : '총 좌석 수: (유효하지 않음)'
  const venueId = $<HTMLInputElement>('#venueId')
  if (venueId !== document.activeElement) venueId.value = state.venue.id
  const venueName = $<HTMLInputElement>('#venueName')
  if (venueName !== document.activeElement) venueName.value = state.venue.name
  const stageHeight = $<HTMLInputElement>('#stageHeight')
  if (stageHeight !== document.activeElement) stageHeight.value = String(state.venue.stage.size[1])
}

// --- 이벤트 연결 ---
root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
  b.addEventListener('click', () => setMode(b.dataset.mode as Mode)),
)

$('#scaleApply').addEventListener('click', () => {
  const meters = Number($<HTMLInputElement>('#scaleMeters').value)
  if (!(meters > 0) || clicks.length !== 2) return
  const px = Math.hypot(clicks[0][0] - clicks[1][0], clicks[0][1] - clicks[1][1])
  if (px === 0) { alertMsg('두 점이 같습니다. 다시 찍으세요.'); return }
  state.calibration.pxPerMeter = px / meters
  persist()
  setMode('idle')
})

$('#polygonDone').addEventListener('click', () => {
  if (!isCalibrated(state.calibration)) return
  if (clicks.length < 3) { alertMsg('점을 3개 이상 찍어야 합니다.'); return }
  const cal = state.calibration
  const points = clicks.map((p) => pxToWorld(cal, p))
  editingId = null
  openForm('polygon', points, null)
})

$('#venueId').addEventListener('change', (e) => { state.venue.id = (e.target as HTMLInputElement).value.trim(); persist() })
$('#venueName').addEventListener('change', (e) => { state.venue.name = (e.target as HTMLInputElement).value.trim(); persist() })
$('#stageHeight').addEventListener('change', (e) => {
  state.venue.stage.size[1] = Number((e.target as HTMLInputElement).value) || 0
  persist()
})

$('#imageFile').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(String(fr.result))
      fr.onerror = () => reject(fr.error)
      fr.readAsDataURL(file)
    })
    state.imageDataUrl = dataUrl
    await canvas.setImage(dataUrl)
  } catch {
    alertMsg('이미지를 불러올 수 없습니다.')
    state.imageDataUrl = null
  }
  input.value = ''
  persist()
})

$('#resetBtn').addEventListener('click', () => {
  // 브라우저 confirm 대신 두 번 클릭으로 확인
  const btn = $<HTMLButtonElement>('#resetBtn')
  if (btn.dataset.armed !== '1') {
    btn.dataset.armed = '1'
    btn.textContent = '정말 지우려면 한 번 더'
    setTimeout(() => { btn.dataset.armed = '0'; btn.textContent = '초안 지우기' }, 3000)
    return
  }
  clearState()
  location.reload()
})

$('#gotoForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const q = parseSeatQuery($<HTMLInputElement>('#gotoInput').value)
  if (!q || !preview.goTo(q)) alertMsg('좌석을 찾을 수 없습니다. 형식: A구역 12열 7번')
})

$('#overviewBtn').addEventListener('click', () => preview.overview())

$('#exportBtn').addEventListener('click', () => {
  const r = serializeVenue(state.venue)
  const errBox = $('#exportErrors')
  if (!r.ok) {
    errBox.textContent = r.errors.join('\n')
    return
  }
  errBox.textContent = ''
  downloadText('venue.json', r.json)
})

// --- 시작 ---
void (async () => {
  if (state.imageDataUrl) {
    try { await canvas.setImage(state.imageDataUrl) } catch { state.imageDataUrl = null }
  }
  persist()
  preview.overview()
  setMode('idle')
})()
