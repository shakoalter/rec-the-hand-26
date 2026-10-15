import React from 'react';
import { ActionType, TablePosition } from '../../types/poker';
import { clsx } from 'clsx';
import { Minus, Plus, FastForward } from 'lucide-react';

interface ActionConsoleProps {
  currentPosition: TablePosition;
  isHero: boolean;
  currentHighestBet: number;
  raiseAmount: number;
  onActionSelect: (action: ActionType, amount?: number) => void;
  onRaiseAmountChange: (amount: number) => void;
  onFastForwardToHero?: () => void;
  canFastForwardToHero?: boolean;
  bbAmount: number;
}

export const ActionConsole: React.FC<ActionConsoleProps> = ({
  currentPosition,
  isHero,
  currentHighestBet,
  raiseAmount,
  onActionSelect,
  onRaiseAmountChange,
  onFastForwardToHero,
  canFastForwardToHero = false,
  bbAmount
}) => {
  const isPotRaised = currentHighestBet > bbAmount;
  const isBigBlind = currentPosition === 'BB';

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  // Presets adaptados al tamaño de la ciega grande o al tamaño del raise actual
  const minLegalRaise = isPotRaised ? currentHighestBet * 2 : bbAmount * 2;
  const presets = [
    { label: `${(bbAmount * 2) / 1000}K`, amount: bbAmount * 2 },
    { label: `${(bbAmount * 3) / 1000}K`, amount: bbAmount * 3 },
    { label: `${(bbAmount * 4) / 1000}K`, amount: bbAmount * 4 },
    { label: `${(bbAmount * 5) / 1000}K`, amount: bbAmount * 5 },
    { label: `${(bbAmount * 8) / 1000}K`, amount: bbAmount * 8 },
    { label: `${(bbAmount * 10) / 1000}K`, amount: bbAmount * 10 },
  ];

  const handleAction = (action: ActionType) => {
    triggerHaptic();
    if (action === 'raise') {
      onActionSelect('raise', Math.max(minLegalRaise, raiseAmount));
    } else if (action === 'call') {
      onActionSelect('call', currentHighestBet);
    } else if (action === 'limp' || action === 'check') {
      onActionSelect(isBigBlind && !isPotRaised ? 'check' : 'limp', bbAmount);
    } else {
      onActionSelect('fold');
    }
  };

  const handlePresetSelect = (amount: number) => {
    triggerHaptic();
    onRaiseAmountChange(Math.max(minLegalRaise, amount));
  };

  const handleDec = () => {
    triggerHaptic();
    const next = Math.max(minLegalRaise, raiseAmount - 500);
    onRaiseAmountChange(next);
  };

  const handleInc = () => {
    triggerHaptic();
    const next = raiseAmount + 500;
    onRaiseAmountChange(next);
  };

  return (
    <div className="flex flex-col gap-2 w-full bg-[#09111C]/95 border-t border-[#1C2C3F] pt-2 pb-1 select-none">
      {/* Barra de Turno y Atajo */}
      <div className="flex items-center justify-between">
        {isHero ? (
          <div className="px-3.5 py-1.5 rounded-full border-2 border-poker-emerald bg-[#092B1D] text-poker-emerald font-black text-xs tracking-wider flex items-center gap-2 shadow-neon-emerald">
            <span className="w-2.5 h-2.5 rounded-full bg-poker-emerald animate-pulse" />
            HERO ({currentPosition}) — TU TURNO
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full border border-slate-600 bg-[#142030] text-slate-200 font-bold text-xs tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            RIVAL ({currentPosition})
          </div>
        )}

        {canFastForwardToHero && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onFastForwardToHero?.();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Folds hasta Hero</span>
          </button>
        )}
      </div>

      {/* 4 Botones Táctiles Grandes de Acción */}
      <div className="grid grid-cols-4 gap-2">
        {/* FOLD */}
        <button
          type="button"
          onClick={() => handleAction('fold')}
          className="h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center bg-[#1E2632] hover:bg-[#273240] text-slate-200 border border-slate-700/60 shadow-md"
        >
          Fold
        </button>

        {/* LIMP / CHECK (Deshabilitado si ya hubo subida previa en el pozo) */}
        <button
          type="button"
          disabled={isPotRaised}
          onClick={() => handleAction(isBigBlind ? 'check' : 'limp')}
          className={clsx(
            'h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center text-white shadow-md',
            isPotRaised
              ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40'
              : 'bg-[#10B981] hover:bg-[#059669]'
          )}
        >
          {isPotRaised ? 'No Limp' : isBigBlind ? 'Check' : 'Limp'}
        </button>

        {/* CALL */}
        <button
          type="button"
          onClick={() => handleAction('call')}
          className="h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center justify-center text-white bg-[#1D72FE] hover:bg-[#155FD6] shadow-md leading-tight"
        >
          <span>Call</span>
          {isPotRaised && (
            <span className="text-[11px] font-semibold text-blue-200">
              ${currentHighestBet.toLocaleString('es-AR')}
            </span>
          )}
        </button>

        {/* RAISE */}
        <button
          type="button"
          onClick={() => handleAction('raise')}
          className="h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center justify-center text-white bg-[#EF4444] hover:bg-[#DC2626] shadow-md leading-tight"
        >
          <span>{isPotRaised ? '3-Bet' : 'Raise'}</span>
          <span className="text-[11px] font-semibold text-red-200">
            ${raiseAmount.toLocaleString('es-AR')}
          </span>
        </button>
      </div>

      {/* Fila de Presets */}
      <div className="grid grid-cols-6 gap-1.5 pt-0.5">
        {presets.map((p) => {
          const isActive = raiseAmount === p.amount;
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

      {/* Fila "Personalizado" con Stepper */}
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
