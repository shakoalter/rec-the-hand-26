import React from 'react';
import { Users } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { cn } from '../../utils/cn';

interface PlayerCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
}

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9];

export const PlayerCountSelector: React.FC<PlayerCountSelectorProps> = ({ value, onChange }) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleSelect = (count: number) => {
    triggerHaptic();
    onChange(count);
  };

  return (
    <GlassCard compact className="relative overflow-hidden">
      {/* Compact Title & Icon */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-700/30 border border-slate-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Users className="w-4 h-4 text-slate-300" />
          </div>
          <h2 className="text-white font-bold text-sm sm:text-base tracking-wide">
            Cantidad de jugadores
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">Incluyéndote</span>
      </div>

      {/* 8 buttons selector in 4x2 ergonomic grid */}
      <div className="grid grid-cols-4 gap-2">
        {PLAYER_OPTIONS.map((count) => {
          const isSelected = value === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => handleSelect(count)}
              className={cn(
                'h-11 rounded-xl font-bold text-base transition-all duration-150 flex items-center justify-center select-none active:scale-90',
                isSelected
                  ? 'bg-[#0E2922] text-white border-2 border-poker-emerald shadow-neon-emerald'
                  : 'bg-[#121E2C] text-[#94A3B8] border border-[#223347] hover:border-slate-500 hover:text-white'
              )}
            >
              {count}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};
