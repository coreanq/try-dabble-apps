import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_SIZE,
  checkDraw,
  checkWin,
  cloneBoard,
  emptyBoard,
  getAIMove,
  winningLine,
} from "../src/lib/gomoku.ts";

function place(board, player, cells) {
  for (const [row, col] of cells) board[row][col] = player;
  return board;
}

test("an empty board is 15 x 15 and not a draw", () => {
  const board = emptyBoard();
  assert.equal(board.length, BOARD_SIZE);
  assert.equal(board[0].length, BOARD_SIZE);
  assert.equal(checkDraw(board), false);
});

test("five in a row wins in every direction", () => {
  const cases = [
    [[7, 3], [7, 4], [7, 5], [7, 6], [7, 7]], // across
    [[3, 7], [4, 7], [5, 7], [6, 7], [7, 7]], // down
    [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7]], // down-right
    [[3, 11], [4, 10], [5, 9], [6, 8], [7, 7]], // down-left
  ];
  for (const cells of cases) {
    const board = place(emptyBoard(), "black", cells);
    assert.equal(checkWin(board, 7, 7), true);
    assert.equal(winningLine(board, 7, 7).length, 5);
  }
});

test("four in a row does not win", () => {
  const board = place(emptyBoard(), "black", [[7, 4], [7, 5], [7, 6], [7, 7]]);
  assert.equal(checkWin(board, 7, 7), false);
  assert.equal(winningLine(board, 7, 7), null);
});

test("a run of five broken by the other colour does not win", () => {
  const board = place(emptyBoard(), "black", [[7, 3], [7, 4], [7, 6], [7, 7]]);
  board[7][5] = "white";
  assert.equal(checkWin(board, 7, 7), false);
});

test("a full board is a draw", () => {
  const board = emptyBoard();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = (r + c) % 2 ? "black" : "white";
  }
  assert.equal(checkDraw(board), true);
});

test("the AI opens on the centre point", () => {
  assert.deepEqual(getAIMove(emptyBoard(), "medium"), { row: 7, col: 7 });
});

for (const difficulty of ["easy", "medium", "hard"]) {
  test(`${difficulty} blocks black's open four`, () => {
    const board = place(emptyBoard(), "black", [[7, 4], [7, 5], [7, 6], [7, 7]]);
    board[9][9] = "white";
    const move = getAIMove(board, difficulty);
    assert.ok(move, "the AI must answer");
    assert.equal(move.row, 7);
    assert.ok(move.col === 3 || move.col === 8, `blocked at col ${move.col}`);
  });

  test(`${difficulty} takes its own five when offered`, () => {
    const board = place(emptyBoard(), "white", [[5, 4], [5, 5], [5, 6], [5, 7]]);
    place(board, "black", [[7, 4], [7, 5], [7, 6]]);
    const move = getAIMove(board, difficulty);
    assert.ok(move);
    const next = cloneBoard(board);
    next[move.row][move.col] = "white";
    assert.equal(checkWin(next, move.row, move.col), true);
  });
}

test("the AI only plays empty points", () => {
  let board = place(emptyBoard(), "black", [[7, 7]]);
  for (let i = 0; i < 6; i++) {
    const move = getAIMove(board, "hard");
    assert.ok(move);
    assert.equal(board[move.row][move.col], null);
    board = cloneBoard(board);
    board[move.row][move.col] = "white";
    board[(move.row + 3) % BOARD_SIZE][(move.col + 5) % BOARD_SIZE] ??= "black";
  }
});
