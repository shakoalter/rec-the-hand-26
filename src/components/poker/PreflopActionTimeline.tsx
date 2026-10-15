import React from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { CornerUpLeft, Plus, HelpCircle, ArrowRight, Check } from 'lucide-react';

export interface SeatActionState {
  position: TablePosition;
  isHero: boolean;
  actionType: ActionType;
  amount?: number;
  hasActed: boolean;
}

interface PreflopActionTimelineProps {
  positions: TablePosition[];
  heroPosition: TablePosition;
  currentTurnPosition: TablePosition;
  seatActions: Record<TablePosition, SeatActionState>;
  onSelectTurn: (position: TablePosition) => void;
}

export const PreflopActionTimeline: React.FC<PreflopActionTimelineProps> = ({
  positions,
  heroPosition,
  currentTurnPosition,
  seatActions,
  onSelectTurn
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full py-1">
      {positions.map((pos) => {
        const isHero = pos === heroPosition;
        const isCurrentTurn = pos === currentTurnPosition;
        const state = seatActions[pos] || {
          position: pos,
          isHero,
          actionType: 'fold',
          hasActed: false
        };

        const { actionType, amount, hasActed } = state;

        let pillStyle = '';
        let icon = null;
        let label = '';

        if (!hasActed) {
          pillStyle = 'bg-[#101924] border border-dashed border-slate-700/50 text-slate-500';
          label = isCurrentTurn ? 'Esperando decisión...' : 'En espera';
        } else {
          switch (actionType) {
            case 'limp':
              pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
              icon = <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />;
              label = 'Limp';
              break;
            case 'check':
              pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
              icon = <Check className="w-3.5 h-3.5 text-emerald-300" />;
              label = 'Check';
              break;
            case 'raise':
            case '3bet':
            case '4bet':
              pillStyle = 'bg-[#8F2323] border border-red-500/80 text-white shadow-sm';
              icon = <CornerUpLeft className="w-3.5 h-3.5 text-red-200" />;
              label = `Raise ${amount ? `$${amount.toLocaleString('es-AR')}` : ''}`;
              break;
            case 'call':
              pillStyle = 'bg-[#194E9A] border border-blue-500/80 text-white shadow-sm';
              icon = <Plus className="w-3.5 h-3.5 text-blue-200" />;
              label = amount ? `Call $${amount.toLocaleString('es-AR')}` : 'Call';
              break;
            case 'fold':
            default:
              pillStyle = 'bg-[#182230] border border-slate-700/60 text-slate-400';
              icon = <ArrowRight className="w-3.5 h-3.5 text-slate-500" />;
              label = 'Fold';
              break;
          }
        }

        return (
          <div
            key={pos}
            onClick={() => {
              triggerHaptic();
              onSelectTurn(pos);
            }}
            className={clsx(
              'flex items-center gap-2 w-full p-1 rounded-2xl cursor-pointer transition-all select-none',
              isCurrentTurn
                ? 'bg-blue-950/40 ring-2 ring-blue-500/80 shadow-lg'
                : 'hover:bg-slate-800/20'
            )}
          >
            {/* Posición (Asiento izquierdo con distinción clara de Hero vs Rival) */}
            <div
              className={clsx(
                'w-15 h-11 rounded-2xl flex flex-col items-center justify-center transition-all flex-shrink-0 leading-none',
                isHero
                  ? 'bg-[#0E2A1E] border-2 border-poker-emerald text-poker-emerald shadow-neon-emerald'
                  : isCurrentTurn
                    ? 'bg-blue-900 border border-blue-400 text-white'
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
                'flex-1 h-11 px-3.5 rounded-xl flex items-center justify-between transition-all',
                pillStyle
              )}
            >
              <div className="flex items-center gap-2">
                {icon && (
                  <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center">
                    {icon}
                  </span>
                )}
                <span className="text-sm font-semibold tracking-wide">{label}</span>
              </div>

              {/* Indicador de turno o estado */}
              {isCurrentTurn ? (
                <span className={clsx('text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full', isHero ? 'bg-poker-emerald text-white animate-pulse' : 'bg-blue-500 text-white')}>
                  {isHero ? 'Tu Turno' : 'Turno'}
                </span>
              ) : hasActed ? (
                <Check className="w-4 h-4 text-slate-400/70" />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
