import React from 'react';
import { ActionType, TablePosition } from '../../types/poker';
import { cn } from '../../utils/cn';
import { Minus, Plus, FastForward } from 'lucide-react';

interface ActionConsoleProps {
  currentPosition: TablePosition;
  isHero: boolean;
  currentHighestBet: number;
  raiseAmount: number;
  raiseCount?: number;
  onActionSelect: (action: ActionType, amount?: number) => void;
  onRaiseAmountChange: (amount: number) => void;
  onOpenCustomRaiseModal?: () => void;
  onFastForwardToHero?: () => void;
  canFastForwardToHero?: boolean;
  bbAmount: number;
}

export const ActionConsole: React.FC<ActionConsoleProps> = ({
  currentPosition,
  isHero,
  currentHighestBet,
  raiseAmount,
  raiseCount = 0,
  onActionSelect,
  onRaiseAmountChange,
  onOpenCustomRaiseModal,
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

  const formatPresetLabel = (amount: number) => {
    if (amount >= 1000) {
      const kVal = amount / 1000;
      return `${Number.isInteger(kVal) ? kVal : kVal.toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  // Presets adaptados al tamaño de la ciega grande
  const minLegalRaise = isPotRaised ? currentHighestBet * 2 : bbAmount * 2;
  const presets = [
    { label: formatPresetLabel(bbAmount * 2), amount: bbAmount * 2 },
    { label: formatPresetLabel(bbAmount * 3), amount: bbAmount * 3 },
    { label: formatPresetLabel(bbAmount * 4), amount: bbAmount * 4 },
    { label: formatPresetLabel(bbAmount * 5), amount: bbAmount * 5 },
    { label: formatPresetLabel(bbAmount * 8), amount: bbAmount * 8 },
    { label: formatPresetLabel(bbAmount * 10), amount: bbAmount * 10 },
  ];

  // Etiqueta semántica de subida (Raise / 3-Bet / 4-Bet)
  const getRaiseButtonLabel = () => {
    if (!isPotRaised || raiseCount === 0) return 'Raise';
    if (raiseCount === 1) return '3-Bet';
    return '4-Bet';
  };

  const getRaiseActionType = (): ActionType => {
    if (!isPotRaised || raiseCount === 0) return 'raise';
    if (raiseCount === 1) return '3bet';
    return '4bet';
  };

  const handleAction = (action: ActionType) => {
    triggerHaptic();
    if (action === 'raise') {
      onActionSelect(getRaiseActionType(), Math.max(minLegalRaise, raiseAmount));
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

  const stepSize = bbAmount >= 1000 ? 500 : Math.max(50, Math.round(bbAmount / 2));

  const handleDec = () => {
    triggerHaptic();
    const next = Math.max(minLegalRaise, raiseAmount - stepSize);
    onRaiseAmountChange(next);
  };

  const handleInc = () => {
    triggerHaptic();
    const next = raiseAmount + stepSize;
    onRaiseAmountChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full bg-[#09111C]/95 border-t border-[#1C2C3F] pt-2 pb-1 select-none">
      {/* Barra de Turno y Atajo Folds hasta Hero */}
      <div className="flex items-center justify-between gap-2">
        {isHero ? (
          <div className="min-w-0 px-2.5 xs:px-3 py-1 rounded-full border-2 border-poker-emerald bg-[#092B1D] text-poker-emerald font-black text-xs tracking-wider flex items-center gap-1.5 xs:gap-2 shadow-neon-emerald">
            <span className="w-2 h-2 rounded-full bg-poker-emerald animate-pulse flex-shrink-0" />
            <span className="truncate">
              HERO ({currentPosition})<span className="hidden xs:inline"> — TU TURNO</span>
            </span>
          </div>
        ) : (
          <div className="min-w-0 px-2.5 xs:px-3 py-1 rounded-full border border-slate-600 bg-[#142030] text-slate-200 font-bold text-xs tracking-wide flex items-center gap-1.5 xs:gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="truncate">RIVAL ({currentPosition})</span>
          </div>
        )}

        {canFastForwardToHero && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onFastForwardToHero?.();
            }}
            className="min-h-[36px] px-2.5 xs:px-3 py-1 rounded-xl bg-emerald-950/90 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm flex-shrink-0 whitespace-nowrap"
          >
            <FastForward className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Folds hasta Hero</span>
          </button>
        )}
      </div>

      {/* 4 Botones Táctiles Grandes de Acción (h-13 en <360px, h-14 desde 360px) */}
      <div className="grid grid-cols-4 gap-2">
        {/* FOLD */}
        <button
          type="button"
          onClick={() => handleAction('fold')}
          className="h-13 xs:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center bg-[#1E2632] hover:bg-[#273240] text-slate-200 border border-slate-700/60 shadow-md"
        >
          Fold
        </button>

        {/* LIMP / CHECK (Deshabilitado si ya hubo subida previa en el pozo) */}
        <button
          type="button"
          disabled={isPotRaised}
          onClick={() => handleAction(isBigBlind ? 'check' : 'limp')}
          className={cn(
            'h-13 xs:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center text-white shadow-md',
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
          className="h-13 xs:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center justify-center text-white bg-[#1D72FE] hover:bg-[#155FD6] shadow-md leading-tight"
        >
          <span>Call</span>
          <span className="text-[11px] font-semibold text-blue-100">
            ${currentHighestBet.toLocaleString('es-AR')}
          </span>
        </button>

        {/* RAISE / 3-BET / 4-BET */}
        <button
          type="button"
          onClick={() => handleAction('raise')}
          className="h-13 xs:h-14 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex flex-col items-center justify-center text-white bg-[#EF4444] hover:bg-[#DC2626] shadow-md leading-tight"
        >
          <span>{getRaiseButtonLabel()}</span>
          <span className="text-[11px] font-semibold text-red-100">
            ${raiseAmount.toLocaleString('es-AR')}
          </span>
        </button>
      </div>

      {/* Fila de 6 Presets Rápidos (h-10 = 40px) */}
      <div className="grid grid-cols-6 gap-1.5">
        {presets.map((p) => {
          const isActive = raiseAmount === p.amount;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePresetSelect(p.amount)}
              className={cn(
                'h-10 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center select-none',
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

      {/* Fila Compacta "Personalizado" (h-11 = 44px) con toque directo para teclado numérico */}
      <div className="flex items-center justify-between bg-[#0F1824] border border-[#1E2E42] rounded-xl h-11 px-3">
        <span className="text-xs sm:text-sm font-semibold text-slate-300">
          Monto subida
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDec}
            className="w-9 h-9 rounded-lg bg-[#172536] hover:bg-[#203146] active:scale-90 text-slate-200 flex items-center justify-center font-bold"
            aria-label="Disminuir monto de subida"
          >
            <Minus className="w-4 h-4" />
          </button>

          {onOpenCustomRaiseModal ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenCustomRaiseModal();
              }}
              className="h-9 px-2.5 rounded-lg bg-[#131E2C] hover:bg-slate-800 border border-[#233347] text-sm sm:text-base font-extrabold text-white min-w-[80px] text-center active:scale-95 transition-all"
              title="Tocar para escribir monto exacto"
            >
              ${raiseAmount.toLocaleString('es-AR')}
            </button>
          ) : (
            <span className="text-sm sm:text-base font-extrabold text-white min-w-[74px] text-center select-text">
              ${raiseAmount.toLocaleString('es-AR')}
            </span>
          )}

          <button
            type="button"
            onClick={handleInc}
            className="w-9 h-9 rounded-lg bg-[#172536] hover:bg-[#203146] active:scale-90 text-slate-200 flex items-center justify-center font-bold"
            aria-label="Aumentar monto de subida"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
