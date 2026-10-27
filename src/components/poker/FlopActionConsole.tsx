import React, { useState } from 'react';
import { TablePosition, ActionType, PlayerAction } from '../../types/poker';
import { cn } from '../../utils/cn';
import { Minus, Plus, CheckCircle2, RotateCcw } from 'lucide-react';

interface FlopActionConsoleProps {
  heroPosition: TablePosition;
  bbAmount: number;
  flopActions?: PlayerAction[];
  onHeroAction: (actionType: ActionType, amount?: number) => void;
  onClearFlopActions?: () => void;
}

export const FlopActionConsole: React.FC<FlopActionConsoleProps> = ({
  heroPosition,
  bbAmount,
  flopActions = [],
  onHeroAction,
  onClearFlopActions
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [betAmount, setBetAmount] = useState<number>(bbAmount * 5);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const formatPresetLabel = (amount: number) => {
    if (amount >= 1000) {
      const kVal = amount / 1000;
      return `${Number.isInteger(kVal) ? kVal : kVal.toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const presets = [
    { label: formatPresetLabel(bbAmount * 3), amount: bbAmount * 3 },
    { label: formatPresetLabel(bbAmount * 5), amount: bbAmount * 5 },
    { label: formatPresetLabel(bbAmount * 7), amount: bbAmount * 7 },
    { label: formatPresetLabel(bbAmount * 10), amount: bbAmount * 10 },
    { label: formatPresetLabel(bbAmount * 15), amount: bbAmount * 15 },
    { label: formatPresetLabel(bbAmount * 20), amount: bbAmount * 20 },
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
    setSelectedAction(null);
  };

  return (
    <div className="flex flex-col gap-2.5 bg-[#0A121D]/95 border border-[#1C2C3F] rounded-2xl p-3 xs:p-3.5 shadow-2xl select-none">
      {/* Hero Postflop Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-poker-emerald font-black text-xs shadow-neon-emerald flex-shrink-0">
            H
          </div>
          <span className="text-xs xs:text-sm font-bold text-white tracking-wide min-w-0 truncate">
            <span className="xs:hidden">Acción Flop ({heroPosition})</span>
            <span className="hidden xs:inline">Acción de Hero en el Flop ({heroPosition})</span>
          </span>
        </div>

        {flopActions.length > 0 && onClearFlopActions && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClearFlopActions();
              setSelectedAction(null);
            }}
            className="h-7 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Feedback Visual de Acciones Registradas en el Flop */}
      {flopActions.length > 0 && (
        <div className="bg-[#0D1826] border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400">Registrado:</span>
          {flopActions.map((act, i) => (
            <span
              key={act.id}
              className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold"
            >
              {i + 1}. {act.actionType.toUpperCase()}
              {act.amount ? ` $${act.amount.toLocaleString('es-AR')}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* 4 Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* CHECK */}
        <button
          type="button"
          onClick={() => handleActionClick('check')}
          className={cn(
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
          className={cn(
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
          className={cn(
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
          className={cn(
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
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Monto de apuesta en Flop</span>
            <span className="font-bold text-sm text-poker-emerald">
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
                className={cn(
                  'h-9 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center',
                  betAmount === p.amount
                    ? 'bg-red-600 text-white shadow-md border border-red-400'
                    : 'bg-[#15202E] text-slate-300 border border-[#223348] hover:border-slate-500'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Stepper fino con botones táctiles cómodos y botón de confirmación */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex-1 flex items-center justify-between bg-[#131E2C] border border-[#233347] rounded-xl h-11 px-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  if (betAmount - bbAmount >= bbAmount) {
                    setBetAmount(betAmount - bbAmount);
                  }
                }}
                className="w-9 h-9 rounded-lg bg-[#1B293A] hover:bg-[#25364D] text-slate-200 flex items-center justify-center active:scale-90"
                aria-label="Restar 1 BB a la apuesta"
              >
                <Minus className="w-4 h-4" />
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
                className="w-9 h-9 rounded-lg bg-[#1B293A] hover:bg-[#25364D] text-slate-200 flex items-center justify-center active:scale-90"
                aria-label="Sumar 1 BB a la apuesta"
              >
                <Plus className="w-4 h-4" />
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
