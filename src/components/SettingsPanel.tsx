import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, Gift, Heart, RotateCcw, AlertCircle, Sparkles, Plus, Minus, Info } from 'lucide-react';
import { Prize, PrizeTier } from '../types';

interface SettingsPanelProps {
  prizes: Prize[];
  onUpdatePrizes: (updated: Prize[]) => void;
  onResetPrizes: () => void;
  onClearHistory: () => void;
}

export default function SettingsPanel({
  prizes,
  onUpdatePrizes,
  onResetPrizes,
  onClearHistory,
}: SettingsPanelProps) {

  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Update specific field for a prize tier
  const handleFieldChange = (tierId: PrizeTier, field: keyof Prize, value: string | number) => {
    const updated = prizes.map((prize) => {
      if (prize.id === tierId) {
        const updatedPrize = { ...prize, [field]: value };
        // If updating total stock, adjust remaining stock proportionally or snap it
        if (field === 'total') {
          const numValue = Number(value);
          const diff = numValue - prize.total;
          updatedPrize.remaining = Math.max(0, prize.remaining + diff);
        }
        return updatedPrize;
      }
      return prize;
    });
    onUpdatePrizes(updated);
  };

  // Quick increment/decrement stock helper
  const handleStockAdjust = (tierId: PrizeTier, delta: number) => {
    const prize = prizes.find((p) => p.id === tierId);
    if (!prize) return;
    const newTotal = Math.max(0, prize.total + delta);
    handleFieldChange(tierId, 'total', newTotal);
  };

  const getTierIcon = (tierId: PrizeTier) => {
    switch (tierId) {
      case 'grand':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'second':
        return <Award className="w-5 h-5 text-fuchsia-500" />;
      case 'third':
        return <Gift className="w-5 h-5 text-sky-500" />;
      case 'encouragement':
      default:
        return <Heart className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div id="settings-panel" className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-100 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-amber-100/60 pb-4">
        <div>
          <h2 className="text-lg font-display font-black text-amber-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>奖项池后台配置</span>
          </h2>
          <p className="text-xs font-medium text-amber-800/70 mt-0.5">自主配置一等奖到鼓励奖的内容与数量比例</p>
        </div>
        
        {/* Admin actions */}
        <div className="flex flex-wrap items-center gap-2">
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg p-1 animate-fadeIn">
              <span className="text-[10px] text-amber-800 font-bold px-1.5">重置奖池默认值？</span>
              <button
                onClick={() => {
                  onResetPrizes();
                  setShowResetConfirm(false);
                }}
                className="px-2 py-1 text-[10px] font-black text-white bg-amber-500 hover:bg-amber-600 rounded cursor-pointer transition-colors"
              >
                确定
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 text-[10px] font-bold text-amber-600 hover:text-amber-800 cursor-pointer"
              >
                取消
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowResetConfirm(true);
                setShowClearConfirm(false); // Close other if open
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-medium cursor-pointer transition-colors duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </motion.button>
          )}
          
          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg p-1 animate-fadeIn">
              <span className="text-[10px] text-red-800 font-bold px-1.5">清空所有中奖历史？</span>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-1 text-[10px] font-black text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer transition-colors"
              >
                确定
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 text-[10px] font-bold text-red-600 hover:text-red-800 cursor-pointer"
              >
                取消
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowClearConfirm(true);
                setShowResetConfirm(false); // Close other if open
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-medium cursor-pointer transition-colors duration-200"
            >
              <span>清空中奖历史</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Prize Form List */}
      <div className="space-y-5">
        {prizes.map((prize) => {
          const percentRemaining = prize.total > 0 ? (prize.remaining / prize.total) * 100 : 0;
          
          return (
            <div
              key={prize.id}
              className="p-4 rounded-xl bg-amber-50/30 border border-amber-100/50 hover:bg-amber-50/50 transition-colors duration-200"
            >
              {/* Prize Header */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white shadow-sm flex items-center justify-center border border-amber-100">
                    {getTierIcon(prize.id)}
                  </div>
                  <span className="font-display font-black text-slate-900 text-sm">{prize.name}</span>
                </div>
                
                {/* Visual Pill Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black font-mono border ${
                  prize.id === 'grand' 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : prize.id === 'second'
                    ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200'
                    : prize.id === 'third'
                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  权重: {prize.probability}%
                </span>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Reward Item Name Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800/80 mb-1">奖品名称</label>
                  <input
                    type="text"
                    value={prize.itemName}
                    onChange={(e) => handleFieldChange(prize.id, 'itemName', e.target.value)}
                    placeholder="输入具体奖品内容"
                    className="w-full bg-white border border-amber-100 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-150"
                  />
                </div>

                {/* Stock Controls */}
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800/80 mb-1">奖池库存 (份)</label>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleStockAdjust(prize.id, -1)}
                      className="p-2 rounded-lg bg-white border border-amber-100 text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    
                    <input
                      type="number"
                      min="0"
                      value={prize.total}
                      onChange={(e) => handleFieldChange(prize.id, 'total', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-amber-100 rounded-lg py-1.5 px-2 text-center text-xs font-bold text-slate-900 outline-none focus:border-amber-400 transition-all duration-150"
                    />

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleStockAdjust(prize.id, 1)}
                      className="p-2 rounded-lg bg-white border border-amber-100 text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stock Progress Bar */}
              <div className="mt-3.5 pt-3 border-t border-amber-100/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full max-w-[70%]">
                  <div className="w-full bg-amber-100/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentRemaining}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        prize.id === 'grand' 
                          ? 'from-amber-400 to-amber-500' 
                          : prize.id === 'second'
                          ? 'from-fuchsia-400 to-fuchsia-500'
                          : prize.id === 'third'
                          ? 'from-sky-400 to-sky-500'
                          : 'from-rose-400 to-rose-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-black font-mono text-amber-700/80 shrink-0 whitespace-nowrap">
                    {prize.remaining} / {prize.total}
                  </span>
                </div>
                
                {prize.remaining === 0 ? (
                  <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 shrink-0 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    <span>库存已空</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                    充足
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Probability Notice */}
      <div className="mt-5 p-3.5 rounded-xl bg-amber-50/55 border border-amber-100 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>运作机制</strong>：系统会根据上述配置的默认奖项与数量，在一键摆盘时，将所有真实奖项<strong>彻底打乱、均匀随机分布</strong>到每一个金蛋中。保证每个蛋对应一个真实奖励、公平真实，点开即碎，爆出惊喜！
        </p>
      </div>
    </div>
  );
}
