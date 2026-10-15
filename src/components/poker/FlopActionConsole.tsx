import React, { useState } from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { Minus, Plus, CheckCircle2 } from 'lucide-react';

interface FlopActionConsoleProps {
  heroPosition: TablePosition;
  bbAmount: number;
  onHeroAction: (actionType: ActionType, amount?: number) => void;
}

export const FlopActionConsole: React.FC<FlopActionConsoleProps> = ({
  heroPosition,
  bbAmount,
  onHeroAction
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [betAmount, setBetAmount] = useState<number>(bbAmount * 5); // ej. 5.000 o 7.000

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const presets = [
    { label: `${(bbAmount * 3) / 1000}K`, amount: bbAmount * 3 },
    { label: `${(bbAmount * 5) / 1000}K`, amount: bbAmount * 5 },
    { label: `${(bbAmount * 7) / 1000}K`, amount: bbAmount * 7 },
    { label: `${(bbAmount * 10) / 1000}K`, amount: bbAmount * 10 },
    { label: `${(bbAmount * 15) / 1000}K`, amount: bbAmount * 15 },
    { label: `${(bbAmount * 20) / 1000}K`, amount: bbAmount * 20 },
  ];

  const handleActionClick = (action: ActionType) => {
    triggerHaptic();
    setSelectedAction(action);
    if (action === 'fold' || action === 'check') {
      onHeroAction(action);
    } else if (action === 'call') {
      onHeroAction('call', betAmount);
    }
  };

  const handleConfirmBet = () => {
    triggerHaptic();
    onHeroAction(selectedAction === 'raise' ? 'raise' : 'bet', betAmount);
  };

  return (
    <div className="flex flex-col gap-3 bg-[#0A121D]/95 border border-[#1C2C3F] rounded-2xl p-3.5 shadow-2xl">
      {/* Hero Postflop Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-poker-emerald font-black text-xs shadow-neon-emerald">
          H
        </div>
        <span className="text-sm font-bold text-white tracking-wide">
          Acción de Hero en el Flop ({heroPosition})
        </span>
      </div>

      {/* 4 Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* CHECK */}
        <button
          type="button"
          onClick={() => handleActionClick('check')}
          className={clsx(
            'h-12 rounded-xl font-bold text-sm transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'check'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-neon-emerald'
              : 'bg-[#064E3B] text-emerald-100 border border-emerald-600/50 hover:bg-emerald-700'
          )}
        >
          Check
        </button>

        {/* BET */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedAction('bet');
          }}
          className={clsx(
            'h-12 rounded-xl font-bold text-sm transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'bet'
              ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-lg'
              : 'bg-[#991B1B] text-red-100 border border-red-600/50 hover:bg-red-700'
          )}
        >
          Bet
        </button>

        {/* CALL */}
        <button
          type="button"
          onClick={() => handleActionClick('call')}
          className={clsx(
            'h-12 rounded-xl font-bold text-sm transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'call'
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-[#1E3A8A] text-blue-100 border border-blue-600/50 hover:bg-blue-700'
          )}
        >
          Call
        </button>

        {/* FOLD */}
        <button
          type="button"
          onClick={() => handleActionClick('fold')}
          className={clsx(
            'h-12 rounded-xl font-bold text-sm transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'fold'
              ? 'bg-slate-700 text-white ring-2 ring-slate-400'
              : 'bg-[#1E293B] text-slate-200 border border-slate-700/60 hover:bg-slate-700'
          )}
        >
          Fold
        </button>
      </div>

      {/* Bet Sizing (Visible when Bet or Raise is active) */}
      {(selectedAction === 'bet' || selectedAction === 'raise') && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Monto de apuesta</span>
            <span className="text-white font-bold text-sm text-poker-emerald">
              $ {betAmount.toLocaleString('es-AR')}
            </span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-6 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setBetAmount(p.amount);
                }}
                className={clsx(
                  'h-8 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center',
                  betAmount === p.amount
                    ? 'bg-red-600 text-white shadow-md border border-red-400'
                    : 'bg-[#15202E] text-slate-300 border border-[#223348] hover:border-slate-500'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Stepper fino y botón de confirmación */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 flex items-center justify-between bg-[#131E2C] border border-[#233347] rounded-xl h-11 px-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  if (betAmount - bbAmount >= bbAmount) {
                    setBetAmount(betAmount - bbAmount);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-[#1B293A] text-slate-300 flex items-center justify-center active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-white">
                ${betAmount.toLocaleString('es-AR')}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setBetAmount(betAmount + bbAmount);
                }}
                className="w-7 h-7 rounded-lg bg-[#1B293A] text-slate-300 flex items-center justify-center active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmBet}
              className="h-11 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
