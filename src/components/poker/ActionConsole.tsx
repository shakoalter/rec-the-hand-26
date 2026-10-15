import React, { useState } from 'react';
import { ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { Minus, Plus } from 'lucide-react';

interface ActionConsoleProps {
  heroAction: ActionType | null;
  raiseAmount: number;
  onHeroActionSelect: (action: ActionType, amount?: number) => void;
  onRaiseAmountChange: (amount: number) => void;
  bbAmount: number;
}

const PRESETS = [
  { label: '2K', amount: 2000 },
  { label: '3K', amount: 3000 },
  { label: '4K', amount: 4000 },
  { label: '5K', amount: 5000 },
  { label: '8K', amount: 8000 },
  { label: '10K', amount: 10000 },
];

export const ActionConsole: React.FC<ActionConsoleProps> = ({
  heroAction,
  raiseAmount,
  onHeroActionSelect,
  onRaiseAmountChange,
  bbAmount
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(raiseAmount);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const handleAction = (action: ActionType) => {
    triggerHaptic();
    if (action === 'raise') {
      onHeroActionSelect('raise', raiseAmount);
    } else if (action === 'call') {
      onHeroActionSelect('call', bbAmount);
    } else if (action === 'limp') {
      onHeroActionSelect('limp', bbAmount);
    } else {
      onHeroActionSelect('fold');
    }
  };

  const handlePresetSelect = (amount: number) => {
    triggerHaptic();
    setSelectedPreset(amount);
    onRaiseAmountChange(amount);
    if (heroAction === 'raise') {
      onHeroActionSelect('raise', amount);
    }
  };

  const handleDec = () => {
    triggerHaptic();
    const next = Math.max(bbAmount * 2, raiseAmount - 500);
    onRaiseAmountChange(next);
    setSelectedPreset(next);
  };

  const handleInc = () => {
    triggerHaptic();
    const next = raiseAmount + 500;
    onRaiseAmountChange(next);
    setSelectedPreset(next);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full bg-[#09111C]/95 border-t border-[#1C2C3F] pt-2 pb-1 select-none">
      {/* Badge HERO Verde idéntico al mockup */}
      <div className="self-start">
        <div className="px-3 py-1 rounded-full border-2 border-poker-emerald bg-[#092B1D] text-poker-emerald font-black text-xs tracking-wider flex items-center gap-1 shadow-neon-emerald">
          HERO
        </div>
      </div>

      {/* 4 Botones Táctiles Grandes de Acción idénticos al mockup */}
      <div className="grid grid-cols-4 gap-2">
        {/* FOLD */}
        <button
          type="button"
          onClick={() => handleAction('fold')}
          className={clsx(
            'h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-md',
            heroAction === 'fold'
              ? 'bg-slate-700 text-white ring-2 ring-slate-400'
              : 'bg-[#1E2632] hover:bg-[#273240] text-slate-200 border border-slate-700/60'
          )}
        >
          Fold
        </button>

        {/* LIMP */}
        <button
          type="button"
          onClick={() => handleAction('limp')}
          className={clsx(
            'h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center text-white shadow-md',
            heroAction === 'limp'
              ? 'bg-[#00C853] ring-2 ring-emerald-300 shadow-neon-emerald'
              : 'bg-[#10B981] hover:bg-[#059669]'
          )}
        >
          Limp
        </button>

        {/* CALL */}
        <button
          type="button"
          onClick={() => handleAction('call')}
          className={clsx(
            'h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center text-white shadow-md',
            heroAction === 'call'
              ? 'bg-[#0066FF] ring-2 ring-blue-300 shadow-lg'
              : 'bg-[#1D72FE] hover:bg-[#155FD6]'
          )}
        >
          Call
        </button>

        {/* RAISE */}
        <button
          type="button"
          onClick={() => handleAction('raise')}
          className={clsx(
            'h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center text-white shadow-md',
            heroAction === 'raise'
              ? 'bg-[#E11D48] ring-2 ring-red-300 shadow-lg'
              : 'bg-[#EF4444] hover:bg-[#DC2626]'
          )}
        >
          Raise
        </button>
      </div>

      {/* Fila de Presets (2K, 3K, 4K [azul activo], 5K, 8K, 10K) */}
      <div className="grid grid-cols-6 gap-1.5 pt-0.5">
        {PRESETS.map((p) => {
          const isActive = selectedPreset === p.amount;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePresetSelect(p.amount)}
              className={clsx(
                'h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center select-none',
                isActive
                  ? 'bg-[#1D72FE] text-white shadow-md border border-blue-400'
                  : 'bg-[#131E2C] text-slate-300 border border-[#233347] hover:border-slate-500'
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Fila "Personalizado" con Stepper [-] 4.000 [+] */}
      <div className="flex items-center justify-between bg-[#0F1824] border border-[#1E2E42] rounded-2xl h-13 px-4 mt-0.5">
        <span className="text-sm font-semibold text-slate-300">
          Personalizado
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDec}
            className="w-9 h-9 rounded-xl bg-[#172536] hover:bg-[#203146] active:scale-90 text-slate-200 flex items-center justify-center font-bold"
            aria-label="Disminuir"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-base font-extrabold text-white min-w-[70px] text-center select-text">
            {raiseAmount.toLocaleString('es-AR')}
          </span>

          <button
            type="button"
            onClick={handleInc}
            className="w-9 h-9 rounded-xl bg-[#172536] hover:bg-[#203146] active:scale-90 text-slate-200 flex items-center justify-center font-bold"
            aria-label="Aumentar"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
