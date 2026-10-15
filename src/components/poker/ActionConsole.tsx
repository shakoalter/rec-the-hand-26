import React, { useState } from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { Minus, Plus, CheckCircle2 } from 'lucide-react';

interface ActionConsoleProps {
  heroPosition: TablePosition;
  playerCount: number;
  bbAmount: number;
  onHeroAction: (actionType: ActionType, amount?: number) => void;
  onPriorContextSelect?: (contextName: string) => void;
}

export const ActionConsole: React.FC<ActionConsoleProps> = ({
  heroPosition,
  bbAmount,
  onHeroAction
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [raiseAmount, setRaiseAmount] = useState<number>(bbAmount * 3);
  const [priorContext, setPriorContext] = useState<string>('unopened');

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  // Presets adaptados al valor de la Big Blind (ej: 2k, 3k, 4k, 5k, 8k, 10k para BB=1000)
  const presets = [
    { label: `${(bbAmount * 2) / 1000}K`, amount: bbAmount * 2 },
    { label: `${(bbAmount * 3) / 1000}K`, amount: bbAmount * 3 },
    { label: `${(bbAmount * 4) / 1000}K`, amount: bbAmount * 4 },
    { label: `${(bbAmount * 5) / 1000}K`, amount: bbAmount * 5 },
    { label: `${(bbAmount * 8) / 1000}K`, amount: bbAmount * 8 },
    { label: `${(bbAmount * 10) / 1000}K`, amount: bbAmount * 10 },
  ];

  const handleActionClick = (action: ActionType) => {
    triggerHaptic();
    setSelectedAction(action);
    if (action === 'fold') {
      onHeroAction('fold');
    } else if (action === 'call') {
      onHeroAction('call', bbAmount);
    } else if (action === 'limp' || action === 'check') {
      onHeroAction(heroPosition === 'BB' && priorContext === 'unopened' ? 'check' : 'limp', bbAmount);
    }
  };

  const handleConfirmRaise = () => {
    triggerHaptic();
    onHeroAction('raise', raiseAmount);
  };

  return (
    <div className="flex flex-col gap-3.5 bg-[#0A121D]/95 border border-[#1C2C3F] rounded-2xl p-4 shadow-2xl">
      {/* Contexto previo rápido (Toque único para definir qué pasó antes de Hero) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Acción previa a Hero
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'unopened', label: 'Sin subidas' },
            { id: '1limp', label: '1 Limper' },
            { id: '2limps', label: '2+ Limpers' },
            { id: 'open_raise', label: 'Open Raise' },
          ].map((ctx) => (
            <button
              key={ctx.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setPriorContext(ctx.id);
              }}
              className={clsx(
                'py-1.5 px-2 rounded-lg text-xs font-semibold transition-all select-none active:scale-95 text-center',
                priorContext === ctx.id
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm'
                  : 'bg-[#121E2C] text-slate-400 border border-[#1E2E42] hover:text-white'
              )}
            >
              {ctx.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Action Header */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-poker-emerald font-black text-xs shadow-neon-emerald">
          H
        </div>
        <span className="text-sm font-bold text-white tracking-wide">
          Decisión de Hero ({heroPosition})
        </span>
      </div>

      {/* 4 Cardinal Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* FOLD */}
        <button
          type="button"
          onClick={() => handleActionClick('fold')}
          className={clsx(
            'h-13 rounded-xl font-bold text-base transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'fold'
              ? 'bg-slate-700 text-white ring-2 ring-slate-400'
              : 'bg-[#1E293B] text-slate-200 border border-slate-700/60 hover:bg-slate-700'
          )}
        >
          Fold
        </button>

        {/* LIMP / CHECK */}
        <button
          type="button"
          onClick={() => handleActionClick(heroPosition === 'BB' && priorContext === 'unopened' ? 'check' : 'limp')}
          className={clsx(
            'h-13 rounded-xl font-bold text-base transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'limp' || selectedAction === 'check'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-neon-emerald'
              : 'bg-[#064E3B] text-emerald-100 border border-emerald-600/50 hover:bg-emerald-700'
          )}
        >
          {heroPosition === 'BB' && priorContext === 'unopened' ? 'Check' : 'Limp'}
        </button>

        {/* CALL */}
        <button
          type="button"
          onClick={() => handleActionClick('call')}
          className={clsx(
            'h-13 rounded-xl font-bold text-base transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'call'
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-[#1E3A8A] text-blue-100 border border-blue-600/50 hover:bg-blue-700'
          )}
        >
          Call
        </button>

        {/* RAISE */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedAction('raise');
          }}
          className={clsx(
            'h-13 rounded-xl font-bold text-base transition-all select-none active:scale-95 flex items-center justify-center shadow-md',
            selectedAction === 'raise'
              ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-lg'
              : 'bg-[#991B1B] text-red-100 border border-red-600/50 hover:bg-red-700'
          )}
        >
          Raise
        </button>
      </div>

      {/* Sizing Panel (Visible when Raise is active) */}
      {selectedAction === 'raise' && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Tamaño de subida</span>
            <span className="text-white font-bold text-sm text-poker-emerald">
              $ {raiseAmount.toLocaleString('es-AR')}
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
                  setRaiseAmount(p.amount);
                }}
                className={clsx(
                  'h-9 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center',
                  raiseAmount === p.amount
                    ? 'bg-red-600 text-white shadow-md border border-red-400'
                    : 'bg-[#15202E] text-slate-300 border border-[#223348] hover:border-slate-500'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Stepper fino y botón de confirmación de Raise */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 flex items-center justify-between bg-[#131E2C] border border-[#233347] rounded-xl h-11 px-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  if (raiseAmount - bbAmount >= bbAmount * 2) {
                    setRaiseAmount(raiseAmount - bbAmount);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-[#1B293A] text-slate-300 flex items-center justify-center active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-white">
                ${raiseAmount.toLocaleString('es-AR')}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setRaiseAmount(raiseAmount + bbAmount);
                }}
                className="w-7 h-7 rounded-lg bg-[#1B293A] text-slate-300 flex items-center justify-center active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmRaise}
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
