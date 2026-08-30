export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CellValue = Digit | null;

export type Grid = ReadonlyArray<CellValue>;

export type CellIndex = number;

export type PointerKind = 'pencil' | 'touch' | 'mouse' | 'unknown';

export type PointerPhase = 'down' | 'move' | 'up' | 'cancel';

export interface NormalizedPointer {
  readonly kind: PointerKind;
  readonly phase: PointerPhase;
  readonly x: number;
  readonly y: number;
  readonly pressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly hovering: boolean;
}

export interface ConflictPeerSet extends ReadonlySet<CellIndex> {}

export interface ConflictMap extends ReadonlyMap<CellIndex, ConflictPeerSet> {}
