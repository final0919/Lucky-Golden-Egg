import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, Gift, Heart, Calendar, Search, Download, Trash2, Tag, AlertCircle } from 'lucide-react';
import { WinningRecord, PrizeTier } from '../types';

interface HistoryPanelProps {
  history: WinningRecord[];
  onClearHistory: () => void;
}

export default function HistoryPanel({ history, onClearHistory }: HistoryPanelProps) {
  const [filter, setFilter] = useState<PrizeTier | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getTierIcon = (tierId: PrizeTier) => {
    switch (tierId) {
      case 'grand':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'second':
        return <Award className="w-4 h-4 text-fuchsia-500" />;
      case 'third':
        return <Gift className="w-4 h-4 text-sky-500" />;
      case 'encouragement':
      default:
        return <Heart className="w-4 h-4 text-rose-500" />;
    }
  };

  const getTierBadgeClass = (tierId: PrizeTier) => {
    switch (tierId) {
      case 'grand':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'second':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'third':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'encouragement':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  // Filter & Search records
  const filteredRecords = history.filter((record) => {
    const matchesTier = filter === 'all' || record.tierId === filter;
    const matchesSearch = record.prizeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.tierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  // Export history to CSV file
  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    // Add BOM header for Excel UTF-8 display compatibility
    let csvContent = '\uFEFF';
    csvContent += '序号,获奖时间,奖项等级,奖品内容\n';
    
    history.forEach((record, index) => {
      csvContent += `${index + 1},"${record.timestamp}","${record.tierName}","${record.prizeName}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `中奖记录_幸运砸金蛋_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="history-panel" className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-100 p-6 shadow-sm">
      {/* Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-amber-100">
        <div>
          <h2 className="text-lg font-display font-black text-amber-950 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>砸蛋中奖历史统计 (<span className="font-mono">{history.length}</span>)</span>
          </h2>
          <p className="text-xs font-medium text-amber-800/70 mt-0.5">记录每一次成功敲碎金蛋爆出的幸运大奖</p>
        </div>

        {history.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出CSV表单</span>
          </motion.button>
        )}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="space-y-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="搜索奖品或等级..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-amber-50/30 border border-amber-100 rounded-xl text-xs text-slate-900 placeholder-amber-400 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/30 transition-all duration-150"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1 bg-amber-50/40 p-1 rounded-xl border border-amber-100/50">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 min-w-[55px] text-center py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer transition-all duration-200 ${
              filter === 'all'
                ? 'bg-white text-amber-950 shadow-sm font-black'
                : 'text-amber-700 hover:text-amber-950'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('grand')}
            className={`flex-1 min-w-[55px] text-center py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer transition-all duration-200 ${
              filter === 'grand'
                ? 'bg-white text-amber-600 shadow-sm font-black'
                : 'text-amber-700 hover:text-amber-500'
            }`}
          >
            一等奖
          </button>
          <button
            onClick={() => setFilter('second')}
            className={`flex-1 min-w-[55px] text-center py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer transition-all duration-200 ${
              filter === 'second'
                ? 'bg-white text-fuchsia-600 shadow-sm font-black'
                : 'text-amber-700 hover:text-fuchsia-500'
            }`}
          >
            二等奖
          </button>
          <button
            onClick={() => setFilter('third')}
            className={`flex-1 min-w-[55px] text-center py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer transition-all duration-200 ${
              filter === 'third'
                ? 'bg-white text-amber-600 shadow-sm font-black'
                : 'text-amber-700 hover:text-amber-500'
            }`}
          >
            三等奖
          </button>
          <button
            onClick={() => setFilter('encouragement')}
            className={`flex-1 min-w-[55px] text-center py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer transition-all duration-200 ${
              filter === 'encouragement'
                ? 'bg-white text-rose-500 shadow-sm font-black'
                : 'text-amber-700 hover:text-rose-400'
            }`}
          >
            鼓励奖
          </button>
        </div>
      </div>

      {/* History Records Container */}
      <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-3 bg-white border border-amber-100 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-amber-200 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  {/* Miniature Capsule Egg Visual */}
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${record.capsuleGradient} flex items-center justify-center border-2 border-slate-900 shadow-sm relative overflow-hidden`}
                  >
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20" />
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-900/40" />
                    {getTierIcon(record.tierId)}
                  </div>

                  <div>
                    {/* Item Name */}
                    <div className="text-sm font-bold text-slate-950 line-clamp-1">{record.prizeName}</div>
                    
                    {/* Date/Time and Badge */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${getTierBadgeClass(record.tierId)}`}>
                        {record.tierName}
                      </span>
                      <span className="text-[10px] text-amber-800/70 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{record.timestamp}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue Index Badge */}
                <div className="text-[11px] font-bold text-amber-400 font-mono">
                  #{history.length - history.indexOf(record)}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-amber-100 rounded-2xl bg-amber-50/10"
            >
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <div className="text-sm font-medium text-amber-800/80">暂无符合条件的中奖历史</div>
              <p className="text-xs text-amber-600/50 mt-1 max-w-[200px] leading-relaxed">
                {searchTerm || filter !== 'all' ? '请尝试修改筛选条件或清除搜索词' : '点击上方的金色巨蛋，大力砸碎它们并爆出幸运大奖吧！'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
