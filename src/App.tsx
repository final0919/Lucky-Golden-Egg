import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, History, Sparkles, Award, Star, BookOpen } from 'lucide-react';
import { Prize, WinningRecord, PrizeTier, GoldenEgg } from './types';
import GoldenEggStage from './components/GoldenEggStage';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import PrizeRevealModal from './components/PrizeRevealModal';

const LOCAL_STORAGE_PRIZES_KEY = 'lucky_claw_machine_prizes_v2';
const LOCAL_STORAGE_HISTORY_KEY = 'lucky_claw_machine_history_v2';
const LOCAL_STORAGE_EGGS_KEY = 'lucky_egg_list_v3';

const DEFAULT_PRIZES: Prize[] = [
  {
    id: 'grand',
    name: '一等奖 (超级大奖)',
    itemName: '100元 海底捞',
    color: '#fbbf24',
    gradient: 'from-amber-400 to-yellow-500',
    total: 1,
    remaining: 1,
    probability: 5,
    accentColor: 'amber',
  },
  {
    id: 'second',
    name: '二等奖 (豪华好礼)',
    itemName: '玩偶任选 🎧',
    color: '#d946ef',
    gradient: 'from-fuchsia-400 to-purple-600',
    total: 2,
    remaining: 2,
    probability: 15,
    accentColor: 'fuchsia',
  },
  {
    id: 'third',
    name: '三等奖 (精美好礼)',
    itemName: '奶茶',
    color: '#38bdf8',
    gradient: 'from-sky-400 to-blue-600',
    total: 4,
    remaining: 4,
    probability: 30,
    accentColor: 'sky',
  },
  {
    id: 'encouragement',
    name: '鼓励奖 (快乐回馈)',
    itemName: '玩偶挂件',
    color: '#fb7185',
    gradient: 'from-pink-400 to-rose-600',
    total: 9,
    remaining: 9,
    probability: 50,
    accentColor: 'rose',
  },
];

const getFormattedTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

const generateEggsFromPrizes = (currentPrizes: Prize[]): GoldenEgg[] => {
  const list: GoldenEgg[] = [];
  currentPrizes.forEach((p) => {
    for (let i = 0; i < p.total; i++) {
      list.push({
        id: `egg-${p.id}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        tierId: p.id,
        prizeName: p.name,
        itemName: p.itemName,
        gradient: p.gradient,
        isSmashed: false,
      });
    }
  });

  // Fisher-Yates shuffle to place prizes in random secret eggs
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PRIZES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PRIZES;
    } catch {
      return DEFAULT_PRIZES;
    }
  });

  const [history, setHistory] = useState<WinningRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [eggs, setEggs] = useState<GoldenEgg[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_EGGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // If not stored, generate from prizes list
      const storedPrizes = localStorage.getItem(LOCAL_STORAGE_PRIZES_KEY);
      const currentPrizes = storedPrizes ? JSON.parse(storedPrizes) : DEFAULT_PRIZES;
      return generateEggsFromPrizes(currentPrizes);
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'game' | 'history'>('game');
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  // Prize Reveal Modal state
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPrize, setRevealedPrize] = useState<{
    tier: PrizeTier;
    tierName: string;
    prizeName: string;
    capsuleGradient: string;
  } | null>(null);

  // Sync state to localStorage on modification
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PRIZES_KEY, JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_EGGS_KEY, JSON.stringify(eggs));
  }, [eggs]);

  // Handle updates from admin settings panel
  const handleUpdatePrizes = (updatedPrizes: Prize[]) => {
    setPrizes(updatedPrizes);
    const newEggs = generateEggsFromPrizes(updatedPrizes);
    setEggs(newEggs);
  };

  const handleResetPrizes = () => {
    setPrizes(DEFAULT_PRIZES);
    const newEggs = generateEggsFromPrizes(DEFAULT_PRIZES);
    setEggs(newEggs);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Restore golden eggs & prizes stock (shuffles eggs and replenishes remaining stock)
  const handleRestoreAll = () => {
    const freshEggs = generateEggsFromPrizes(prizes);
    setEggs(freshEggs);
    setPrizes((prev) => prev.map((p) => ({ ...p, remaining: p.total })));
  };

  // Smashing process engine
  const handleSmashEgg = (eggId: string) => {
    const eggIndex = eggs.findIndex((e) => e.id === eggId);
    if (eggIndex === -1 || eggs[eggIndex].isSmashed) return;

    const egg = eggs[eggIndex];
    const selectedPrize = prizes.find((p) => p.id === egg.tierId);
    if (!selectedPrize) return;

    // 1. Mark this specific egg as smashed
    const updatedEggs = [...eggs];
    updatedEggs[eggIndex] = { ...egg, isSmashed: true };
    setEggs(updatedEggs);

    // 2. Decrement remaining stock of corresponding prize category
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === egg.tierId ? { ...p, remaining: Math.max(0, p.remaining - 1) } : p
      )
    );

    // 3. Record winning entry
    const newRecord: WinningRecord = {
      id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getFormattedTimestamp(),
      tierId: selectedPrize.id,
      tierName: selectedPrize.name,
      prizeName: selectedPrize.itemName,
      capsuleColor: '#fbbf24',
      capsuleGradient: selectedPrize.gradient,
    };

    setHistory((prev) => [newRecord, ...prev]);

    // 4. Trigger Modal Visual Reveal
    setRevealedPrize({
      tier: selectedPrize.id,
      tierName: selectedPrize.name.split(' ')[0], // e.g. "一等奖"
      prizeName: selectedPrize.itemName,
      capsuleGradient: selectedPrize.gradient,
    });
    setRevealModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-100/50 via-slate-50 to-amber-50/20 text-slate-800 flex flex-col font-sans">
      
      {/* Decorative background ambient neon glows */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-amber-400/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-yellow-300/5 blur-[120px] pointer-events-none" />

      {/* Main Top Header Navigation */}
      <header className="sticky top-0 bg-white/70 backdrop-blur-md border-b border-amber-100/80 z-40 transition-shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-400/20">
              <span className="text-xl">🔨</span>
            </div>
            <div>
              <div className="font-display font-black text-slate-900 tracking-tight flex items-center gap-1.5 text-base md:text-lg">
                <span>幸运金蛋</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">v3.0</span>
              </div>
              <p className="text-[10px] text-amber-800/70 font-semibold font-sans">自助式砸蛋抽奖</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Statistics Ticker for Large screens */}
            <div className="hidden md:flex items-center gap-4 text-xs font-semibold mr-2">
              <div className="px-3 py-1.5 bg-amber-50/60 rounded-xl border border-amber-100/50 flex items-center gap-1.5 text-amber-800">
                <Star className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-sans">中奖人次: <strong className="text-slate-950 font-black font-mono">{history.length}</strong> 份</span>
              </div>
              <div className="px-3 py-1.5 bg-yellow-50/60 rounded-xl border border-yellow-100/50 flex items-center gap-1.5 text-amber-900">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-sans">大奖库存: <strong className="text-slate-950 font-black font-mono">
                  {prizes.find((p) => p.id === 'grand')?.remaining || 0}
                </strong> 份</span>
              </div>
            </div>

            {/* Secret Admin Panel Toggle Button */}
            <button
              onClick={() => setIsAdminVisible(!isAdminVisible)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAdminVisible
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-amber-50 border border-amber-100/50 text-amber-800 hover:bg-amber-100/80'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${isAdminVisible ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              <span>{isAdminVisible ? '收起配置后台' : '🔧 管理员后台'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Welcome Guidelines Ticker banner */}
        <div className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-4 text-white shadow-md shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base flex items-center gap-1.5">
                <span>如何玩转砸金蛋</span>
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              </h3>
              <p className="text-xs text-amber-50/90 mt-0.5 leading-relaxed font-medium">
                桌面摆放的金蛋分别绑定了专属的神秘好礼！奖品位置完全被打乱。金锤挥起，点击即可大力砸碎金蛋！砸开后蛋壳破裂，当场爆出大奖！
              </p>
            </div>
          </div>
        </div>

        {/* Sequential Layout Grid */}
        <div className="flex flex-col gap-6">
          
          {/* TOP FULL-WIDTH SECTION: Golden Egg Game Platter */}
          {activeTab === 'game' ? (
            <div className="w-full">
              <GoldenEggStage
                prizes={prizes}
                eggs={eggs}
                onSmashEgg={handleSmashEgg}
                onRestoreAll={handleRestoreAll}
              />
            </div>
          ) : null}

          {/* HIDDEN BACKEND CONFIGURATION */}
          <AnimatePresence>
            {isAdminVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-white/80 backdrop-blur rounded-2xl border border-amber-100 shadow-sm"
              >
                <SettingsPanel
                  prizes={prizes}
                  onUpdatePrizes={handleUpdatePrizes}
                  onResetPrizes={handleResetPrizes}
                  onClearHistory={handleClearHistory}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOWER SECTION: History / Statistics block */}
          <div className={activeTab === 'history' ? 'block' : 'hidden lg:block'}>
            <HistoryPanel
              history={history}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-amber-100 py-2.5 px-4 flex items-center justify-around z-40 shadow-[0_-4px_15px_rgba(245,158,11,0.06)]">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors duration-200 cursor-pointer ${
            activeTab === 'game' ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🔨</span>
          <span>幸运砸金蛋</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors duration-200 cursor-pointer ${
            activeTab === 'history' ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span>中奖名单</span>
        </button>
      </div>

      <div className="h-16 lg:hidden" />

      {/* Footer credits */}
      <footer className="py-6 text-center text-xs text-amber-900/40 border-t border-amber-100/50 mt-auto bg-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 幸运金蛋. Crafted for joyful student rewards and party surprises.</p>
        </div>
      </footer>

      {/* Celebrate Modal */}
      {revealedPrize && (
        <PrizeRevealModal
          isOpen={revealModalOpen}
          onClose={() => setRevealModalOpen(false)}
          tier={revealedPrize.tier}
          tierName={revealedPrize.tierName}
          prizeName={revealedPrize.prizeName}
          capsuleGradient={revealedPrize.capsuleGradient}
        />
      )}
    </div>
  );
}
