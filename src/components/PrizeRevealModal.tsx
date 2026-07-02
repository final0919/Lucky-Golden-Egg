import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gift, Award, Heart, Sparkles, Star, Check } from 'lucide-react';
import { PrizeTier } from '../types';

interface PrizeRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PrizeTier;
  tierName: string;
  prizeName: string;
  capsuleGradient: string;
}

interface Particle {
  id: number;
  x: number;      // initial horizontal percentage
  y: number;      // target vertical percentage
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  shape: 'square' | 'circle' | 'star' | 'heart';
}

export default function PrizeRevealModal({
  isOpen,
  onClose,
  tier,
  tierName,
  prizeName,
  capsuleGradient,
}: PrizeRevealModalProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Configure style parameters based on prize tier
  const getTierConfig = (pTier: PrizeTier) => {
    switch (pTier) {
      case 'grand':
        return {
          bgGradient: 'from-amber-500 via-yellow-400 to-orange-500',
          textColor: 'text-amber-500',
          borderColor: 'border-yellow-400',
          shadowColor: 'shadow-yellow-400/50',
          icon: Trophy,
          iconColor: 'text-yellow-500',
          title: '🏆 极其罕见！欧皇降临！ 🏆',
          subtitle: '砸碎金蛋爆出了超级一等奖！',
          soundEmoji: '🎉✨🌟',
          cardBg: 'bg-slate-900 border-yellow-400 border-4 shadow-2xl',
          primaryBtn: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30',
          particleColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FFF', '#EF4444', '#10B981'],
          particleShapes: ['star', 'circle', 'square'] as const,
        };
      case 'second':
        return {
          bgGradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
          textColor: 'text-fuchsia-400',
          borderColor: 'border-fuchsia-400',
          shadowColor: 'shadow-fuchsia-400/40',
          icon: Award,
          iconColor: 'text-fuchsia-400',
          title: '✨ 恭喜你！手气太棒了！ ✨',
          subtitle: '砸碎金蛋爆出了尊享二等奖！',
          soundEmoji: '🎉🎈🌟',
          cardBg: 'bg-slate-950 border-fuchsia-500 border-3 shadow-xl',
          primaryBtn: 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white hover:from-fuchsia-600 hover:to-pink-600 shadow-lg shadow-fuchsia-500/30',
          particleColors: ['#D946EF', '#A855F7', '#EC4899', '#3B82F6', '#FFF'],
          particleShapes: ['circle', 'square'] as const,
        };
      case 'third':
        return {
          bgGradient: 'from-sky-400 via-blue-500 to-cyan-400',
          textColor: 'text-sky-500',
          borderColor: 'border-sky-300',
          shadowColor: 'shadow-sky-400/30',
          icon: Gift,
          iconColor: 'text-sky-500',
          title: '🎁 棒极了！幸运降临 🎁',
          subtitle: '砸碎金蛋爆出了精美三等奖！',
          soundEmoji: '🎉🎊',
          cardBg: 'bg-slate-900 border-sky-400 border-2 shadow-lg',
          primaryBtn: 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 text-white hover:from-sky-500 hover:to-blue-600 shadow-lg shadow-sky-400/30',
          particleColors: ['#38BDF8', '#60A5FA', '#22D3EE', '#FFF', '#10B981'],
          particleShapes: ['circle', 'square'] as const,
        };
      case 'encouragement':
      default:
        return {
          bgGradient: 'from-rose-400 via-pink-400 to-orange-300',
          textColor: 'text-rose-400',
          borderColor: 'border-pink-300',
          shadowColor: 'shadow-pink-400/20',
          icon: Heart,
          iconColor: 'text-rose-400',
          title: '💝 暖心奉献！再接再厉 💝',
          subtitle: '砸碎金蛋爆出了甜甜鼓励奖！',
          soundEmoji: '🌸🍬',
          cardBg: 'bg-white border-pink-200 border shadow-md',
          primaryBtn: 'bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:from-rose-500 hover:to-pink-500 shadow-md',
          particleColors: ['#FB7185', '#F472B6', '#FCA5A5', '#FEE2E2', '#FFF'],
          particleShapes: ['heart', 'circle'] as const,
        };
    }
  };

  const config = getTierConfig(tier);

  // Generate particles based on current tier
  useEffect(() => {
    if (isOpen) {
      const pShapes = config.particleShapes;
      const count = tier === 'grand' ? 80 : tier === 'second' ? 50 : 35;
      const generated: Particle[] = Array.from({ length: count }).map((_, i) => {
        const shape = pShapes[Math.floor(Math.random() * pShapes.length)];
        return {
          id: i,
          x: Math.random() * 100, // percentage horizontal placement
          y: Math.random() * 50 + 105, // fall below bottom of viewport
          size: Math.random() * (tier === 'grand' ? 12 : 8) + 6,
          color: config.particleColors[Math.floor(Math.random() * config.particleColors.length)],
          delay: Math.random() * 0.4,
          duration: Math.random() * 1.5 + (tier === 'grand' ? 1.8 : 2.2),
          rotation: Math.random() * 360,
          shape: shape as 'square' | 'circle' | 'star' | 'heart',
        };
      });
      setParticles(generated);
    } else {
      setParticles([]);
    }
  }, [isOpen, tier]);

  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="prize-reveal-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Particle Effects Canvas Simulator */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ 
                  x: `${p.x}vw`, 
                  y: '-10vh', 
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  y: `${p.y}vh`,
                  rotate: p.rotation + (Math.random() > 0.5 ? 360 : -360),
                  opacity: [1, 1, 0.7, 0]
                }}
                transition={{ 
                  delay: p.delay, 
                  duration: p.duration, 
                  ease: 'easeOut' 
                }}
                className="absolute flex items-center justify-center"
                style={{
                  width: p.size,
                  height: p.size,
                }}
              >
                {p.shape === 'star' && (
                  <Star className="w-full h-full fill-current" style={{ color: p.color }} />
                )}
                {p.shape === 'heart' && (
                  <Heart className="w-full h-full fill-current animate-pulse" style={{ color: p.color }} />
                )}
                {p.shape === 'circle' && (
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: p.color }} />
                )}
                {p.shape === 'square' && (
                  <div className="w-full h-full transform" style={{ backgroundColor: p.color }} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Core Reward Card Content */}
          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: {
                type: 'spring',
                damping: 15,
                stiffness: 120
              }
            }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            className={`relative w-full max-w-md md:max-w-lg rounded-3xl p-8 md:p-10 ${config.cardBg} z-10`}
          >
            {/* Spinning decorative background rays (for higher tiers) */}
            {(tier === 'grand' || tier === 'second') && (
              <div className="absolute inset-0 -m-8 pointer-events-none overflow-hidden rounded-3xl">
                <div className="absolute inset-0 opacity-10 animate-spin bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent scale-150 duration-[12000ms]" />
              </div>
            )}

            {/* Header capsule style */}
            <div className="flex flex-col items-center text-center">
              {/* Outer Capsule Representation */}
              <motion.div 
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ 
                  rotate: [15, -15, 15, -10, 5, 0],
                  scale: 1,
                  transition: { duration: 1.2, ease: 'easeOut' }
                }}
                className={`w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br ${capsuleGradient} shadow-inner flex items-center justify-center border-4 border-slate-900 relative overflow-hidden mb-6`}
              >
                {/* Inside details (revealed!) */}
                <div className="absolute inset-0 bg-white/20 rounded-full mix-blend-overlay" />
                <div className="absolute -bottom-4 inset-x-0 h-1/2 bg-black/15 flex items-center justify-center">
                  <div className="text-white/60 text-[10px] font-mono select-none">GOLD EGG</div>
                </div>
                {/* Center dividing line */}
                <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-900/60 z-1" />
                
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1], transition: { delay: 0.5, duration: 0.5 } }}
                  className="bg-white rounded-2xl p-3 shadow-lg z-2 flex items-center justify-center"
                >
                  <IconComponent className={`w-10 h-10 md:w-12 md:h-12 ${config.iconColor} animate-bounce`} />
                </motion.div>
              </motion.div>

              {/* Dynamic Subtitle ribbon */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wider uppercase mb-3 bg-gradient-to-r ${config.bgGradient} text-white shadow-md`}
              >
                {tierName}
              </motion.div>

              {/* Main Congratulations Headline */}
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.5 } }}
                className={`text-2xl md:text-3xl font-display font-black tracking-tight mb-2 ${tier === 'encouragement' ? 'text-slate-800' : 'text-white'}`}
              >
                {config.title}
              </motion.h1>

              <p className={`text-sm font-medium mb-6 ${tier === 'encouragement' ? 'text-slate-500' : 'text-slate-300'}`}>
                {config.subtitle}
              </p>

              {/* Reward Reveal Area */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  transition: { delay: 0.7, type: 'spring', stiffness: 120, damping: 12 } 
                }}
                className={`w-full p-6 md:p-8 rounded-2xl mb-8 flex flex-col items-center justify-center border ${
                  tier === 'grand' 
                    ? 'bg-amber-500/10 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                    : tier === 'second'
                    ? 'bg-fuchsia-500/10 border-fuchsia-400/30 shadow-[0_0_20px_rgba(217,70,239,0.15)]'
                    : tier === 'third'
                    ? 'bg-sky-500/10 border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    : 'bg-rose-500/5 border-rose-200 shadow-sm'
                }`}
              >
                <div className={`text-[10px] uppercase font-mono tracking-widest font-bold mb-1 ${tier === 'encouragement' ? 'text-slate-400' : 'text-slate-400'}`}>
                  获得奖品 (Prize)
                </div>
                <div className={`text-2xl md:text-3xl font-display font-black tracking-wide ${
                  tier === 'grand'
                    ? 'text-amber-400 animate-pulse drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]'
                    : tier === 'second'
                    ? 'text-fuchsia-400 drop-shadow-[0_2px_8px_rgba(217,70,239,0.5)]'
                    : tier === 'third'
                    ? 'text-sky-400'
                    : 'text-slate-800'
                }`}>
                  {prizeName}
                </div>
                
                {/* Visual stars or details */}
                {tier === 'grand' && (
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400 animate-spin" style={{ animationDuration: `${star * 3}s` }} />
                    ))}
                  </div>
                )}
                {tier === 'second' && (
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3].map((star) => (
                      <Sparkles key={star} className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Confirm / Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.9 } }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${config.primaryBtn}`}
              >
                <Check className="w-5 h-5" />
                <span>收下奖励，继续快乐！</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
