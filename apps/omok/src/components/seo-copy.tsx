/**
 * Crawler and screen-reader copy. The visible page is a board, so the words a
 * search engine needs live here, off-screen, in Korean and English — the same
 * block the pre-Vite page carried.
 */
export function SeoCopy() {
  return (
    <section className="gb-sr" aria-label="오목 게임 정보">
      <h2>오목 온라인 - 무료 AI 오목 게임</h2>
      <p>
        오목(Omok, Gomoku, 五目並べ)은 15×15 바둑판 위에서 두 명이 번갈아 돌을 놓아 가로, 세로,
        대각선으로 5개를 연속으로 먼저 놓는 사람이 이기는 전략 보드게임입니다.
      </p>
      <h3>오목 규칙</h3>
      <p>
        흑돌이 먼저 시작하며, 두 플레이어가 번갈아 가며 바둑판 교차점에 돌을 놓습니다. 가로, 세로,
        대각선 어느 방향이든 자신의 돌 5개를 연속으로 먼저 놓으면 승리합니다. 전략적 사고와 상대의
        수를 읽는 능력이 중요한 게임입니다.
      </p>
      <h3>Play Omok Online Free</h3>
      <p>
        Play Omok (Gomoku) online for free in your browser. Challenge AI opponents with 3 difficulty
        levels or play with a friend in 2-player mode. No download or sign-up required. Works on
        desktop, tablet, and mobile devices.
      </p>
    </section>
  );
}
