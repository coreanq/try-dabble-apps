import type { ArcSection, GridSection, PolygonSection } from '../core/venue-schema'
import type { Vec2 } from '../core/section-outline'
import { IDENTIFIER, ROW_LABEL } from '../core/venue-schema'

export interface SectionFormCallbacks {
  onChange: (section: GridSection | null) => void
  onSave: (section: GridSection) => void
  onCancel: () => void
}

export interface Fields {
  id: string
  label: string
  rows: number
  rowDepth: number
  riser: number
  baseHeight: number
  seatsPerRow: string
  rowLabels: string
  seatNumbering: 'left-to-right' | 'right-to-left'
  // arc 전용
  centerX: number
  centerZ: number
  radiusStart: number
  angleStart: number
  angleEnd: number
}


function parseSeatsPerRow(text: string, rows: number): number | number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean).map(Number)
  if (parts.length === 0 || parts.some((n) => !Number.isInteger(n) || n <= 0)) return null
  if (parts.length === 1) return parts[0]
  if (parts.length === rows) return parts
  return null
}

function parseRowLabels(text: string, rows: number): 'numeric' | string[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean)
  if (parts.length === 0) return 'numeric'
  if (parts.length !== rows) return null
  if (parts.some((p) => !ROW_LABEL.test(p))) return null
  if (new Set(parts).size !== parts.length) return null
  return parts
}

export function buildSection(f: Fields, kind: 'polygon' | 'arc', points: Vec2[]): GridSection | null {
  const id = f.id.trim()
  const seatsPerRow = parseSeatsPerRow(f.seatsPerRow, f.rows)
  const rowLabels = parseRowLabels(f.rowLabels, f.rows)
  if (
    !IDENTIFIER.test(id) ||
    !seatsPerRow ||
    !rowLabels ||
    !Number.isInteger(f.rows) ||
    f.rows < 1 ||
    f.rowDepth <= 0 ||
    f.riser < 0 ||
    [f.rows, f.rowDepth, f.riser, f.baseHeight].some((n) => !Number.isFinite(n))
  )
    return null
  const base = {
    id,
    label: f.label.trim() || undefined,
    rows: f.rows,
    rowDepth: f.rowDepth,
    riser: f.riser,
    baseHeight: f.baseHeight,
    seatsPerRow,
    rowLabels,
    seatNumbering: f.seatNumbering,
  }
  if (kind === 'polygon') {
    if (points.length < 3) return null
    const s: PolygonSection = { ...base, shape: { type: 'polygon', points } }
    return s
  }
  if (
    f.radiusStart <= 0 ||
    f.angleEnd <= f.angleStart ||
    [f.centerX, f.centerZ, f.radiusStart, f.angleStart, f.angleEnd].some((n) => !Number.isFinite(n))
  )
    return null
  const s: ArcSection = {
    ...base,
    shape: { type: 'arc', center: [f.centerX, f.centerZ], radiusStart: f.radiusStart, angleStart: f.angleStart, angleEnd: f.angleEnd },
  }
  return s
}

const num = (name: string, label: string, value: number, step = '0.05') =>
  `<label>${label}<input name="${name}" type="number" step="${step}" value="${value}" /></label>`

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export class SectionForm {
  private form: HTMLFormElement

  constructor(
    private container: HTMLElement,
    private kind: 'polygon' | 'arc',
    private points: Vec2[],
    initial: GridSection | null,
    private cb: SectionFormCallbacks,
  ) {
    const init = initial
    const arc = init?.shape.type === 'arc' ? init.shape : null
    const seatsPerRowText = Array.isArray(init?.seatsPerRow) ? init.seatsPerRow.join(',') : String(init?.seatsPerRow ?? 20)
    const rowLabelsText = Array.isArray(init?.rowLabels) ? init.rowLabels.join(',') : ''
    container.innerHTML = `
      <form class="section-form">
        <h3>${kind === 'polygon' ? `다각형 구역 (점 ${points.length}개)` : '호(arc) 구역'}</h3>
        <label>구역 id<input name="id" value="${escAttr(init?.id ?? '')}" required /></label>
        <label>표시 이름<input name="label" value="${escAttr(init?.label ?? '')}" /></label>
        ${num('rows', '열 수', init?.rows ?? 10, '1')}
        ${num('rowDepth', '열 간격(m)', init?.rowDepth ?? 0.9)}
        ${num('riser', '열당 단차(m)', init?.riser ?? 0.35)}
        ${num('baseHeight', '1열 바닥 높이(m)', init?.baseHeight ?? 0)}
        <label>열당 좌석 수 (하나 또는 열 수만큼 쉼표 구분)
          <input name="seatsPerRow" value="${escAttr(seatsPerRowText)}" /></label>
        <label>열 이름 (비우면 1,2,3…)
          <input name="rowLabels" value="${escAttr(rowLabelsText)}" /></label>
        <label>번호 방향
          <select name="seatNumbering">
            <option value="left-to-right" ${init?.seatNumbering !== 'right-to-left' ? 'selected' : ''}>왼쪽→오른쪽</option>
            <option value="right-to-left" ${init?.seatNumbering === 'right-to-left' ? 'selected' : ''}>오른쪽→왼쪽</option>
          </select></label>
        ${kind === 'arc' ? `
          <fieldset><legend>호 정의 (m, 도)</legend>
            ${num('centerX', '중심 X', arc?.center[0] ?? 0)}
            ${num('centerZ', '중심 Z', arc?.center[1] ?? 0)}
            ${num('radiusStart', '시작 반경', arc?.radiusStart ?? 30)}
            ${num('angleStart', '시작 각도', arc?.angleStart ?? -30, '1')}
            ${num('angleEnd', '끝 각도', arc?.angleEnd ?? 30, '1')}
          </fieldset>` : ''}
        <p class="form-error" hidden></p>
        <div class="actions"><button type="submit">구역 저장</button><button type="button" data-cancel>취소</button></div>
      </form>`
    this.form = container.querySelector('form')!
    this.form.addEventListener('input', () => {
      this.form.querySelector<HTMLElement>('.form-error')!.hidden = true
      this.cb.onChange(this.read())
    })
    this.form.addEventListener('submit', (e) => {
      e.preventDefault()
      const s = this.read()
      const err = this.form.querySelector<HTMLElement>('.form-error')!
      if (!s) {
        err.textContent = '입력을 확인하세요: id(공백/|/,// 불가), 열 수, 열당 좌석 수(열 수와 개수 일치), 호 각도'
        err.hidden = false
        return
      }
      this.cb.onSave(s)
    })
    this.form.querySelector('[data-cancel]')!.addEventListener('click', () => this.cb.onCancel())
    this.cb.onChange(this.read())
  }

  private read(): GridSection | null {
    const d = new FormData(this.form)
    const n = (k: string) => Number(d.get(k) ?? 0)
    const f: Fields = {
      id: String(d.get('id') ?? ''),
      label: String(d.get('label') ?? ''),
      rows: n('rows'),
      rowDepth: n('rowDepth'),
      riser: n('riser'),
      baseHeight: n('baseHeight'),
      seatsPerRow: String(d.get('seatsPerRow') ?? ''),
      rowLabels: String(d.get('rowLabels') ?? ''),
      seatNumbering: d.get('seatNumbering') === 'right-to-left' ? 'right-to-left' : 'left-to-right',
      centerX: n('centerX'),
      centerZ: n('centerZ'),
      radiusStart: n('radiusStart'),
      angleStart: n('angleStart'),
      angleEnd: n('angleEnd'),
    }
    return buildSection(f, this.kind, this.points)
  }

  dispose(): void {
    this.container.innerHTML = ''
  }
}
