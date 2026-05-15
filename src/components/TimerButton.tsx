"use client";

import { useState, useEffect } from "react";
import { Timer, Play, Pause } from "lucide-react";

export default function TimerButton({ label, seconds }: { label: string, seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      playBeep();
      // Small delay for alert so the render can finish showing 0:00
      setTimeout(() => alert(`Таймер на ${label} завершен! Время действовать! 👨‍🍳`), 100);
    }
    
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, label]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(seconds); // Сброс таймера
    }
    setIsActive(!isActive);
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = time % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-start mt-6 mb-8">
      <button
        onClick={toggleTimer}
        title={isActive ? "Остановить таймер" : "Запустить таймер"}
        className={`group relative inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95
          ${isActive ? 'bg-[#2d2c2a] text-[#fcfcf9] shadow-xl shadow-black/20 ring-4 ring-[#2d2c2a]/10 translate-y-[-2px]' : 
            timeLeft === 0 ? 'bg-green-50 text-green-700 border-2 border-green-200' :
            'bg-white text-[#2d2c2a] hover:bg-[#f6f5f0] border-2 border-[#e2e0d8] hover:border-[#2d2c2a] hover:shadow-md'}`}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-white/10' : 'bg-[#f6f5f0] group-hover:bg-white'} transition-colors`}>
           {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className={`text-[10px] leading-none mb-1 opacity-70 ${isActive ? 'text-white' : 'text-[#8a8883]'}`}>
            {isActive ? "ОСТАЛОСЬ ВРЕМЕНИ" : "ТАЙМЕР ШАГА"}
          </span>
          <span className="text-lg leading-none tabular-nums font-medium tracking-normal">
            {isActive || timeLeft !== seconds ? formatTime(timeLeft) : formatTime(seconds)}
          </span>
        </div>
      </button>
    </div>
  );
}

// Простая функция для генерации приятного звука через Web Audio API
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Мягкий звук колокольчика
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch(e) {
    console.error("Audio play failed:", e);
  }
}
