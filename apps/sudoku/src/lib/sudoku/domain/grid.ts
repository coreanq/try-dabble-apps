import type { CellIndex, CellValue, ConflictMap, ConflictPeerSet, Digit, Grid } from '@/lib/types';
import { NINE_BY_NINE, type SudokuLayout } from './layout.ts';


function forEachSetLike<T>(set: ReadonlySetLike<T>, callback: (value: T) => void): void {
  const iterator = set.keys();

  for (let next = iterator.next(); !next.done; next = iterator.next()) {
    callback(next.value);
  }
}

class ImmutableConflictSet implements ConflictPeerSet {
  readonly #values: Set<CellIndex>;

  constructor(values: Iterable<CellIndex>) {
    this.#values = new Set(values);
    Object.freeze(this);
  }

  get size(): number {
    return this.#values.size;
  }

  has(value: CellIndex): boolean {
    return this.#values.has(value);
  }

  entries(): SetIterator<[CellIndex, CellIndex]> {
    return this.#values.entries();
  }

  keys(): SetIterator<CellIndex> {
    return this.#values.keys();
  }

  values(): SetIterator<CellIndex> {
    return this.#values.values();
  }

  forEach(
    callbackfn: (value: CellIndex, value2: CellIndex, set: ReadonlySet<CellIndex>) => void,
    thisArg?: any,
  ): void {
    this.#values.forEach((value, value2) => callbackfn.call(thisArg, value, value2, this));
  }

  [Symbol.iterator](): SetIterator<CellIndex> {
    return this.#values[Symbol.iterator]();
  }

  union<U>(other: ReadonlySetLike<U>): Set<CellIndex | U> {
    const result = new Set<CellIndex | U>(this.#values);
    forEachSetLike(other, (value) => result.add(value));
    return result;
  }

  intersection<U>(other: ReadonlySetLike<U>): Set<CellIndex & U> {
    const result = new Set<CellIndex & U>();

    for (const value of this.#values) {
      if ((other as ReadonlySetLike<unknown>).has(value)) {
        result.add(value as CellIndex & U);
      }
    }

    return result;
  }

  difference<U>(other: ReadonlySetLike<U>): Set<CellIndex> {
    const result = new Set<CellIndex>();

    for (const value of this.#values) {
      if (!(other as ReadonlySetLike<unknown>).has(value)) {
        result.add(value);
      }
    }

    return result;
  }

  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<CellIndex | U> {
    const result = this.difference(other) as Set<CellIndex | U>;

    forEachSetLike(other, (value) => {
      if (!this.#values.has(value as CellIndex)) {
        result.add(value);
      }
    });

    return result;
  }

  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    return [...this.#values].every((value) => other.has(value));
  }

  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    let isSuperset = true;
    forEachSetLike(other, (value) => {
      if (!this.#values.has(value as CellIndex)) {
        isSuperset = false;
      }
    });
    return isSuperset;
  }

  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    let isDisjoint = true;
    forEachSetLike(other, (value) => {
      if (this.#values.has(value as CellIndex)) {
        isDisjoint = false;
      }
    });
    return isDisjoint;
  }
}

class ImmutableConflictMap implements ConflictMap {
  readonly #entries: Map<CellIndex, ConflictPeerSet>;

  constructor(conflicts: ReadonlyMap<CellIndex, ReadonlySet<CellIndex>>) {
    this.#entries = new Map(
      [...conflicts].map(([index, peers]) => [index, new ImmutableConflictSet(peers)]),
    );
    Object.freeze(this);
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: CellIndex): ConflictPeerSet | undefined {
    return this.#entries.get(key);
  }

  has(key: CellIndex): boolean {
    return this.#entries.has(key);
  }

  entries(): MapIterator<[CellIndex, ConflictPeerSet]> {
    return this.#entries.entries();
  }

  keys(): MapIterator<CellIndex> {
    return this.#entries.keys();
  }

  values(): MapIterator<ConflictPeerSet> {
    return this.#entries.values();
  }

  forEach(
    callbackfn: (value: ConflictPeerSet, key: CellIndex, map: ReadonlyMap<CellIndex, ConflictPeerSet>) => void,
    thisArg?: any,
  ): void {
    this.#entries.forEach((value, key) => callbackfn.call(thisArg, value, key, this));
  }

  [Symbol.iterator](): MapIterator<[CellIndex, ConflictPeerSet]> {
    return this.#entries[Symbol.iterator]();
  }
}

const peerCache = new WeakMap<SudokuLayout, readonly (readonly CellIndex[])[]>();

function peersFor(layout: SudokuLayout): readonly (readonly CellIndex[])[] {
  const cached = peerCache.get(layout);
  if (cached) {
    return cached;
  }

  const peers = Object.freeze(Array.from(
    { length: layout.cellCount },
    (_, index) => {
      const row = Math.floor(index / layout.size);
      const column = index % layout.size;
      const boxRow = Math.floor(row / layout.boxRows) * layout.boxRows;
      const boxColumn = Math.floor(column / layout.boxColumns) * layout.boxColumns;
      const cellPeers = new Set<CellIndex>();

      for (let coordinate = 0; coordinate < layout.size; coordinate += 1) {
        cellPeers.add(row * layout.size + coordinate);
        cellPeers.add(coordinate * layout.size + column);
      }

      for (let rowOffset = 0; rowOffset < layout.boxRows; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < layout.boxColumns; columnOffset += 1) {
          cellPeers.add((boxRow + rowOffset) * layout.size + boxColumn + columnOffset);
        }
      }

      cellPeers.delete(index);
      return Object.freeze([...cellPeers]);
    },
  ));
  peerCache.set(layout, peers);
  return peers;
}

function assertCellIndex(index: CellIndex, layout: SudokuLayout): void {
  if (!Number.isInteger(index) || index < 0 || index >= layout.cellCount) {
    throw new RangeError(`Cell index must be an integer from 0 to ${layout.cellCount - 1}.`);
  }
}

export function parseGrid(encoded: string, layout: SudokuLayout = NINE_BY_NINE): Grid {
  if (encoded.length !== layout.cellCount) {
    throw new Error(`A Sudoku puzzle must contain exactly ${layout.cellCount} cells.`);
  }

  const validPattern = new RegExp(`^[0-${layout.size}]+$`);
  if (!validPattern.test(encoded)) {
    throw new Error(`A Sudoku puzzle may contain only digits 0-${layout.size}.`);
  }

  return Object.freeze(
    [...encoded].map((character): CellValue => {
      const value = Number(character);
      return value === 0 ? null : (value as Digit);
    }),
  );
}

export function serializeGrid(grid: Grid): string {
  return grid.map((value) => (value === null ? '0' : String(value))).join('');
}

export function candidatesFor(
  grid: Grid,
  index: CellIndex,
  layout: SudokuLayout = NINE_BY_NINE,
): ReadonlySet<Digit> {
  assertCellIndex(index, layout);

  if (grid[index] !== null) {
    return new Set<Digit>();
  }

  const used = new Set(
    peersFor(layout)[index]!
      .map((peer) => grid[peer])
      .filter((value): value is Digit => value !== null),
  );
  return new Set(layout.digits.filter((digit) => !used.has(digit)));
}

export function findConflicts(
  grid: Grid,
  layout: SudokuLayout = NINE_BY_NINE,
): ConflictMap {
  const conflicts = new Map<CellIndex, Set<CellIndex>>();
  const peers = peersFor(layout);

  for (let index = 0; index < layout.cellCount; index += 1) {
    const value = grid[index];
    if (value === null) {
      continue;
    }

    for (const peer of peers[index]!) {
      if (value !== grid[peer]) {
        continue;
      }

      const indexConflicts = conflicts.get(index) ?? new Set<CellIndex>();
      indexConflicts.add(peer);
      conflicts.set(index, indexConflicts);

      const peerConflicts = conflicts.get(peer) ?? new Set<CellIndex>();
      peerConflicts.add(index);
      conflicts.set(peer, peerConflicts);
    }
  }

  return new ImmutableConflictMap(conflicts);
}
