import React from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { CornerUpLeft, Plus, HelpCircle, ArrowRight, Check } from 'lucide-react';
import { BettingPlayerState } from '../../core/bettingEngine';

interface PreflopActionTimelineProps {
  positions: TablePosition[];
  heroPosition: TablePosition;
  currentTurnPosition: TablePosition | null;
  seatStates: Record<TablePosition, BettingPlayerState>;
  onSelectTurn: (position: TablePosition) => void;
}

export const PreflopActionTimeline: React.FC<PreflopActionTimelineProps> = ({
  positions,
  heroPosition,
  currentTurnPosition,
  seatStates,
  onSelectTurn
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const formatActionLabel = (actions: { actionType: ActionType; amount?: number }[]) => {
    if (actions.length === 0) return '';
    return actions
      .map((a) => {
        if (a.actionType === 'raise' || a.actionType === '3bet' || a.actionType === '4bet') {
          return `Raise ${a.amount ? `$${a.amount.toLocaleString('es-AR')}` : ''}`;
        }
        if (a.actionType === 'call') {
          return `Call ${a.amount ? `$${a.amount.toLocaleString('es-AR')}` : ''}`;
        }
        if (a.actionType === 'limp') return 'Limp';
        if (a.actionType === 'check') return 'Check';
        return 'Fold';
      })
      .join(' > ');
  };

  return (
    <div className="flex flex-col gap-2 w-full py-1">
      {positions.map((pos) => {
        const isHero = pos === heroPosition;
        const isCurrentTurn = pos === currentTurnPosition;
        const player = seatStates[pos];

        const hasActed = player?.hasActedInRound || (player?.actions && player.actions.length > 0);
        const isFolded = player?.status === 'folded';
        const lastAction = player?.actions[player.actions.length - 1];

        let pillStyle = '';
        let icon = null;

        if (!hasActed) {
          pillStyle = 'bg-[#101924] border border-dashed border-slate-700/50 text-slate-500';
        } else if (isFolded) {
          pillStyle = 'bg-[#182230] border border-slate-700/60 text-slate-500 opacity-60';
          icon = <ArrowRight className="w-3.5 h-3.5 text-slate-500" />;
        } else if (lastAction?.actionType === 'raise' || lastAction?.actionType === '3bet' || lastAction?.actionType === '4bet') {
          pillStyle = 'bg-[#8F2323] border border-red-500/80 text-white shadow-sm';
          icon = <CornerUpLeft className="w-3.5 h-3.5 text-red-200" />;
        } else if (lastAction?.actionType === 'call') {
          pillStyle = 'bg-[#194E9A] border border-blue-500/80 text-white shadow-sm';
          icon = <Plus className="w-3.5 h-3.5 text-blue-200" />;
        } else if (lastAction?.actionType === 'check') {
          pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
          icon = <Check className="w-3.5 h-3.5 text-emerald-300" />;
        } else {
          pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
          icon = <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />;
        }

        const label = hasActed ? formatActionLabel(player.actions) : isCurrentTurn ? 'Esperando decisión...' : 'En espera';

        return (
          <div
            key={pos}
            onClick={() => {
              if (!isFolded) {
                triggerHaptic();
                onSelectTurn(pos);
              }
            }}
            className={clsx(
              'flex items-center gap-2 w-full p-1 rounded-2xl transition-all select-none',
              isCurrentTurn
                ? 'bg-blue-950/40 ring-2 ring-blue-500/80 shadow-lg'
                : !isFolded && 'hover:bg-slate-800/20 cursor-pointer'
            )}
          >
            {/* Posición Asiento */}
            <div
              className={clsx(
                'w-15 h-11 rounded-2xl flex flex-col items-center justify-center transition-all flex-shrink-0 leading-none',
                isHero
                  ? 'bg-[#0E2A1E] border-2 border-poker-emerald text-poker-emerald shadow-neon-emerald'
                  : isCurrentTurn
                    ? 'bg-blue-900 border border-blue-400 text-white'
                    : isFolded
                      ? 'bg-[#101722] border border-slate-800 text-slate-600'
                      : 'bg-[#162232] border border-[#23354B] text-slate-300'
              )}
            >
              {isHero ? (
                <>
                  <span className="text-[10px] font-black text-poker-emerald">HERO</span>
                  <span className="text-[9px] font-bold text-emerald-300/80 mt-0.5">{pos}</span>
                </>
              ) : (
                <span className="text-xs font-bold">{pos}</span>
              )}
            </div>

            {/* Píldora de Acción */}
            <div
              className={clsx(
                'flex-1 h-11 px-3.5 rounded-xl flex items-center justify-between transition-all overflow-hidden',
                pillStyle
              )}
            >
              <div className="flex items-center gap-2 truncate">
                {icon && (
                  <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </span>
                )}
                <span className="text-sm font-semibold tracking-wide truncate">{label}</span>
              </div>

              {isCurrentTurn ? (
                <span className={clsx('text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ml-1', isHero ? 'bg-poker-emerald text-white animate-pulse' : 'bg-blue-500 text-white')}>
                  {isHero ? 'Tu Turno' : 'Turno'}
                </span>
              ) : hasActed && !isFolded ? (
                <Check className="w-4 h-4 text-slate-400/70 flex-shrink-0 ml-1" />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
