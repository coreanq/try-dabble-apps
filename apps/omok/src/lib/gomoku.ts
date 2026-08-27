/**
 * The engine, lifted out of the pre-Vite src/app/page.tsx where it lived
 * inside the component. Same board rules, same pattern table, same move
 * priorities and the same depth-3 minimax for hard, so the AI plays exactly
 * as strongly as it did before the rewrite — it is just callable now, and
 * testable without a DOM.
 */

export const BOARD_SIZE = 15;

export type Player = "black" | "white";
export type CellState = Player | null;
export type Board = CellState[][];
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "ai" | "pvp";
export type Outcome = Player | "draw";
export interface Move {
  row: number;
  col: number;
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null as CellState),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** Five or more of the stone at (row, col) through that point, any direction. */
export function checkWin(board: Board, row: number, col: number): boolean {
  const player = board[row][col];
  if (!player) return false;

  for (const [dx, dy] of DIRECTIONS) {
    let count = 1;

    for (let i = 1; i < 5; i++) {
      const r = row + dx * i;
      const c = col + dy * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
      } else break;
    }

    for (let i = 1; i < 5; i++) {
      const r = row - dx * i;
      const c = col - dy * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
      } else break;
    }

    if (count >= 5) return true;
  }

  return false;
}

export function checkDraw(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

/** The winning run through (row, col), for drawing the line on the goban. */
export function winningLine(board: Board, row: number, col: number): Move[] | null {
  const player = board[row][col];
  if (!player) return null;

  for (const [dx, dy] of DIRECTIONS) {
    const line: Move[] = [{ row, col }];

    for (let i = 1; i < 5; i++) {
      const r = row + dx * i;
      const c = col + dy * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        line.push({ row: r, col: c });
      } else break;
    }

    for (let i = 1; i < 5; i++) {
      const r = row - dx * i;
      const c = col - dy * i;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        line.unshift({ row: r, col: c });
      } else break;
    }

    if (line.length >= 5) return line;
  }

  return null;
}

// ============================================
// Pattern-based threat detection
// ============================================

// Pattern scores based on research from tournament-winning Gomoku AI
// Reference: https://sortingsearching.com/2020/05/18/gomoku.html
const SCORES = {
  FIVE: 10000000, // Winning
  OPEN_FOUR: 500000, // Unstoppable (two ways to win)
  BLOCKED_FOUR: 50000, // Must block (one way to win)
  OPEN_THREE: 50000, // Very dangerous (becomes open four)
  BLOCKED_THREE: 5000, // Somewhat dangerous
  OPEN_TWO: 500, // Building potential
  BLOCKED_TWO: 50, // Minor threat
  ONE: 10, // Single stone influence
};

type Pattern =
  | "five"
  | "open_four"
  | "blocked_four"
  | "open_three"
  | "blocked_three"
  | "open_two"
  | "blocked_two"
  | "one"
  | "dead"
  | "none";

/** Run length and open ends through (row, col) along one direction. */
function analyzeLine(
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  player: Player,
): { count: number; openEnds: number; pattern: Pattern } {
  let count = 1; // Count the center stone
  let openEnds = 0;

  // Scan in positive direction
  let i = 1;
  while (i <= 4) {
    const r = row + dx * i;
    const c = col + dy * i;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
    if (board[r][c] === player) {
      count++;
      i++;
    } else if (board[r][c] === null) {
      openEnds++;
      break;
    } else break;
  }

  // Scan in negative direction
  i = 1;
  while (i <= 4) {
    const r = row - dx * i;
    const c = col - dy * i;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
    if (board[r][c] === player) {
      count++;
      i++;
    } else if (board[r][c] === null) {
      openEnds++;
      break;
    } else break;
  }

  let pattern: Pattern = "none";
  if (count >= 5) pattern = "five";
  else if (count === 4) pattern = openEnds === 2 ? "open_four" : openEnds === 1 ? "blocked_four" : "dead";
  else if (count === 3) pattern = openEnds === 2 ? "open_three" : openEnds === 1 ? "blocked_three" : "dead";
  else if (count === 2) pattern = openEnds === 2 ? "open_two" : openEnds === 1 ? "blocked_two" : "dead";
  else if (count === 1) pattern = openEnds === 2 ? "one" : "dead";

  return { count, openEnds, pattern };
}

/** Every pattern a player holds on the whole board, counted once per run. */
function scanBoardPatterns(board: Board, player: Player) {
  const counted = new Set<string>();

  let fives = 0,
    openFours = 0,
    blockedFours = 0;
  let openThrees = 0,
    blockedThrees = 0,
    openTwos = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== player) continue;

      for (const [dx, dy] of DIRECTIONS) {
        const key = `${r},${c},${dx},${dy}`;
        if (counted.has(key)) continue;

        const { pattern } = analyzeLine(board, r, c, dx, dy, player);

        // Mark the rest of this run as counted for this direction
        let i = 1;
        for (;;) {
          const nr = r + dx * i;
          const nc = c + dy * i;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
          if (board[nr][nc] !== player) break;
          counted.add(`${nr},${nc},${dx},${dy}`);
          i++;
        }

        switch (pattern) {
          case "five": fives++; break;
          case "open_four": openFours++; break;
          case "blocked_four": blockedFours++; break;
          case "open_three": openThrees++; break;
          case "blocked_three": blockedThrees++; break;
          case "open_two": openTwos++; break;
        }
      }
    }
  }

  return { fives, openFours, blockedFours, openThrees, blockedThrees, openTwos };
}

/** What one stone at (row, col) would be worth to `player`. */
function evaluateMove(board: Board, row: number, col: number, player: Player): number {
  let score = 0;
  let openFours = 0;
  let blockedFours = 0;
  let openThrees = 0;

  const testBoard = cloneBoard(board);
  testBoard[row][col] = player;

  for (const [dx, dy] of DIRECTIONS) {
    const { pattern } = analyzeLine(testBoard, row, col, dx, dy, player);

    switch (pattern) {
      case "five": score += SCORES.FIVE; break;
      case "open_four":
        score += SCORES.OPEN_FOUR;
        openFours++;
        break;
      case "blocked_four":
        score += SCORES.BLOCKED_FOUR;
        blockedFours++;
        break;
      case "open_three":
        score += SCORES.OPEN_THREE;
        openThrees++;
        break;
      case "blocked_three": score += SCORES.BLOCKED_THREE; break;
      case "open_two": score += SCORES.OPEN_TWO; break;
      case "blocked_two": score += SCORES.BLOCKED_TWO; break;
      case "one": score += SCORES.ONE; break;
    }
  }

  // Double threat bonus (guaranteed win)
  if (openFours >= 1 || blockedFours >= 2 || (blockedFours >= 1 && openThrees >= 1)) {
    score += SCORES.OPEN_FOUR;
  }
  if (openThrees >= 2) {
    score += SCORES.OPEN_FOUR * 0.8;
  }

  // Center preference
  const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
  score += (14 - centerDist) * 2;

  return score;
}

function detectThreats(board: Board, row: number, col: number, player: Player) {
  const testBoard = cloneBoard(board);
  testBoard[row][col] = player;

  let fiveCount = 0;
  let openFourCount = 0;
  let blockedFourCount = 0;
  let openThreeCount = 0;

  for (const [dx, dy] of DIRECTIONS) {
    const { pattern } = analyzeLine(testBoard, row, col, dx, dy, player);

    if (pattern === "five") fiveCount++;
    if (pattern === "open_four") openFourCount++;
    if (pattern === "blocked_four") blockedFourCount++;
    if (pattern === "open_three") openThreeCount++;
  }

  return {
    createsFive: fiveCount > 0,
    createsOpenFour: openFourCount > 0,
    createsBlockedFour: blockedFourCount > 0,
    createsOpenThree: openThreeCount > 0,
    createsDoubleThree: openThreeCount >= 2,
  };
}

/** Empty points within two cells of a stone — the only ones worth reading. */
function getCandidateMoves(board: Board): Move[] {
  const candidates: Move[] = [];
  const visited = new Set<string>();

  const hasStones = board.some((row) => row.some((cell) => cell !== null));
  if (!hasStones) return [{ row: 7, col: 7 }];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (
            nr >= 0 && nr < BOARD_SIZE &&
            nc >= 0 && nc < BOARD_SIZE &&
            !board[nr][nc] &&
            !visited.has(key)
          ) {
            visited.add(key);
            candidates.push({ row: nr, col: nc });
          }
        }
      }
    }
  }

  return candidates;
}

function checkBoardWin(board: Board, player: Player): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player && checkWin(board, r, c)) return true;
    }
  }
  return false;
}

function evaluateBoard(board: Board, aiPlayer: Player, humanPlayer: Player): number {
  const ai = scanBoardPatterns(board, aiPlayer);
  const human = scanBoardPatterns(board, humanPlayer);

  let score = 0;

  score += ai.fives * SCORES.FIVE;
  score += ai.openFours * SCORES.OPEN_FOUR;
  score += ai.blockedFours * SCORES.BLOCKED_FOUR;
  score += ai.openThrees * SCORES.OPEN_THREE;
  score += ai.blockedThrees * SCORES.BLOCKED_THREE;
  score += ai.openTwos * SCORES.OPEN_TWO;

  // Human patterns weigh a little heavier, so the AI defends first
  score -= human.fives * SCORES.FIVE;
  score -= human.openFours * SCORES.OPEN_FOUR * 1.2;
  score -= human.blockedFours * SCORES.BLOCKED_FOUR * 1.1;
  score -= human.openThrees * SCORES.OPEN_THREE * 1.2;
  score -= human.blockedThrees * SCORES.BLOCKED_THREE;
  score -= human.openTwos * SCORES.OPEN_TWO;

  return score;
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: Player,
  humanPlayer: Player,
): number {
  if (checkBoardWin(board, aiPlayer)) return SCORES.FIVE + depth;
  if (checkBoardWin(board, humanPlayer)) return -SCORES.FIVE - depth;
  if (depth === 0) return evaluateBoard(board, aiPlayer, humanPlayer);

  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return 0;

  const sortedMoves = candidates
    .map((pos) => ({
      ...pos,
      score: evaluateMove(board, pos.row, pos.col, isMaximizing ? aiPlayer : humanPlayer),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      const testBoard = cloneBoard(board);
      testBoard[move.row][move.col] = aiPlayer;
      const evalScore = minimax(testBoard, depth - 1, false, alpha, beta, aiPlayer, humanPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of sortedMoves) {
    const testBoard = cloneBoard(board);
    testBoard[move.row][move.col] = humanPlayer;
    const evalScore = minimax(testBoard, depth - 1, true, alpha, beta, aiPlayer, humanPlayer);
    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) break;
  }
  return minEval;
}

/**
 * The AI plays white. Easy defends only the moves that would lose on the
 * spot, medium scores every candidate, hard reads three plies past the top
 * twelve of those.
 */
export function getAIMove(board: Board, difficulty: Difficulty): Move | null {
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) return null;

  const aiPlayer: Player = "white";
  const humanPlayer: Player = "black";

  if (difficulty === "easy") {
    // 1. Win if it can
    for (const pos of candidates) {
      if (detectThreats(board, pos.row, pos.col, aiPlayer).createsFive) return pos;
    }
    // 2. Block a five
    for (const pos of candidates) {
      if (detectThreats(board, pos.row, pos.col, humanPlayer).createsFive) return pos;
    }
    // 3. Block an open three
    for (const pos of candidates) {
      if (detectThreats(board, pos.row, pos.col, humanPlayer).createsOpenThree) return pos;
    }
    // 4. Otherwise anywhere near the stones
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Priority 1: Immediate win (create five)
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, aiPlayer).createsFive) return pos;
  }

  // Priority 2: Block opponent's winning move
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, humanPlayer).createsFive) return pos;
  }

  // Priority 3: Create open four (unstoppable)
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, aiPlayer).createsOpenFour) return pos;
  }

  // Priority 4: Block opponent's open four
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, humanPlayer).createsOpenFour) return pos;
  }

  // Priority 5: Create double blocked-four (guaranteed win)
  for (const pos of candidates) {
    const testBoard = cloneBoard(board);
    testBoard[pos.row][pos.col] = aiPlayer;

    let blockedFours = 0;
    for (const [dx, dy] of DIRECTIONS) {
      const { pattern } = analyzeLine(testBoard, pos.row, pos.col, dx, dy, aiPlayer);
      if (pattern === "blocked_four") blockedFours++;
    }
    if (blockedFours >= 2) return pos;
  }

  // Priority 6: Block opponent's blocked four
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, humanPlayer).createsBlockedFour) return pos;
  }

  // Priority 7: Create open three
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, aiPlayer).createsOpenThree) return pos;
  }

  // Priority 8: Block opponent's open three (CRITICAL)
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, humanPlayer).createsOpenThree) return pos;
  }

  // Priority 9: Block opponent's double three
  for (const pos of candidates) {
    if (detectThreats(board, pos.row, pos.col, humanPlayer).createsDoubleThree) return pos;
  }

  // Medium/hard fall through to scoring
  const scoredMoves = candidates
    .map((pos) => {
      const aiScore = evaluateMove(board, pos.row, pos.col, aiPlayer);
      const blockScore = evaluateMove(board, pos.row, pos.col, humanPlayer) * 1.1;
      return { ...pos, score: aiScore + blockScore };
    })
    .sort((a, b) => b.score - a.score);

  if (difficulty === "hard") {
    const topMoves = scoredMoves.slice(0, 12);
    let bestMove = topMoves[0];
    let bestScore = -Infinity;

    for (const pos of topMoves) {
      const testBoard = cloneBoard(board);
      testBoard[pos.row][pos.col] = aiPlayer;
      const score = minimax(testBoard, 3, false, -Infinity, Infinity, aiPlayer, humanPlayer);

      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      }
    }

    return { row: bestMove.row, col: bestMove.col };
  }

  const best = scoredMoves[0] ?? candidates[0];
  return { row: best.row, col: best.col };
}
