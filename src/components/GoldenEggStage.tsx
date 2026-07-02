import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import { Prize, GoldenEgg } from '../types';

interface GoldenEggStageProps {
  prizes: Prize[];
  eggs: GoldenEgg[];
  onSmashEgg: (eggId: string) => void;
  onRestoreAll: () => void;
}

// Web Audio Synthesizer for realistic smash / chiming sounds
const playSynthSound = (type: 'hover' | 'smash' | 'restore' | 'error', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'hover':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.05);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'smash':
        // Complex metallic impact
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Low crack thud
        const crackOsc = ctx.createOscillator();
        const crackGain = ctx.createGain();
        crackOsc.connect(crackGain);
        crackGain.connect(ctx.destination);
        crackOsc.type = 'triangle';
        crackOsc.frequency.setValueAtTime(160, now);
        crackOsc.frequency.linearRampToValueAtTime(30, now + 0.3);
        crackGain.gain.setValueAtTime(0.3, now);
        crackGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        crackOsc.start(now);
        crackOsc.stop(now + 0.3);

        // Magical prize chime
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(1300, now + 0.08);
        chimeOsc.frequency.exponentialRampToValueAtTime(1900, now + 0.5);
        chimeGain.gain.setValueAtTime(0.15, now + 0.08);
        chimeGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        chimeOsc.start(now + 0.08);
        chimeOsc.stop(now + 0.5);
        break;

      case 'restore':
        const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Ascending magic chords
        freqs.forEach((f, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + idx * 0.06);
          g.gain.setValueAtTime(0.05, now + idx * 0.06);
          g.gain.linearRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.25);
        });
        break;

      case 'error':
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
    }
  } catch (e) {
    console.warn('Audio synthesis failed:', e);
  }
};

interface EggFragment {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  color: string;
}

interface SmokeParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface FlashEffect {
  id: string;
  x: number;
  y: number;
}

export default function GoldenEggStage({
  prizes,
  eggs,
  onSmashEgg,
  onRestoreAll,
}: GoldenEggStageProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredEgg, setHoveredEgg] = useState<string | null>(null);
  const [smashingEgg, setSmashingEgg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  
  // Custom particles & visual states
  const [fragments, setFragments] = useState<EggFragment[]>([]);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const [flashEffects, setFlashEffects] = useState<FlashEffect[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Particle updates (High performance animation loops)
  useEffect(() => {
    if (fragments.length === 0 && smokeParticles.length === 0) return;

    let animFrameId: number;
    const updateLoop = () => {
      setFragments((prev) =>
        prev
          .map((f) => ({
            ...f,
            x: f.x + f.vx,
            y: f.y + f.vy,
            vy: f.vy + 0.45, // Gravity
            rotation: f.rotation + f.rotSpeed,
          }))
          .filter((f) => f.y < 850)
      );

      setSmokeParticles((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            vy: s.vy - 0.05, // Ascend slowly
            size: s.size + 0.6, // Expand
            alpha: Math.max(0, s.alpha - 0.02), // Fade out
          }))
          .filter((s) => s.alpha > 0)
      );

      animFrameId = requestAnimationFrame(updateLoop);
    };

    animFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [fragments, smokeParticles]);

  // Handle smashing
  const handleSmash = (eggId: string, isSmashed: boolean) => {
    if (isSmashed) {
      playSynthSound('error', isMuted);
      return;
    }
    if (smashingEgg !== null) return; // Wait for active hammer swing

    setSmashingEgg(eggId);
    playSynthSound('smash', isMuted);

    // Get clicked egg coordinates relative to our stage container
    const eggElement = document.getElementById(`egg-${eggId}`);
    let startX = 300;
    let startY = 200;
    if (eggElement && containerRef.current) {
      const rect = eggElement.getBoundingClientRect();
      const parentRect = containerRef.current.getBoundingClientRect();
      startX = rect.left - parentRect.left + rect.width / 2;
      startY = rect.top - parentRect.top + rect.height / 2;
    }

    // Trigger Camera Shake
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    // Trigger Expanding Flash
    const flashId = `flash-${Date.now()}`;
    setFlashEffects((prev) => [...prev, { id: flashId, x: startX, y: startY }]);
    setTimeout(() => {
      setFlashEffects((prev) => prev.filter((f) => f.id !== flashId));
    }, 400);

    // Generate Gold Shell fragments/shards
    const newFragments: EggFragment[] = [];
    const shardColors = ['#f59e0b', '#fbbf24', '#fef08a', '#d97706', '#92400e', '#fef3c7', '#ffffff'];
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      newFragments.push({
        id: `fragment-${Date.now()}-${i}-${Math.random()}`,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5, // Upward smash explosion force
        rotation: Math.random() * 360,
        rotSpeed: -25 + Math.random() * 50,
        size: 4 + Math.random() * 15,
        color: shardColors[Math.floor(Math.random() * shardColors.length)],
      });
    }
    setFragments((prev) => [...prev, ...newFragments]);

    // Generate Smoke/Dust particles (Puffs)
    const newSmoke: SmokeParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      newSmoke.push({
        id: `smoke-${Date.now()}-${i}-${Math.random()}`,
        x: startX,
        y: startY + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 15 + Math.random() * 20,
        alpha: 0.6 + Math.random() * 0.3,
      });
    }
    setSmokeParticles((prev) => [...prev, ...newSmoke]);

    // Delay to align perfectly with the fast hammer strike animation
    setTimeout(() => {
      onSmashEgg(eggId);
      setSmashingEgg(null);
    }, 400);
  };

  const handleRestoreClick = () => {
    playSynthSound('restore', isMuted);
    onRestoreAll();
  };

  return (
    <div 
      ref={containerRef}
      id="golden-egg-stage"
      className={`relative w-full bg-slate-950 rounded-3xl border-4 border-slate-900 p-6 shadow-2xl overflow-hidden min-h-[580px] flex flex-col justify-between select-none ${
        isShaking ? 'animate-shake' : ''
      }`}
    >
      {/* Dynamic Keyframes inject directly to maintain self-contained high fidelity */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3px, 2px) rotate(-0.5deg); }
          20%, 40%, 60%, 80% { transform: translate(3px, -2px) rotate(0.5deg); }
        }
        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }
        @keyframes ring-expand {
          0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; filter: brightness(2); }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; filter: blur(4px); }
        }
        .animate-ring-expand {
          animation: ring-expand 0.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Background Neon Grid / Stage Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-amber-500/5 blur-[120px] rounded-b-full pointer-events-none" />

      {/* Title & Stage Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-sm shadow-yellow-400" />
          <span className="text-xs font-mono font-bold tracking-widest text-amber-500/80 uppercase">
            Golden Mystery Eggs Desk
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer transition"
            title={isMuted ? "开启音效" : "静音"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[10px] text-amber-400/90 font-mono font-bold">
            一蛋一奖 绝对乱序
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 tracking-wider">
          🔨 敲击幸运金蛋 · 揭晓神秘大奖！
        </h1>
        <p className="text-[11px] md:text-xs text-slate-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
          全场一共有 <strong className="text-amber-400 font-black">{eggs.length}</strong> 枚一模一样的金蛋。奖池的所有精美礼品已<strong>彻底打乱，随机分布</strong>在不同的金蛋内！一蛋对应一个真实奖励，拒绝空奖与成类重复，点击立刻大力砸碎！
        </p>
      </div>

      {/* Main Golden Eggs Platter Desk */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-4">
        <div className="w-full max-w-5xl mx-auto px-4">
          
          {/* Main Grid Layout for Individual Mystery Eggs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5 relative z-10">
            {eggs.map((egg, index) => {
              const isSmashed = egg.isSmashed;
              const isSmashedNow = smashingEgg === egg.id;
              const isHovered = hoveredEgg === egg.id;

              // Display visual attributes based on tier
              const isGrand = egg.tierId === 'grand';
              const isSecond = egg.tierId === 'second';
              const isThird = egg.tierId === 'third';

              return (
                <div
                  key={egg.id}
                  id={`egg-${egg.id}`}
                  className="flex flex-col items-center relative group pb-2"
                  onMouseEnter={() => {
                    if (!isSmashed && smashingEgg === null) {
                      setHoveredEgg(egg.id);
                      playSynthSound('hover', isMuted);
                    }
                  }}
                  onMouseLeave={() => setHoveredEgg(null)}
                >
                  
                  {/* Floating Hammer visual on hover */}
                  <AnimatePresence>
                    {isHovered && !isSmashed && !isSmashedNow && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6, y: -25, rotate: -40 }}
                        animate={{ opacity: 1, scale: 1.15, y: -38, rotate: -15 }}
                        exit={{ opacity: 0, scale: 0.6, y: -25 }}
                        className="absolute top-0 z-30 pointer-events-none drop-shadow-[0_5px_15px_rgba(251,191,36,0.6)]"
                      >
                        <div className="text-3xl select-none">🔨</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active Hammer swinging down with sudden heavy strike! */}
                  <AnimatePresence>
                    {isSmashedNow && (
                      <motion.div
                        initial={{ opacity: 1, scale: 1.4, y: -50, rotate: -45 }}
                        animate={{ 
                          rotate: [ -45, 20, -5 ],
                          y: [ -50, 0, -12 ],
                          scale: [ 1.4, 1.5, 1.3 ]
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4, ease: 'easeIn' }}
                        className="absolute top-0 z-40 pointer-events-none drop-shadow-[0_8px_25px_rgba(251,191,36,0.9)]"
                      >
                        <div className="text-4xl select-none">🔨</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Top Index Number Badge for unbroken mystery - or Tier badge when smashed! */}
                  <div className="w-full text-center h-5 mb-2 relative flex items-center justify-center">
                    {!isSmashed ? (
                      <span className="font-mono text-[10px] text-slate-500 font-bold group-hover:text-amber-400/90 transition-colors">
                        Egg #{String(index + 1).padStart(2, '0')}
                      </span>
                    ) : (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-block text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full border shadow-sm ${
                          isGrand 
                            ? 'bg-amber-950/90 text-amber-400 border-amber-500/50 shadow-amber-950' 
                            : isSecond
                            ? 'bg-fuchsia-950/90 text-fuchsia-400 border-fuchsia-500/50 shadow-fuchsia-950'
                            : isThird
                            ? 'bg-sky-950/90 text-sky-400 border-sky-500/50 shadow-sky-950'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-950'
                        }`}
                      >
                        {egg.prizeName.split(' ')[0]}
                      </motion.span>
                    )}
                  </div>

                  {/* Interactive Egg Stage / Cushion container */}
                  <div className="relative w-24 h-32 flex items-center justify-center">
                    
                    {/* Glowing backlight */}
                    <div className={`absolute -inset-1 rounded-full blur-xl transition-all duration-300 ${
                      isSmashed 
                        ? 'bg-slate-900/10'
                        : isHovered
                        ? 'bg-amber-400/25 scale-110'
                        : 'bg-amber-500/5'
                    }`} />

                    {/* Unbroken Shiny 3D Golden Egg */}
                    {!isSmashed ? (
                      <motion.div
                        whileHover={{ scale: 1.06, rotate: [0, -3, 3, 0] }}
                        animate={
                          isSmashedNow
                            ? { 
                                scale: [1, 0.8, 1.3, 0.9],
                                rotate: [0, -30, 35, 0],
                                transition: { duration: 0.4 }
                              }
                            : { y: [0, -3, 0] }
                        }
                        transition={{ 
                          y: { repeat: Infinity, duration: 2.5 + (index % 4) * 0.4, ease: "easeInOut" },
                          scale: { duration: 0.2 }
                        }}
                        onClick={() => handleSmash(egg.id, egg.isSmashed)}
                        className="relative w-18 h-24 rounded-t-[55%] rounded-b-[45%] flex items-center justify-center shadow-lg cursor-pointer bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 border border-amber-200/50 overflow-hidden text-amber-950"
                      >
                        {/* Realistic Curved Gloss highlight Overlay */}
                        <div className="absolute top-1 left-2 w-12 h-16 bg-white/20 rounded-full blur-[3px] opacity-75 transform -rotate-25 pointer-events-none" />
                        <div className="absolute top-0 -left-6 w-16 h-16 bg-white/10 transform -rotate-45 pointer-events-none" />

                        {/* Mysterious Question Mark Pattern */}
                        <div className="text-lg font-mono font-black opacity-35 tracking-tight pointer-events-none uppercase">
                          ?
                        </div>

                        {/* Gold dust shimmer stars */}
                        <Sparkles className="w-3.5 h-3.5 text-white/40 absolute top-2 right-2 animate-pulse pointer-events-none" />
                      </motion.div>
                    ) : (
                      /* Realistic High-Fidelity Broken Cracked Egg Shell with Pop-up Award */
                      <div className="relative w-24 h-24 flex flex-col items-center justify-end pointer-events-none">
                        
                        {/* Revealed Award Item bubble popping up with premium sparkle and float! */}
                        <motion.div
                          initial={{ y: 22, scale: 0.1, opacity: 0 }}
                          animate={{ y: -30, scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 150, damping: 10, delay: 0.05 }}
                          className="absolute z-20 flex flex-col items-center justify-center text-center"
                        >
                          {/* Mini floating container with color matched outline */}
                          <div className={`px-2 py-1.5 rounded-xl border flex items-center justify-center bg-slate-900 shadow-xl ${
                            isGrand 
                              ? 'border-amber-400 shadow-amber-950/80 text-amber-300' 
                              : isSecond
                              ? 'border-fuchsia-400 shadow-fuchsia-950/80 text-fuchsia-300'
                              : isThird
                              ? 'border-sky-400 shadow-sky-950/80 text-sky-300'
                              : 'border-rose-400 shadow-rose-950/80 text-rose-300'
                          }`}>
                            <span className="text-xs font-black tracking-wide whitespace-nowrap px-1 max-w-[85px] truncate">
                              {egg.itemName}
                            </span>
                          </div>
                          
                          {/* Floating indicator sparkle */}
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full absolute -top-1 -right-1 animate-ping" />
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-2.5 -right-2 animate-pulse" />
                        </motion.div>

                        {/* Left broken egg shell cup lying collapsed to the left */}
                        <motion.div 
                          initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
                          animate={{ y: 3, x: -16, rotate: -72, opacity: 0.9 }}
                          className="absolute bottom-3 left-0 w-11 h-8 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 border border-amber-200 rounded-t-[55%] pointer-events-none shadow-md" 
                          style={{
                            clipPath: 'polygon(15% 70%, 35% 100%, 70% 80%, 100% 45%, 70% 10%, 20% 15%, 0% 35%)'
                          }}
                        >
                          {/* Inner dark depth overlay to simulate eggshell thickness */}
                          <div className="absolute inset-0 bg-amber-950/50 mix-blend-multiply opacity-60" style={{ clipPath: 'inset(2px 0 0 2px)' }} />
                        </motion.div>

                        {/* Right broken egg shell cup lying collapsed to the right */}
                        <motion.div 
                          initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
                          animate={{ y: 11, x: 18, rotate: 60, opacity: 0.85 }}
                          className="absolute bottom-1.5 right-0 w-9 h-7 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border border-amber-300 pointer-events-none shadow-md" 
                          style={{
                            clipPath: 'polygon(20% 0%, 95% 15%, 100% 70%, 65% 100%, 10% 85%, 15% 45%)'
                          }}
                        >
                          <div className="absolute inset-0 bg-amber-950/50 mix-blend-multiply opacity-60" style={{ clipPath: 'inset(1px 2px 2px 0)' }} />
                        </motion.div>

                        {/* Tiny scattered golden debris shards lying on the cushion */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.8, x: -25, y: 15 }}
                          className="absolute bottom-1 w-3.5 h-2.5 bg-yellow-400 border border-amber-300 pointer-events-none"
                          style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
                        />
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.9, x: 26, y: 18, rotate: 45 }}
                          className="absolute bottom-1 w-2.5 h-2 bg-amber-300 border border-amber-500 pointer-events-none"
                          style={{ clipPath: 'polygon(20% 0%, 100% 40%, 40% 100%, 0% 80%)' }}
                        />
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.75, x: 3, y: 16 }}
                          className="absolute bottom-1 w-3 h-2 bg-yellow-200 pointer-events-none"
                          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
                        />

                        {/* Broken Bottom Shell Cup sitting robustly in the red cushion */}
                        <motion.div 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-11 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-800 border border-amber-300/80 rounded-b-[45%] flex items-center justify-center relative overflow-hidden shadow-md"
                          style={{
                            clipPath: 'polygon(0% 30%, 15% 10%, 30% 35%, 50% 15%, 70% 32%, 85% 8%, 100% 35%, 100% 100%, 0% 100%)'
                          }}
                        >
                          {/* Inner dark hollow cavity (realistic hollow 3D egg shell) */}
                          <div className="absolute top-0 inset-x-0 h-4 bg-slate-950 flex flex-col justify-end">
                            {/* Fine fracture dark lines showing cracked details inside */}
                            <div className="w-full h-[1px] bg-amber-950/70" />
                            <div className="w-[1px] h-3 bg-amber-900/60 mx-auto transform rotate-12" />
                          </div>

                          {/* Crack lines on outer shell */}
                          <div className="absolute bottom-1 left-4 w-4 h-6 opacity-30 border-r border-slate-900 transform rotate-12 pointer-events-none" />
                          <div className="absolute bottom-2 right-4 w-3 h-4 opacity-25 border-l border-slate-950 transform -rotate-25 pointer-events-none" />
                          
                          {/* Reflective shine on bottom shell */}
                          <div className="absolute top-3 left-1.5 w-10 h-6 bg-white/10 rounded-full blur-[1px] pointer-events-none" />
                        </motion.div>
                      </div>
                    )}

                    {/* Luxurious Red Satin Cushion Stand - Depresses under smash! */}
                    <div className={`absolute bottom-1 w-20 h-4 rounded-[100%] bg-gradient-to-r from-red-800 to-rose-950 border border-red-700/50 shadow-md flex items-center justify-center z-0 pointer-events-none transition-all duration-200 ${
                      isSmashed ? 'h-3 border-rose-800/60 brightness-75' : ''
                    }`}>
                      <div className="w-[85%] h-[70%] rounded-[100%] bg-yellow-400/10 blur-[1px]" />
                    </div>
                  </div>

                  {/* Smashed / Unbroken Label Indicator at very bottom */}
                  <div className="w-full text-center mt-1">
                    {isSmashed ? (
                      <span className="text-[9px] font-black text-amber-500/90 animate-pulse">
                        已敲碎 💥
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500">
                        未敲开
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wooden/Golden Table Runner Platter Board */}
          <div className="w-full h-8 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border-t border-slate-800 shadow-xl mt-[-10px] relative z-0 flex items-center justify-center">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10" />
            <div className="text-[9px] font-mono tracking-widest text-slate-600 font-bold uppercase">
              ★ PREMIUM LUCKY DESK BOARD ★
            </div>
          </div>
        </div>
      </div>

      {/* Restore Button & Guidelines Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-900">
        <div className="flex items-center gap-2 text-slate-400 text-xs text-center sm:text-left">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>点击金蛋即可砸开。所有蛋砸碎后，管理员可点击右侧按钮重新摆盘并恢复库存！</span>
        </div>

        {/* Tactile Restore Stocks & Egg Platter Button */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 15px rgba(245,158,11,0.25)' }}
          whileTap={{ scale: 0.96 }}
          onClick={handleRestoreClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/40 text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 font-black text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-colors duration-200 shrink-0"
        >
          <RotateCcw className="w-4 h-4 text-amber-950 animate-spin" style={{ animationDuration: '6s' }} />
          <span>恢复所有金蛋与库存</span>
        </motion.button>
      </div>

      {/* Dynamic Visual Effects Overlay (Flash & Smoke) */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        
        {/* Flash Effects */}
        {flashEffects.map((f) => (
          <div
            key={f.id}
            className="absolute rounded-full bg-gradient-to-r from-white via-yellow-200 to-transparent animate-ring-expand border border-white/60"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              width: '120px',
              height: '120px',
            }}
          />
        ))}

        {/* Smoke Puffs */}
        {smokeParticles.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-slate-200/20 blur-[6px]"
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.alpha,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251,241,190,0.25) 0%, rgba(251,211,141,0.05) 70%, transparent 100%)',
            }}
          />
        ))}

        {/* Physics Jagged Shards */}
        {fragments.map((f) => (
          <div
            key={f.id}
            className="absolute shadow-sm"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              backgroundColor: f.color,
              transform: `translate(-50%, -50%) rotate(${f.rotation}deg)`,
              opacity: Math.max(0, 1 - f.y / 750),
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' // Jagged shards shape
            }}
          />
        ))}
      </div>
    </div>
  );
}
