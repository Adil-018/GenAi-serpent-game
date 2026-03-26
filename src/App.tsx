/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, RefreshCw, Terminal } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "MEM_DUMP_0x00A1",
    artist: "SYS.OP",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "SEGFAULT_DETECTED",
    artist: "NULL.PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "BUFFER_OVERRUN",
    artist: "HEX.CORE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const generateFood = (currentSnake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (!onSnake) break;
  }
  return newFood;
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `0${m}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const directionRef = useRef(INITIAL_DIRECTION);
  const currentDirectionRef = useRef(INITIAL_DIRECTION);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    currentDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      const { x, y } = currentDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        currentDirectionRef.current = directionRef.current;
        const newHead = {
          x: head.x + currentDirectionRef.current.x,
          y: head.y + currentDirectionRef.current.y
        };

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver, isPaused, food]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Glitchy background clear
    ctx.fillStyle = Math.random() > 0.90 ? '#0a000a' : '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid (harsh magenta lines)
    ctx.strokeStyle = Math.random() > 0.95 ? '#ff00ff' : '#330033';
    ctx.lineWidth = Math.random() > 0.98 ? 2 : 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Food (Magenta block)
    ctx.fillStyle = Math.random() > 0.8 ? '#ffffff' : '#FF00FF';
    // Occasional glitch offset for food
    const fOffset = Math.random() > 0.8 ? (Math.random() > 0.5 ? 4 : -4) : 0;
    ctx.fillRect(food.x * CELL_SIZE + fOffset, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Snake (Cyan blocks)
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#FFFFFF' : (Math.random() > 0.95 ? '#FF00FF' : '#00FFFF');
      const sOffset = Math.random() > 0.9 ? (Math.random() > 0.5 ? 3 : -3) : 0;
      const sOffsetY = Math.random() > 0.95 ? (Math.random() > 0.5 ? 2 : -2) : 0;
      ctx.fillRect(segment.x * CELL_SIZE + sOffset, segment.y * CELL_SIZE + sOffsetY, CELL_SIZE - 1, CELL_SIZE - 1);
    });

  }, [snake, food]);

  // --- Music Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsMusicPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isMusicPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsMusicPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, isMusicPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    const handleEnded = () => nextTrack();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const progressPercent = (currentTime / duration) * 100 || 0;

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] flex flex-col font-mono selection:bg-[#FF00FF] selection:text-black pb-24 relative overflow-hidden uppercase crt-flicker">
      {/* Overlays */}
      <div className="scanlines"></div>
      <div className="static-noise"></div>
      <div className="screen-tear"></div>

      {/* Header */}
      <header className="p-6 text-center z-10 border-b-4 border-[#FF00FF] bg-black/80">
        <h1 className="text-5xl md:text-6xl font-black tracking-widest glitch-text" data-text="SYS.SNAKE_OS">
          SYS.SNAKE_OS
        </h1>
        <div className="mt-2 text-[#FF00FF] text-xl tracking-widest flex justify-center gap-8">
          <span className="glitch-text" data-text={`SECTORS_CORRUPTED: ${score.toString().padStart(3, '0')}`}>SECTORS_CORRUPTED: {score.toString().padStart(3, '0')}</span>
          <span className="glitch-text" data-text={`SYS_STATE: ${gameOver ? 'FATAL_EXCEPTION' : isPaused ? 'SUSPENDED' : gameStarted ? 'EXECUTING' : 'STANDBY'}`}>SYS_STATE: {gameOver ? 'FATAL_EXCEPTION' : isPaused ? 'SUSPENDED' : gameStarted ? 'EXECUTING' : 'STANDBY'}</span>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="relative group animate-[shake_4s_infinite_ease-in-out]">
          <div className="absolute -inset-2 bg-[#00FFFF] opacity-20 blur-sm"></div>
          <div className="absolute -inset-2 bg-[#FF00FF] opacity-20 blur-md translate-x-2 translate-y-2"></div>
          
          <div className="relative bg-black border-4 border-[#00FFFF] p-1 shadow-[8px_8px_0px_#FF00FF]">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="bg-black block"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border-2 border-[#FF00FF] m-1">
                <Terminal size={48} className="text-[#00FFFF] mb-4 animate-pulse" />
                <h2 className="text-3xl font-bold text-[#FF00FF] mb-2 tracking-widest glitch-text" data-text="AWAITING.INPUT">AWAITING.INPUT</h2>
                <p className="text-[#00FFFF] mb-8 text-lg text-center">
                  [W,A,S,D] OR [ARROWS] TO OVERRIDE<br/>[SPACE] TO SUSPEND
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-2 bg-black border-2 border-[#00FFFF] text-[#00FFFF] font-bold hover:bg-[#00FFFF] hover:text-black transition-colors tracking-widest text-xl"
                >
                  &gt; INIT.SEQUENCE
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border-2 border-[#FF00FF] m-1">
                <h2 className="text-5xl font-black text-[#FF00FF] mb-2 tracking-widest glitch-text" data-text="KERNEL.PANIC">KERNEL.PANIC</h2>
                <p className="text-[#00FFFF] text-2xl mb-8">DATA_LOST: {score.toString().padStart(3, '0')} SECTORS</p>
                <button
                  onClick={startGame}
                  className="px-8 py-2 bg-black border-2 border-[#FF00FF] text-[#FF00FF] font-bold hover:bg-[#FF00FF] hover:text-black transition-colors tracking-widest text-xl flex items-center gap-2"
                >
                  <RefreshCw size={20} /> &gt; FORCE.REBOOT
                </button>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border-2 border-[#00FFFF] m-1">
                <h2 className="text-4xl font-bold text-[#00FFFF] tracking-widest glitch-text" data-text="THREAD.SUSPENDED">THREAD.SUSPENDED</h2>
                <p className="text-[#FF00FF] mt-4 text-xl animate-pulse">[SPACE] TO RESUME</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Music Player */}
      <footer className="bg-black border-t-4 border-[#00FFFF] fixed bottom-0 w-full z-50 shadow-[0_-8px_0px_rgba(255,0,255,0.2)]">
        {/* Progress Bar */}
        <div 
          className="w-full h-4 bg-[#111] cursor-pointer group/progress flex items-center border-b-2 border-[#FF00FF]"
          onClick={(e) => {
            if (audioRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pos * audioRef.current.duration;
            }
          }}
        >
          <div
            className="h-full bg-[#00FFFF] relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-0 w-2 h-full bg-[#FF00FF]" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 p-4">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-1/3">
            <div className="w-16 h-16 bg-black border-2 border-[#FF00FF] flex items-center justify-center relative overflow-hidden">
              {isMusicPlaying ? (
                <div className="flex items-end justify-center gap-1 h-8 w-full px-2">
                  <div className="w-2 bg-[#00FFFF] animate-[bounce_0.5s_infinite_alternate]"></div>
                  <div className="w-2 bg-[#FF00FF] animate-[bounce_0.7s_infinite_alternate]"></div>
                  <div className="w-2 bg-[#00FFFF] animate-[bounce_0.4s_infinite_alternate]"></div>
                  <div className="w-2 bg-[#FF00FF] animate-[bounce_0.6s_infinite_alternate]"></div>
                </div>
              ) : (
                <Volume2 size={24} className="text-[#333]" />
              )}
              <div className="absolute inset-0 scanlines opacity-50"></div>
            </div>
            <div className="truncate flex flex-col justify-center">
              <div className="text-xl font-bold text-[#00FFFF] truncate tracking-wider glitch-text" data-text={`> PLAYING: ${TRACKS[currentTrackIndex].title}`}>{`> PLAYING: ${TRACKS[currentTrackIndex].title}`}</div>
              <div className="text-sm text-[#FF00FF] truncate mb-1 tracking-widest">{`  SRC: ${TRACKS[currentTrackIndex].artist}`}</div>
              <div className="flex items-center gap-2 text-sm text-[#00FFFF]">
                <span>{`  [${formatTime(currentTime)}]`}</span>
                <span className="text-[#FF00FF] animate-pulse">_</span>
                <span>{`[${formatTime(duration)}]`}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center justify-center w-1/3 gap-2">
            <div className="flex items-center gap-6">
              <button onClick={prevTrack} className="text-[#FF00FF] hover:text-[#00FFFF] transition-colors">
                <SkipBack size={32} />
              </button>
              <button
                onClick={togglePlay}
                className={`px-4 py-2 flex items-center justify-center border-2 border-[#00FFFF] bg-black text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black transition-all shadow-[4px_4px_0px_#FF00FF] hover:shadow-[2px_2px_0px_#FF00FF] hover:translate-x-[2px] hover:translate-y-[2px] font-bold tracking-widest ${!isMusicPlaying ? 'animate-pulse' : ''}`}
              >
                {isMusicPlaying ? 'HALT' : 'EXEC'}
              </button>
              <button onClick={nextTrack} className="text-[#FF00FF] hover:text-[#00FFFF] transition-colors">
                <SkipForward size={32} />
              </button>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-end w-1/3 gap-4">
            <span className="text-[#FF00FF] tracking-widest">AMP</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-32 h-2 bg-black border border-[#00FFFF] appearance-none cursor-pointer accent-[#FF00FF]"
            />
          </div>
        </div>
        <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} />
      </footer>
    </div>
  );
}
