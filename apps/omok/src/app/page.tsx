'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BOARD_SIZE = 15;

type Player = 'black' | 'white';
type Board = (Player | null)[][];
type GameMode = 'ai' | 'pvp'; // AI 대결 또는 2인 대결

const LOCAL_ONLY: Record<string, string> = {
  ko: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  en: 'Your data stays on this device. Nothing is sent to our servers.',
  ja: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  zh: '数据仅保存在此设备，不会上传到服务器。',
};

type UiLang = 'ko' | 'en' | 'ja' | 'zh';

const UI: Record<UiLang, {
  title: string;
  titleSub: string;
  modeSubtitle: string;
  vsAi: string;
  vsAiDesc: string;
  vsPvp: string;
  vsPvpDesc: string;
  undo: string;
  restart: string;
  mode: string;
  changeMode: string;
  blackTurn: string;
  whiteTurn: string;
  blackTurnP1: string;
  whiteTurnP2: string;
  easy: string;
  medium: string;
  hard: string;
  difficulty: string;
  thinking: string;
  draw: string;
  blackWins: string;
  whiteWins: string;
  blackWinShort: string;
  whiteWinShort: string;
  reviewBoard: string;
  showResult: string;
  moves: string;
  totalMoves: string;
  congratulations: string;
  tryNextTime: string;
  goodGame: string;
  soundOff: string;
  soundOn: string;
  howToLi1: string;
  howToLi2: string;
  howToLi3: string;
  howToLi4: string;
  howToLi5: string;
  howToLi6: string;
}> = {
  ko: {
    title: '오목',
    titleSub: '五目並べ',
    modeSubtitle: '게임 모드를 선택하세요',
    vsAi: 'AI 대결',
    vsAiDesc: '인공지능과 대결합니다',
    vsPvp: '2인 대결',
    vsPvpDesc: '친구와 번갈아 둡니다',
    undo: '무르기',
    restart: '다시하기',
    mode: '모드',
    changeMode: '모드 변경',
    blackTurn: '흑 차례',
    whiteTurn: '백 차례',
    blackTurnP1: '흑 차례 (1P)',
    whiteTurnP2: '백 차례 (2P)',
    easy: '초급',
    medium: '중급',
    hard: '고급',
    difficulty: '난이도',
    thinking: 'AI 생각중...',
    draw: '무승부',
    blackWins: '흑의 승리',
    whiteWins: '백의 승리',
    blackWinShort: '흑 승리',
    whiteWinShort: '백 승리',
    reviewBoard: '기보 검토',
    showResult: '결과 보기',
    moves: '수순',
    totalMoves: '총 {n}수',
    congratulations: '축하합니다!',
    tryNextTime: '다음에는 이겨보세요',
    goodGame: '좋은 대국이었습니다',
    soundOff: '소리 끄기',
    soundOn: '소리 켜기',
    howToLi1: 'AI 대결 모드: 초급, 중급, 고급 3단계 난이도의 인공지능과 대결',
    howToLi2: '2인 대결 모드: 한 기기에서 친구와 함께 오목 대결',
    howToLi3: '무르기 기능: 실수한 수를 되돌릴 수 있는 무르기 지원',
    howToLi4: '기보 검토: 게임 종료 후 기보를 다시 확인',
    howToLi5: '반응형 디자인: PC, 태블릿, 스마트폰 모든 기기에서 최적화',
    howToLi6: '설치 불필요: 웹 브라우저에서 바로 플레이',
  },
  en: {
    title: 'Gomoku',
    titleSub: '五目並べ',
    modeSubtitle: 'Choose a game mode',
    vsAi: 'vs AI',
    vsAiDesc: 'Play against the computer',
    vsPvp: '2-Player',
    vsPvpDesc: 'Take turns with a friend',
    undo: 'Undo',
    restart: 'Restart',
    mode: 'Mode',
    changeMode: 'Change mode',
    blackTurn: 'Black turn',
    whiteTurn: 'White turn',
    blackTurnP1: 'Black turn (1P)',
    whiteTurnP2: 'White turn (2P)',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    difficulty: 'Difficulty',
    thinking: 'AI thinking',
    draw: 'Draw',
    blackWins: 'Black wins',
    whiteWins: 'White wins',
    blackWinShort: 'Black wins',
    whiteWinShort: 'White wins',
    reviewBoard: 'Review board',
    showResult: 'Show result',
    moves: 'Moves',
    totalMoves: '{n} moves',
    congratulations: 'Congratulations!',
    tryNextTime: 'Try again next time',
    goodGame: 'A fine game',
    soundOff: 'Mute',
    soundOn: 'Sound on',
    howToLi1: 'vs AI: three difficulty levels (easy, medium, hard)',
    howToLi2: '2-player mode: play with a friend on one device',
    howToLi3: 'Undo a mistaken move',
    howToLi4: 'Review the board after the game',
    howToLi5: 'Responsive layout for PC, tablet, and phone',
    howToLi6: 'No install: play in the browser',
  },
  ja: {
    title: '五目並べ',
    titleSub: 'Gomoku',
    modeSubtitle: 'ゲームモードを選んでください',
    vsAi: 'AI対戦',
    vsAiDesc: 'コンピュータと対戦します',
    vsPvp: '2人対戦',
    vsPvpDesc: '友達と交互に打ちます',
    undo: '待った',
    restart: 'もう一度',
    mode: 'モード',
    changeMode: 'モード変更',
    blackTurn: '黒の番',
    whiteTurn: '白の番',
    blackTurnP1: '黒の番 (1P)',
    whiteTurnP2: '白の番 (2P)',
    easy: '初級',
    medium: '中級',
    hard: '上級',
    difficulty: '難易度',
    thinking: 'AI思考中...',
    draw: '引き分け',
    blackWins: '黒の勝ち',
    whiteWins: '白の勝ち',
    blackWinShort: '黒の勝ち',
    whiteWinShort: '白の勝ち',
    reviewBoard: '棋譜を見る',
    showResult: '結果を見る',
    moves: '手数',
    totalMoves: '計{n}手',
    congratulations: 'おめでとうございます！',
    tryNextTime: '次は勝ちましょう',
    goodGame: '良い対局でした',
    soundOff: '音を消す',
    soundOn: '音を出す',
    howToLi1: 'AI対戦: 初級・中級・上級の3段階',
    howToLi2: '2人対戦: 1台の端末で友達と対局',
    howToLi3: '待った: 打ち直しができます',
    howToLi4: '対局後に棋譜を確認',
    howToLi5: 'PC・タブレット・スマホに対応',
    howToLi6: 'インストール不要。ブラウザですぐ遊べます',
  },
  zh: {
    title: '五子棋',
    titleSub: 'Gomoku',
    modeSubtitle: '请选择游戏模式',
    vsAi: 'AI对战',
    vsAiDesc: '与人工智能对战',
    vsPvp: '双人对战',
    vsPvpDesc: '与朋友轮流落子',
    undo: '悔棋',
    restart: '再来一局',
    mode: '模式',
    changeMode: '更换模式',
    blackTurn: '黑棋回合',
    whiteTurn: '白棋回合',
    blackTurnP1: '黑棋回合 (1P)',
    whiteTurnP2: '白棋回合 (2P)',
    easy: '初级',
    medium: '中级',
    hard: '高级',
    difficulty: '难度',
    thinking: 'AI思考中...',
    draw: '平局',
    blackWins: '黑棋获胜',
    whiteWins: '白棋获胜',
    blackWinShort: '黑棋获胜',
    whiteWinShort: '白棋获胜',
    reviewBoard: '查看棋谱',
    showResult: '查看结果',
    moves: '手数',
    totalMoves: '共{n}手',
    congratulations: '恭喜！',
    tryNextTime: '下次再赢回来',
    goodGame: '这是一盘好棋',
    soundOff: '关闭声音',
    soundOn: '打开声音',
    howToLi1: 'AI对战：初级、中级、高级三档难度',
    howToLi2: '双人对战：同一设备上与朋友对弈',
    howToLi3: '悔棋：可以撤回走错的一步',
    howToLi4: '对局结束后可查看棋谱',
    howToLi5: '适配电脑、平板和手机',
    howToLi6: '无需安装，浏览器即可游玩',
  },
};

function readUiLang(): UiLang {
  try {
    if (typeof document !== 'undefined') {
      const q = (new URLSearchParams(window.location.search).get('lang') || '').slice(0, 2).toLowerCase();
      if (q in UI) return q as UiLang;
      const cm = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
      if (cm && cm[1] in UI) return cm[1] as UiLang;
      const htmlLang = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
      if (htmlLang in UI) return htmlLang as UiLang;
      const saved = localStorage.getItem('omok_lang') || '';
      if (saved in UI) return saved as UiLang;
    }
  } catch {}
  return 'ko';
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [localOnly, setLocalOnly] = useState(LOCAL_ONLY.ko);
  const [uiLang, setUiLang] = useState('ko');
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [showResult, setShowResult] = useState(false); // Show result modal or review board
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('ai'); // 게임 모드 상태
  const [showModeSelect, setShowModeSelect] = useState(true); // 모드 선택 화면 표시
  const [inputLocked, setInputLocked] = useState(false); // 2인 대전 미스클릭 방지용
  const [moveHistory, setMoveHistory] = useState<{ board: Board; player: Player; lastMove: { row: number; col: number } | null }[]>([]); // 무르기용 히스토리

  // Initialize AudioContext on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play realistic stone placement sound - simulates stone hitting wooden board
  const playStoneSound = useCallback((isBlack: boolean) => {
    if (!soundEnabled) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create noise buffer for the "click" impact
      const bufferSize = ctx.sampleRate * 0.1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Bandpass filter for wood-like resonance
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(isBlack ? 1800 : 2200, ctx.currentTime);
      bandpass.Q.setValueAtTime(5, ctx.currentTime);

      // Highpass to remove low rumble
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(500, ctx.currentTime);

      // Quick envelope for sharp attack
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      noise.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // Add wood resonance tone
      const resonance = ctx.createOscillator();
      resonance.type = 'sine';
      resonance.frequency.setValueAtTime(isBlack ? 280 : 350, ctx.currentTime);

      const resGain = ctx.createGain();
      resGain.gain.setValueAtTime(0.15, ctx.currentTime);
      resGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      const resFilter = ctx.createBiquadFilter();
      resFilter.type = 'lowpass';
      resFilter.frequency.setValueAtTime(600, ctx.currentTime);

      resonance.connect(resFilter);
      resFilter.connect(resGain);
      resGain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      resonance.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.1);
      resonance.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not supported, silently fail
    }
  }, [soundEnabled, initAudio]);

  // Play game start sound
  const playStartSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Gentle ascending chime for game start
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.5);
      });
    } catch {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Play victory sound
  const playVictorySound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Triumphant fanfare
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.setValueAtTime(0.2, startTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });

      // Add a final sustained chord
      setTimeout(() => {
        const chordNotes = [523.25, 659.25, 783.99];
        chordNotes.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1);
        });
      }, 500);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Play defeat sound
  const playDefeatSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Descending sad tones
      const notes = [392, 349.23, 329.63, 293.66]; // G4, F4, E4, D4
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + i * 0.2;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Dynamic canvas sizing
  const [canvasSize, setCanvasSize] = useState(560);
  const cellSize = canvasSize / (BOARD_SIZE + 1);
  const padding = cellSize;

  // Calculate canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Calculate available space - responsive to device
      const isMobile = vw < 768;

      let maxWidth: number;
      let headerFooterSpace: number;

      if (isMobile) {
        maxWidth = vw - 24;
        headerFooterSpace = 210;
      } else {
        // PC/태블릿: 여백 확보 + 컨트롤바 포함 한 화면
        maxWidth = vw * 0.8;
        headerFooterSpace = 220;
      }

      const maxHeight = (vh - headerFooterSpace) * 0.88;
      const size = Math.min(maxWidth, maxHeight);
      setCanvasSize(Math.max(280, size));
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Draw board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.scale(dpr, dpr);

    // Wood grain background with texture
    const woodGradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    woodGradient.addColorStop(0, '#E8C87E');
    woodGradient.addColorStop(0.3, '#D4A85A');
    woodGradient.addColorStop(0.5, '#E0B76A');
    woodGradient.addColorStop(0.7, '#D4A85A');
    woodGradient.addColorStop(1, '#C89B4A');
    ctx.fillStyle = woodGradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Add subtle wood grain texture
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvasSize; i += 12) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.1) * 3);
      ctx.bezierCurveTo(
        canvasSize * 0.25, i + Math.sin(i * 0.1 + 1) * 5,
        canvasSize * 0.75, i + Math.sin(i * 0.1 + 2) * 4,
        canvasSize, i + Math.sin(i * 0.1 + 3) * 3
      );
      ctx.stroke();
    }

    // Draw grid with elegant styling
    ctx.strokeStyle = '#2D1810';
    ctx.lineWidth = Math.max(1, cellSize * 0.025);
    ctx.lineCap = 'round';

    for (let i = 0; i < BOARD_SIZE; i++) {
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, padding + i * cellSize);
      ctx.stroke();

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, padding + (BOARD_SIZE - 1) * cellSize);
      ctx.stroke();
    }

    // Draw star points (화점) - traditional Go/Omok markers
    const starPoints = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];

    ctx.fillStyle = '#2D1810';
    starPoints.forEach(([row, col]) => {
      const x = padding + col * cellSize;
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw stones with premium 3D effect
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const x = padding + c * cellSize;
          const y = padding + r * cellSize;
          const radius = cellSize * 0.42;
          const isLast = lastMove && lastMove.row === r && lastMove.col === c;

          // Stone shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = cellSize * 0.15;
          ctx.shadowOffsetX = cellSize * 0.05;
          ctx.shadowOffsetY = cellSize * 0.08;

          if (cell === 'black') {
            // Black stone - glossy obsidian effect
            const gradient = ctx.createRadialGradient(
              x - radius * 0.35, y - radius * 0.35, radius * 0.05,
              x + radius * 0.1, y + radius * 0.1, radius
            );
            gradient.addColorStop(0, '#555555');
            gradient.addColorStop(0.3, '#333333');
            gradient.addColorStop(0.7, '#1a1a1a');
            gradient.addColorStop(1, '#000000');

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Highlight reflection
            ctx.shadowColor = 'transparent';
            const highlight = ctx.createRadialGradient(
              x - radius * 0.4, y - radius * 0.4, 0,
              x - radius * 0.3, y - radius * 0.3, radius * 0.5
            );
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = highlight;
            ctx.fill();
          } else {
            // White stone - shell-like pearlescent effect
            const gradient = ctx.createRadialGradient(
              x - radius * 0.3, y - radius * 0.3, radius * 0.05,
              x + radius * 0.15, y + radius * 0.15, radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.4, '#F8F8F8');
            gradient.addColorStop(0.7, '#E8E8E8');
            gradient.addColorStop(1, '#D0D0D0');

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Subtle edge
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Shell reflection
            const shellHighlight = ctx.createRadialGradient(
              x - radius * 0.35, y - radius * 0.35, 0,
              x - radius * 0.2, y - radius * 0.2, radius * 0.55
            );
            shellHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            shellHighlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
            shellHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(x - radius * 0.15, y - radius * 0.15, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = shellHighlight;
            ctx.fill();
          }

          // Last move indicator
          if (isLast) {
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = cell === 'black' ? '#FF6B6B' : '#E53935';
            ctx.lineWidth = Math.max(2, cellSize * 0.06);
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
    });

    // Reset shadow for next frame
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [board, canvasSize, cellSize, padding, lastMove]);

  // AI move - AI 모드일 때만 작동
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'white' && !winner && !showModeSelect) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board, difficulty);
        if (aiMove) {
          makeMove(aiMove.row, aiMove.col);
        }
        setIsThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, board, difficulty, gameMode, showModeSelect]);

  // Get position from coordinates - fixed for proper touch handling
  const getPositionFromCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  }, [canvasSize, cellSize, padding]);

  // Mouse click handler - AI 모드는 흑만, 2인 모드는 모두 가능
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (winner || showModeSelect) return;
    // AI 모드: 흑(플레이어)만 클릭 가능, 2인 모드: 모두 가능
    if (gameMode === 'ai' && currentPlayer !== 'black') return;
    // 2인 대전 미스클릭 방지
    if (gameMode === 'pvp' && inputLocked) return;

    const pos = getPositionFromCoords(e.clientX, e.clientY);
    if (pos && !board[pos.row][pos.col]) {
      makeMove(pos.row, pos.col);
    }
  };

  // Touch handler - fixed for mobile
  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling and double-tap zoom
    if (winner || showModeSelect) return;
    // AI 모드: 흑(플레이어)만 터치 가능, 2인 모드: 모두 가능
    if (gameMode === 'ai' && currentPlayer !== 'black') return;
    // 2인 대전 미스클릭 방지
    if (gameMode === 'pvp' && inputLocked) return;

    const touch = e.touches[0];
    if (!touch) return;

    const pos = getPositionFromCoords(touch.clientX, touch.clientY);
    if (pos && !board[pos.row][pos.col]) {
      makeMove(pos.row, pos.col);
    }
  };

  const makeMove = (row: number, col: number) => {
    // Play sound effect
    playStoneSound(currentPlayer === 'black');

    // 무르기를 위해 현재 상태 저장
    setMoveHistory(prev => [...prev, { board: board.map(r => [...r]), player: currentPlayer, lastMove }]);

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setLastMove({ row, col });
    setMoveCount(prev => prev + 1);

    if (checkWin(newBoard, row, col)) {
      setWinner(currentPlayer);
      setShowResult(true);
      // Play win/lose sound after a short delay
      setTimeout(() => {
        if (currentPlayer === 'black') {
          playVictorySound();
        } else {
          playDefeatSound();
        }
      }, 300);
    } else if (checkDraw(newBoard)) {
      setWinner('draw');
      setShowResult(true);
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');

      // 2인 대전 모드: 미스클릭 방지를 위한 입력 잠금 (800ms)
      if (gameMode === 'pvp') {
        setInputLocked(true);
        setTimeout(() => {
          setInputLocked(false);
        }, 800);
      }
    }
  };

  const checkWin = (board: Board, row: number, col: number): boolean => {
    const player = board[row][col];
    if (!player) return false;

    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
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
  };

  const checkDraw = (board: Board): boolean => {
    return board.every(row => row.every(cell => cell !== null));
  };

  // ============================================
  // IMPROVED AI: Pattern-based Threat Detection
  // ============================================

  // Pattern scores based on research from tournament-winning Gomoku AI
  // Reference: https://sortingsearching.com/2020/05/18/gomoku.html
  const SCORES = {
    FIVE: 10000000,        // Winning
    OPEN_FOUR: 500000,     // Unstoppable (two ways to win)
    BLOCKED_FOUR: 50000,   // Must block (one way to win)
    OPEN_THREE: 50000,     // Very dangerous (becomes open four)
    BLOCKED_THREE: 5000,   // Somewhat dangerous
    OPEN_TWO: 500,         // Building potential
    BLOCKED_TWO: 50,       // Minor threat
    ONE: 10,               // Single stone influence
  };

  // Analyze a line segment and return pattern info
  const analyzeLine = (
    board: Board,
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: Player
  ): { count: number; openEnds: number; pattern: string } => {
    let count = 1; // Count the center stone
    let openEnds = 0;

    // Scan in positive direction
    let i = 1;
    while (i <= 4) {
      const r = row + dx * i;
      const c = col + dy * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        break;
      }
      if (board[r][c] === player) {
        count++;
        i++;
      } else if (board[r][c] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    // Scan in negative direction
    i = 1;
    while (i <= 4) {
      const r = row - dx * i;
      const c = col - dy * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
        break;
      }
      if (board[r][c] === player) {
        count++;
        i++;
      } else if (board[r][c] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    // Determine pattern type
    let pattern = 'none';
    if (count >= 5) pattern = 'five';
    else if (count === 4) pattern = openEnds === 2 ? 'open_four' : (openEnds === 1 ? 'blocked_four' : 'dead');
    else if (count === 3) pattern = openEnds === 2 ? 'open_three' : (openEnds === 1 ? 'blocked_three' : 'dead');
    else if (count === 2) pattern = openEnds === 2 ? 'open_two' : (openEnds === 1 ? 'blocked_two' : 'dead');
    else if (count === 1) pattern = openEnds === 2 ? 'one' : 'dead';

    return { count, openEnds, pattern };
  };

  // Scan entire board for all patterns of a player
  const scanBoardPatterns = (board: Board, player: Player): {
    fives: number;
    openFours: number;
    blockedFours: number;
    openThrees: number;
    blockedThrees: number;
    openTwos: number;
  } => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const counted = new Set<string>();

    let fives = 0, openFours = 0, blockedFours = 0;
    let openThrees = 0, blockedThrees = 0, openTwos = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== player) continue;

        for (const [dx, dy] of directions) {
          // Create unique key for this line segment
          const key = `${r},${c},${dx},${dy}`;
          if (counted.has(key)) continue;

          const { pattern } = analyzeLine(board, r, c, dx, dy, player);

          // Mark all stones in this line as counted for this direction
          let i = 1;
          while (true) {
            const nr = r + dx * i;
            const nc = c + dy * i;
            if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
            if (board[nr][nc] !== player) break;
            counted.add(`${nr},${nc},${dx},${dy}`);
            i++;
          }

          switch (pattern) {
            case 'five': fives++; break;
            case 'open_four': openFours++; break;
            case 'blocked_four': blockedFours++; break;
            case 'open_three': openThrees++; break;
            case 'blocked_three': blockedThrees++; break;
            case 'open_two': openTwos++; break;
          }
        }
      }
    }

    return { fives, openFours, blockedFours, openThrees, blockedThrees, openTwos };
  };

  // Evaluate what patterns a move creates
  const evaluateMove = (board: Board, row: number, col: number, player: Player): number => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let score = 0;
    let openFours = 0;
    let blockedFours = 0;
    let openThrees = 0;

    // Temporarily place the stone
    const testBoard = board.map(r => [...r]);
    testBoard[row][col] = player;

    for (const [dx, dy] of directions) {
      const { pattern } = analyzeLine(testBoard, row, col, dx, dy, player);

      switch (pattern) {
        case 'five': score += SCORES.FIVE; break;
        case 'open_four':
          score += SCORES.OPEN_FOUR;
          openFours++;
          break;
        case 'blocked_four':
          score += SCORES.BLOCKED_FOUR;
          blockedFours++;
          break;
        case 'open_three':
          score += SCORES.OPEN_THREE;
          openThrees++;
          break;
        case 'blocked_three': score += SCORES.BLOCKED_THREE; break;
        case 'open_two': score += SCORES.OPEN_TWO; break;
        case 'blocked_two': score += SCORES.BLOCKED_TWO; break;
        case 'one': score += SCORES.ONE; break;
      }
    }

    // Double threat bonus (guaranteed win)
    if (openFours >= 1 || (blockedFours >= 2) || (blockedFours >= 1 && openThrees >= 1)) {
      score += SCORES.OPEN_FOUR; // Almost guaranteed win
    }
    if (openThrees >= 2) {
      score += SCORES.OPEN_FOUR * 0.8; // Double open three is very strong
    }

    // Center preference
    const centerDist = Math.abs(row - 7) + Math.abs(col - 7);
    score += (14 - centerDist) * 2;

    return score;
  };

  // Check if a position creates or blocks a specific threat
  const detectThreats = (board: Board, row: number, col: number, player: Player): {
    createsFive: boolean;
    createsOpenFour: boolean;
    createsBlockedFour: boolean;
    createsOpenThree: boolean;
    createsDoubleThree: boolean;
  } => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const testBoard = board.map(r => [...r]);
    testBoard[row][col] = player;

    let fiveCount = 0;
    let openFourCount = 0;
    let blockedFourCount = 0;
    let openThreeCount = 0;

    for (const [dx, dy] of directions) {
      const { pattern } = analyzeLine(testBoard, row, col, dx, dy, player);

      if (pattern === 'five') fiveCount++;
      if (pattern === 'open_four') openFourCount++;
      if (pattern === 'blocked_four') blockedFourCount++;
      if (pattern === 'open_three') openThreeCount++;
    }

    return {
      createsFive: fiveCount > 0,
      createsOpenFour: openFourCount > 0,
      createsBlockedFour: blockedFourCount > 0,
      createsOpenThree: openThreeCount > 0,
      createsDoubleThree: openThreeCount >= 2,
    };
  };

  // Get candidate moves (only near existing stones)
  const getCandidateMoves = (board: Board): { row: number; col: number }[] => {
    const candidates: { row: number; col: number }[] = [];
    const visited = new Set<string>();

    // First move: center
    const hasStones = board.some(row => row.some(cell => cell !== null));
    if (!hasStones) {
      return [{ row: 7, col: 7 }];
    }

    // Find all empty positions near existing stones
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c]) {
          // Check 2-cell radius around each stone
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              const key = `${nr},${nc}`;

              if (nr >= 0 && nr < BOARD_SIZE &&
                  nc >= 0 && nc < BOARD_SIZE &&
                  !board[nr][nc] &&
                  !visited.has(key)) {
                visited.add(key);
                candidates.push({ row: nr, col: nc });
              }
            }
          }
        }
      }
    }

    return candidates;
  };

  // Main AI function with improved threat detection
  const getAIMove = (board: Board, difficulty: string): { row: number; col: number } | null => {
    const candidates = getCandidateMoves(board);
    if (candidates.length === 0) return null;

    const aiPlayer: Player = 'white';
    const humanPlayer: Player = 'black';

    // Easy mode: 최소한의 방어 + 랜덤
    if (difficulty === 'easy') {
      // 1. 자신이 이길 수 있으면 이김
      for (const pos of candidates) {
        const threats = detectThreats(board, pos.row, pos.col, aiPlayer);
        if (threats.createsFive) {
          return pos;
        }
      }

      // 2. 상대가 이기려 하면 막음 (4목 차단)
      for (const pos of candidates) {
        const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
        if (threats.createsFive) {
          return pos;
        }
      }

      // 3. 상대의 열린 3목 차단 (양쪽이 비어있는 3목)
      for (const pos of candidates) {
        const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
        if (threats.createsOpenThree) {
          return pos;
        }
      }

      // 4. 그 외에는 랜덤
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Priority 1: Immediate win (create five)
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, aiPlayer);
      if (threats.createsFive) {
        return pos;
      }
    }

    // Priority 2: Block opponent's winning move
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
      if (threats.createsFive) {
        return pos;
      }
    }

    // Priority 3: Create open four (unstoppable)
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, aiPlayer);
      if (threats.createsOpenFour) {
        return pos;
      }
    }

    // Priority 4: Block opponent's open four
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
      if (threats.createsOpenFour) {
        return pos;
      }
    }

    // Priority 5: Create double blocked-four (guaranteed win)
    for (const pos of candidates) {
      const testBoard = board.map(r => [...r]);
      testBoard[pos.row][pos.col] = aiPlayer;

      let blockedFours = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (const [dx, dy] of directions) {
        const { pattern } = analyzeLine(testBoard, pos.row, pos.col, dx, dy, aiPlayer);
        if (pattern === 'blocked_four') blockedFours++;
      }
      if (blockedFours >= 2) {
        return pos;
      }
    }

    // Priority 6: Block opponent's blocked four + open three combo
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
      if (threats.createsBlockedFour) {
        return pos;
      }
    }

    // Priority 7: Create open three
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, aiPlayer);
      if (threats.createsOpenThree) {
        // Check if it's safe (opponent can't create winning threat next)
        return pos;
      }
    }

    // Priority 8: Block opponent's open three (CRITICAL)
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
      if (threats.createsOpenThree) {
        return pos;
      }
    }

    // Priority 9: Block opponent's double three
    for (const pos of candidates) {
      const threats = detectThreats(board, pos.row, pos.col, humanPlayer);
      if (threats.createsDoubleThree) {
        return pos;
      }
    }

    // For medium/hard: Use scoring-based evaluation
    const scoredMoves = candidates.map(pos => {
      const aiScore = evaluateMove(board, pos.row, pos.col, aiPlayer);
      const blockScore = evaluateMove(board, pos.row, pos.col, humanPlayer) * 1.1; // Slightly prefer blocking
      return {
        ...pos,
        score: aiScore + blockScore,
        aiScore,
        blockScore,
      };
    }).sort((a, b) => b.score - a.score);

    // Hard mode: Use minimax for top candidates
    if (difficulty === 'hard') {
      const topMoves = scoredMoves.slice(0, 12);
      let bestMove = topMoves[0];
      let bestScore = -Infinity;

      for (const pos of topMoves) {
        const testBoard = board.map(r => [...r]);
        testBoard[pos.row][pos.col] = aiPlayer;
        const score = minimax(testBoard, 3, false, -Infinity, Infinity, aiPlayer, humanPlayer);

        if (score > bestScore) {
          bestScore = score;
          bestMove = pos;
        }
      }

      return bestMove;
    }

    // Medium mode: Return best scored move
    return scoredMoves[0] || candidates[0];
  };

  // Minimax with alpha-beta pruning
  const minimax = (
    board: Board,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    aiPlayer: Player,
    humanPlayer: Player
  ): number => {
    // Check terminal states
    if (checkBoardWin(board, aiPlayer)) return SCORES.FIVE + depth;
    if (checkBoardWin(board, humanPlayer)) return -SCORES.FIVE - depth;
    if (depth === 0) return evaluateBoard(board, aiPlayer, humanPlayer);

    const candidates = getCandidateMoves(board);
    if (candidates.length === 0) return 0;

    // Sort moves by quick evaluation for better pruning
    const sortedMoves = candidates
      .map(pos => ({
        ...pos,
        score: evaluateMove(board, pos.row, pos.col, isMaximizing ? aiPlayer : humanPlayer)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of sortedMoves) {
        const testBoard = board.map(r => [...r]);
        testBoard[move.row][move.col] = aiPlayer;
        const evalScore = minimax(testBoard, depth - 1, false, alpha, beta, aiPlayer, humanPlayer);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of sortedMoves) {
        const testBoard = board.map(r => [...r]);
        testBoard[move.row][move.col] = humanPlayer;
        const evalScore = minimax(testBoard, depth - 1, true, alpha, beta, aiPlayer, humanPlayer);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // Evaluate board state
  const evaluateBoard = (board: Board, aiPlayer: Player, humanPlayer: Player): number => {
    const aiPatterns = scanBoardPatterns(board, aiPlayer);
    const humanPatterns = scanBoardPatterns(board, humanPlayer);

    let score = 0;

    // AI patterns (positive)
    score += aiPatterns.fives * SCORES.FIVE;
    score += aiPatterns.openFours * SCORES.OPEN_FOUR;
    score += aiPatterns.blockedFours * SCORES.BLOCKED_FOUR;
    score += aiPatterns.openThrees * SCORES.OPEN_THREE;
    score += aiPatterns.blockedThrees * SCORES.BLOCKED_THREE;
    score += aiPatterns.openTwos * SCORES.OPEN_TWO;

    // Human patterns (negative, weighted higher for defense)
    score -= humanPatterns.fives * SCORES.FIVE;
    score -= humanPatterns.openFours * SCORES.OPEN_FOUR * 1.2;
    score -= humanPatterns.blockedFours * SCORES.BLOCKED_FOUR * 1.1;
    score -= humanPatterns.openThrees * SCORES.OPEN_THREE * 1.2;
    score -= humanPatterns.blockedThrees * SCORES.BLOCKED_THREE;
    score -= humanPatterns.openTwos * SCORES.OPEN_TWO;

    return score;
  };

  const checkBoardWin = (board: Board, player: Player): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === player && checkWin(board, r, c)) {
          return true;
        }
      }
    }
    return false;
  };

  const reset = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('black');
    setWinner(null);
    setLastMove(null);
    setMoveCount(0);
    setIsThinking(false);
    setShowResult(false);
    setInputLocked(false);
    setMoveHistory([]);
    playStartSound();
  };

  // 무르기 함수
  const undoMove = () => {
    if (moveHistory.length === 0 || winner || isThinking) return;

    if (gameMode === 'ai') {
      // AI 모드: 2수(사람 + AI) 되돌리기
      const stepsBack = moveHistory.length >= 2 ? 2 : 1;
      const targetState = moveHistory[moveHistory.length - stepsBack];
      setBoard(targetState.board);
      setCurrentPlayer(targetState.player);
      setLastMove(targetState.lastMove);
      setMoveCount(prev => prev - stepsBack);
      setMoveHistory(prev => prev.slice(0, -stepsBack));
    } else {
      // PvP 모드: 1수 되돌리기 (기존 동작)
      const lastState = moveHistory[moveHistory.length - 1];
      setBoard(lastState.board);
      setCurrentPlayer(lastState.player);
      setLastMove(lastState.lastMove);
      setMoveCount(prev => prev - 1);
      setMoveHistory(prev => prev.slice(0, -1));
    }
    setInputLocked(false);
  };

  // 새 게임 시작 (모드 선택 화면으로 돌아가기)
  const backToModeSelect = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('black');
    setWinner(null);
    setLastMove(null);
    setMoveCount(0);
    setIsThinking(false);
    setShowResult(false);
    setInputLocked(false);
    setMoveHistory([]);
    setShowModeSelect(true);
  };

  // 게임 모드 선택 및 시작
  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setShowModeSelect(false);
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('black');
    setWinner(null);
    setLastMove(null);
    setMoveCount(0);
    setIsThinking(false);
    setShowResult(false);
    setInputLocked(false);
    setMoveHistory([]);
    playStartSound();
  };

  // Review board without starting new game
  const reviewBoard = () => {
    setShowResult(false);
  };

  const detectLocalLang = (): UiLang => readUiLang();

  useEffect(() => {
    const apply = () => {
      const next = detectLocalLang();
      setUiLang(next);
      setLocalOnly(LOCAL_ONLY[next]);
      try { document.documentElement.lang = next; } catch {}
    };
    apply();
    window.addEventListener('popstate', apply);
    return () => window.removeEventListener('popstate', apply);
  }, []);

  const setLang = (next: string) => {
    if (!(next in UI)) return;
    setUiLang(next);
    setLocalOnly(LOCAL_ONLY[next]);
    try { document.documentElement.lang = next; } catch {}
    try { localStorage.setItem('omok_lang', next); } catch {}
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get('lang') !== next) {
        u.searchParams.set('lang', next);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      }
    } catch {}
  };

  const lang: UiLang = typeof document !== 'undefined' ? readUiLang() : (uiLang in UI ? uiLang as UiLang : 'ko');
  const t = UI[lang];
  const diffLabel = { easy: t.easy, medium: t.medium, hard: t.hard } as const;
  const turnKey = isThinking
    ? 'thinking'
    : gameMode === 'pvp'
      ? (currentPlayer === 'black' ? 'blackTurnP1' : 'whiteTurnP2')
      : (currentPlayer === 'black' ? 'blackTurn' : 'whiteTurn');
  const turnText = t[turnKey];

  return (
    <div className={`game-container ${currentPlayer === 'black' ? 'turn-black' : 'turn-white'}`}>
      <div className="local-only-bar">
        <p className="local-only" id="local-only" role="note">{LOCAL_ONLY[lang] || localOnly}</p>
        <label className="sr-only" htmlFor="local-only-lang">Language</label>
        <select
          id="local-only-lang"
          className="local-only-lang"
          aria-label="Language"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>
      {/* Mode Selection Screen */}
      {showModeSelect && (
        <div className="mode-select-overlay">
          <div className="mode-select-modal">
            <h1 className="mode-title" suppressHydrationWarning>
              <span className="title-korean" data-i18n="title">{t.title}</span>
              <span className="title-sub" data-i18n="titleSub">{t.titleSub}</span>
            </h1>
            <p className="mode-subtitle" data-i18n="modeSubtitle">{t.modeSubtitle}</p>
            <div className="mode-buttons">
              <button onClick={() => startGame('ai')} className="mode-btn ai-mode">
                <div className="mode-icon">🤖</div>
                <div className="mode-info">
                  <span className="mode-name" data-i18n="vsAi">{t.vsAi}</span>
                  <span className="mode-desc" data-i18n="vsAiDesc">{t.vsAiDesc}</span>
                </div>
              </button>
              <button onClick={() => startGame('pvp')} className="mode-btn pvp-mode">
                <div className="mode-icon">👥</div>
                <div className="mode-info">
                  <span className="mode-name" data-i18n="vsPvp">{t.vsPvp}</span>
                  <span className="mode-desc" data-i18n="vsPvpDesc">{t.vsPvpDesc}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Overlay - only show when showResult is true */}
      {winner && showResult && (
        <div className="victory-overlay">
          <div className="victory-modal">
            <div className="victory-icon">
              {winner === 'draw' ? (
                <span className="draw-icon">引分</span>
              ) : (
                <div className={`stone-display ${winner}`} />
              )}
            </div>
            <h2 className="victory-title">
              {winner === 'draw' ? t.draw : winner === 'black' ? t.blackWins : t.whiteWins}
            </h2>
            <p className="victory-subtitle">
              {winner === 'draw'
                ? t.goodGame
                : winner === 'white' && gameMode === 'ai'
                  ? t.tryNextTime
                  : t.congratulations}
            </p>
            <div className="victory-stats">
              <span>{t.totalMoves.replace('{n}', String(moveCount))}</span>
            </div>
            <div className="victory-buttons">
              <button onClick={reviewBoard} className="review-btn">
                {t.reviewBoard}
              </button>
              <button onClick={reset} className="new-game-btn">
                {t.restart}
              </button>
              <button onClick={backToModeSelect} className="mode-change-btn">
                {t.changeMode}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game ended banner - shown when reviewing */}
      {winner && !showResult && (
        <div className="review-banner">
          <span className="review-text">
            {winner === 'draw' ? t.draw : winner === 'black' ? t.blackWinShort : t.whiteWinShort} · {t.totalMoves.replace('{n}', String(moveCount))}
          </span>
          <button onClick={() => setShowResult(true)} className="show-result-btn">
            {t.showResult}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="game-header">
        <h1 className="game-title" suppressHydrationWarning>
          <span className="title-korean" data-i18n="title">{t.title}</span>
          <span className="title-sub" data-i18n="titleSub">{t.titleSub}</span>
        </h1>
      </header>

      {/* Game Info Bar */}
      <div className="info-bar">
        <div className="turn-indicator">
          <div className={`current-stone ${currentPlayer}`}>
            <div className="stone-inner" />
          </div>
          <span className="turn-text" data-i18n={turnKey}>
            {turnText}
          </span>
          {isThinking && <div className="thinking-dots"><span/><span/><span/></div>}
        </div>
        <div className="move-counter">
          <span className="move-label" data-i18n="moves">{t.moves}</span>
          <span className="move-number">{moveCount}</span>
        </div>
      </div>

      {/* Board Container */}
      <main className="board-container" ref={containerRef}>
        <div className="board-frame">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasTouch}
            className="game-board"
          />
        </div>
      </main>

      {/* Controls */}
      <div className="controls-bar">
        {gameMode === 'ai' ? (
          <div className="difficulty-selector">
            <label className="control-label" data-i18n="difficulty">{t.difficulty}</label>
            <div className="difficulty-buttons">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                  data-i18n={d}
                >
                  {diffLabel[d]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mode-indicator">
            <span className="mode-badge">👥 <span data-i18n="vsPvp">{t.vsPvp}</span></span>
          </div>
        )}
        <div className="right-controls">
          <button
            onClick={undoMove}
            className={`undo-btn ${moveHistory.length === 0 || winner || isThinking ? 'disabled' : ''}`}
            disabled={moveHistory.length === 0 || !!winner || isThinking}
            title={t.undo}
            data-i18n-title="undo"
          >
            <span className="undo-icon">↩</span>
            <span data-i18n="undo">{t.undo}</span>
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`sound-btn ${soundEnabled ? 'active' : ''}`}
            title={soundEnabled ? t.soundOff : t.soundOn}
            data-i18n-title={soundEnabled ? 'soundOff' : 'soundOn'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button onClick={reset} className="reset-btn">
            <span className="reset-icon">↻</span>
            <span data-i18n="restart">{t.restart}</span>
          </button>
          <button onClick={backToModeSelect} className="mode-btn-small">
            <span data-i18n="mode">{t.mode}</span>
          </button>
        </div>
      </div>

      {/* SEO: AI 크롤러 및 검색엔진을 위한 시맨틱 콘텐츠 */}
      <section className="seo-content" aria-label="오목 게임 정보">
        <h2>오목 온라인 - 무료 AI 오목 게임</h2>
        <p>
          오목(Omok, Gomoku, 五目並べ)은 15×15 바둑판 위에서 두 명이 번갈아 돌을 놓아
          가로, 세로, 대각선으로 5개를 연속으로 먼저 놓는 사람이 이기는 전략 보드게임입니다.
        </p>
        <h3>게임 특징</h3>
        <ul>
          <li data-i18n="howToLi1">{t.howToLi1}</li>
          <li data-i18n="howToLi2">{t.howToLi2}</li>
          <li data-i18n="howToLi3">{t.howToLi3}</li>
          <li data-i18n="howToLi4">{t.howToLi4}</li>
          <li data-i18n="howToLi5">{t.howToLi5}</li>
          <li data-i18n="howToLi6">{t.howToLi6}</li>
        </ul>
        <h3>오목 규칙</h3>
        <p>
          흑돌이 먼저 시작하며, 두 플레이어가 번갈아 가며 바둑판 교차점에 돌을 놓습니다.
          가로, 세로, 대각선 어느 방향이든 자신의 돌 5개를 연속으로 먼저 놓으면 승리합니다.
          전략적 사고와 상대의 수를 읽는 능력이 중요한 게임입니다.
        </p>
        <h3>Play Omok Online Free</h3>
        <p>
          Play Omok (Gomoku) online for free in your browser. Challenge AI opponents with 3 difficulty levels
          or play with a friend in 2-player mode. No download or sign-up required.
          Works on desktop, tablet, and mobile devices.
        </p>
      </section>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;600&display=swap');

        .game-container {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #1a1510 0%, #2d251a 50%, #1a1510 100%);
          font-family: 'Noto Sans KR', sans-serif;
          color: #e8dcc8;
          overflow: hidden;
          position: relative;
          transition: background 0.5s ease;
        }

        /* SEO 콘텐츠: 스크린리더와 크롤러는 읽을 수 있지만 시각적으로 숨김 */
        .seo-content {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* black-turn dark background */
        .game-container.turn-black {
          background: linear-gradient(180deg, #0d0d0d 0%, #1a1815 50%, #0d0d0d 100%);
        }

        .game-container.turn-black::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(50, 50, 50, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(30, 30, 30, 0.12) 0%, transparent 50%);
          pointer-events: none;
          transition: background 0.5s ease;
        }

        /* 백 차례 - 밝은 배경 */
        .game-container.turn-white {
          background: linear-gradient(180deg, #3d3530 0%, #524840 50%, #3d3530 100%);
        }

        .game-container.turn-white::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 255, 255, 0.10) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 250, 240, 0.08) 0%, transparent 70%);
          pointer-events: none;
          transition: background 0.5s ease;
        }

        .game-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(180, 140, 80, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(180, 140, 80, 0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .local-only-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          padding: 6px 10px;
          background: #ffcc33;
          border-bottom: 2px solid #111;
          position: relative;
          z-index: 3001;
          flex-shrink: 0;
        }
        .local-only {
          margin: 0;
          flex: 1;
          min-width: 0;
          font: 700 11px/1.35 system-ui, sans-serif;
          color: #111;
          overflow-wrap: anywhere;
        }
        .local-only-lang {
          flex-shrink: 0;
          font: 700 11px system-ui, sans-serif;
          color: #111;
          background: #fff;
          border: 1px solid #111;
          border-radius: 6px;
          padding: 2px 6px;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
        }

        /* Header */
        .game-header {
          padding: 16px 20px 8px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .game-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .title-korean {
          font-family: 'Noto Serif KR', serif;
          font-size: clamp(28px, 6vw, 42px);
          font-weight: 700;
          letter-spacing: 0.15em;
          background: linear-gradient(180deg, #f4e8d0 0%, #c9a86c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .title-sub {
          font-family: 'Noto Serif KR', serif;
          font-size: clamp(11px, 2.5vw, 14px);
          color: #8b7355;
          letter-spacing: 0.3em;
          font-weight: 400;
        }

        /* Info Bar */
        .info-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          position: relative;
          z-index: 1;
        }

        .turn-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.05);
          padding: 8px 16px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .current-stone {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .current-stone.black {
          background: radial-gradient(circle at 30% 30%, #555, #000);
        }

        .current-stone.white {
          background: radial-gradient(circle at 30% 30%, #fff, #ccc);
        }

        .current-stone .stone-inner {
          position: absolute;
          top: 3px;
          left: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.6), transparent);
        }

        .turn-text {
          font-size: 14px;
          font-weight: 500;
          color: #d4c4a8;
        }

        .thinking-dots {
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          width: 5px;
          height: 5px;
          background: #c9a86c;
          border-radius: 50%;
          animation: dotPulse 1.4s infinite ease-in-out both;
        }

        .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .move-counter {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 8px 16px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .move-label {
          font-size: 12px;
          color: #8b7355;
        }

        .move-number {
          font-size: 18px;
          font-weight: 600;
          color: #c9a86c;
          font-family: 'Noto Serif KR', serif;
        }

        /* Board */
        .board-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          position: relative;
          z-index: 1;
        }

        .board-frame {
          background: linear-gradient(135deg, #5a4a32 0%, #3d3224 50%, #5a4a32 100%);
          padding: clamp(8px, 2vw, 16px);
          border-radius: 8px;
          box-shadow:
            0 4px 20px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.3);
        }

        .game-board {
          display: block;
          border-radius: 4px;
          cursor: pointer;
          touch-action: none;
        }

        /* Controls */
        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px 20px;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .difficulty-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 11px;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-left: 4px;
        }

        .difficulty-buttons {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.3);
          padding: 3px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          height: 44px;
          align-items: center;
        }

        .diff-btn {
          padding: 6px 14px;
          height: 36px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #8b7355;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .diff-btn:hover {
          color: #c9a86c;
          background: rgba(255,255,255,0.05);
        }

        .diff-btn.active {
          background: linear-gradient(135deg, #8b6914 0%, #a67c00 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(139, 105, 20, 0.4);
        }

        .undo-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 16px;
          height: 44px;
          background: linear-gradient(135deg, #3a4a3f 0%, #2d3d32 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #a8d4b8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .undo-btn:hover:not(.disabled) {
          background: linear-gradient(135deg, #4a5a4f 0%, #3d4d42 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .undo-btn:active:not(.disabled) {
          transform: translateY(0);
        }

        .undo-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .undo-icon {
          font-size: 16px;
        }

        .reset-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 20px;
          height: 44px;
          background: linear-gradient(135deg, #4a3f2f 0%, #3d3224 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #d4c4a8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .reset-btn:hover {
          background: linear-gradient(135deg, #5a4f3f 0%, #4d4234 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .reset-btn:active {
          transform: translateY(0);
        }

        .reset-icon {
          font-size: 18px;
        }

        /* Victory Overlay */
        .victory-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.4s ease;
          backdrop-filter: blur(8px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .victory-modal {
          background: linear-gradient(135deg, #2d251a 0%, #1a1510 100%);
          border: 1px solid rgba(201, 168, 108, 0.3);
          padding: 40px 50px;
          border-radius: 16px;
          text-align: center;
          animation: slideUp 0.5s ease;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1);
          max-width: 90vw;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .victory-icon {
          margin-bottom: 20px;
        }

        .stone-display {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          animation: stoneBounce 0.6s ease infinite alternate;
        }

        @keyframes stoneBounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }

        .stone-display.black {
          background: radial-gradient(circle at 30% 30%, #555, #000);
        }

        .stone-display.white {
          background: radial-gradient(circle at 30% 30%, #fff, #ccc);
        }

        .draw-icon {
          font-family: 'Noto Serif KR', serif;
          font-size: 48px;
          color: #c9a86c;
        }

        .victory-title {
          font-family: 'Noto Serif KR', serif;
          font-size: 32px;
          font-weight: 700;
          color: #f4e8d0;
          margin: 0 0 8px;
          letter-spacing: 0.1em;
        }

        .victory-subtitle {
          font-size: 16px;
          color: #8b7355;
          margin: 0 0 16px;
        }

        .victory-stats {
          font-size: 14px;
          color: #6b5a45;
          margin-bottom: 24px;
        }

        .victory-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .review-btn {
          padding: 14px 28px;
          background: transparent;
          border: 1px solid rgba(201, 168, 108, 0.4);
          border-radius: 8px;
          color: #c9a86c;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .review-btn:hover {
          background: rgba(201, 168, 108, 0.1);
          border-color: rgba(201, 168, 108, 0.6);
        }

        .new-game-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #8b6914 0%, #a67c00 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
          box-shadow: 0 4px 16px rgba(139, 105, 20, 0.4);
        }

        .new-game-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(139, 105, 20, 0.5);
        }

        /* Review banner */
        .review-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px 20px;
          background: linear-gradient(135deg, rgba(45, 37, 26, 0.95) 0%, rgba(26, 21, 16, 0.95) 100%);
          border-bottom: 1px solid rgba(201, 168, 108, 0.3);
          z-index: 100;
          backdrop-filter: blur(8px);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .review-text {
          font-family: 'Noto Serif KR', serif;
          font-size: 16px;
          color: #c9a86c;
          font-weight: 500;
        }

        .show-result-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #8b6914 0%, #a67c00 100%);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .show-result-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 105, 20, 0.4);
        }

        /* Sound button */
        .right-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sound-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sound-btn:hover {
          background: rgba(255,255,255,0.05);
        }

        .sound-btn.active {
          border-color: rgba(201, 168, 108, 0.3);
        }

        /* Mobile Optimizations */
        @media (max-width: 480px) {
          .game-header {
            padding: 12px 16px 4px;
          }

          .info-bar {
            padding: 8px 12px;
          }

          .turn-indicator,
          .move-counter {
            padding: 6px 12px;
          }

          .turn-text {
            font-size: 13px;
          }

          .controls-bar {
            flex-direction: column;
            gap: 10px;
            padding: 8px 12px 16px;
          }

          .difficulty-selector {
            width: 100%;
          }

          .control-label {
            display: none;
          }

          .difficulty-buttons {
            width: 100%;
          }

          .diff-btn {
            flex: 1;
            padding: 6px 8px;
          }

          .mode-indicator {
            width: 100%;
          }

          .mode-badge {
            width: 100%;
            justify-content: center;
          }

          .right-controls {
            width: 100%;
          }

          .undo-btn {
            flex: 1;
          }

          .undo-btn span:last-child {
            display: none;
          }

          .undo-icon {
            font-size: 18px;
          }

          .reset-btn {
            flex: 1;
          }

          .sound-btn {
            width: 44px;
            height: 44px;
          }

          .mode-btn-small {
            flex: 1;
          }

          .victory-buttons {
            flex-direction: column;
            gap: 10px;
          }

          .review-btn,
          .new-game-btn {
            width: 100%;
          }

          .review-banner {
            padding: 10px 16px;
            gap: 12px;
          }

          .review-text {
            font-size: 14px;
          }

          .victory-modal {
            padding: 30px 24px;
            margin: 16px;
          }

          .victory-title {
            font-size: 26px;
          }
        }

        /* Tablet */
        @media (min-width: 481px) and (max-width: 768px) {
          .controls-bar {
            padding: 12px 20px 24px;
          }
        }

        /* Large screens */
        @media (min-width: 769px) {
          .board-frame {
            padding: 20px;
          }

          .controls-bar {
            max-width: 700px;
            margin: 0 auto;
            width: 100%;
          }
        }

        /* Mode Selection Overlay */
        .mode-select-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #1a1510 0%, #2d251a 50%, #1a1510 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .mode-select-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(180, 140, 80, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(180, 140, 80, 0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .mode-select-modal {
          text-align: center;
          padding: 40px;
          position: relative;
          z-index: 1;
        }

        .mode-title {
          margin: 0 0 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .mode-subtitle {
          font-size: 16px;
          color: #8b7355;
          margin: 0 0 40px;
        }

        .mode-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 320px;
          margin: 0 auto;
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(45, 37, 26, 0.9) 0%, rgba(26, 21, 16, 0.9) 100%);
          border: 1px solid rgba(201, 168, 108, 0.3);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }

        .mode-btn:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 168, 108, 0.6);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .mode-btn:active {
          transform: translateY(-2px);
        }

        .mode-icon {
          font-size: 36px;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 168, 108, 0.1);
          border-radius: 12px;
        }

        .mode-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mode-name {
          font-family: 'Noto Serif KR', serif;
          font-size: 20px;
          font-weight: 600;
          color: #f4e8d0;
        }

        .mode-desc {
          font-size: 13px;
          color: #8b7355;
        }

        .ai-mode:hover .mode-icon {
          background: rgba(139, 105, 20, 0.2);
        }

        .pvp-mode:hover .mode-icon {
          background: rgba(100, 149, 237, 0.2);
        }

        /* Mode indicator for 2P mode */
        .mode-indicator {
          display: flex;
          align-items: center;
        }

        .mode-badge {
          padding: 0 16px;
          height: 44px;
          display: flex;
          align-items: center;
          background: rgba(100, 149, 237, 0.15);
          border: 1px solid rgba(100, 149, 237, 0.3);
          border-radius: 22px;
          color: #a0c4ff;
          font-size: 14px;
          font-weight: 500;
        }

        /* Small mode button */
        .mode-btn-small {
          padding: 0 16px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4a3f2f 0%, #3d3224 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #d4c4a8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .mode-btn-small:hover {
          background: linear-gradient(135deg, #5a4f3f 0%, #4d4234 100%);
        }

        /* Mode change button in victory modal */
        .mode-change-btn {
          padding: 14px 28px;
          background: transparent;
          border: 1px solid rgba(100, 149, 237, 0.4);
          border-radius: 8px;
          color: #a0c4ff;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .mode-change-btn:hover {
          background: rgba(100, 149, 237, 0.1);
          border-color: rgba(100, 149, 237, 0.6);
        }

        /* Safe area for notched phones */
        @supports (padding: env(safe-area-inset-bottom)) {
          .controls-bar {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
