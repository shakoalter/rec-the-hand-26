import React from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { clsx } from 'clsx';
import { MoreHorizontal, CornerUpLeft, Plus, HelpCircle, ArrowRight } from 'lucide-react';

export interface SeatActionState {
  position: TablePosition;
  isHero: boolean;
  actionType: ActionType;
  amount?: number;
}

interface PreflopActionTimelineProps {
  positions: TablePosition[];
  heroPosition: TablePosition;
  seatActions: Record<TablePosition, SeatActionState>;
  onToggleSeatAction: (position: TablePosition) => void;
  onOpenSeatDetail?: (position: TablePosition) => void;
}

export const PreflopActionTimeline: React.FC<PreflopActionTimelineProps> = ({
  positions,
  heroPosition,
  seatActions,
  onToggleSeatAction,
  onOpenSeatDetail
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
        const current = seatActions[pos] || {
          position: pos,
          isHero,
          actionType: 'fold'
        };

        const { actionType, amount } = current;

        // Renderizado según tipo de acción coincidiendo con la Imagen 2
        let pillStyle = '';
        let icon = null;
        let label = '';

        switch (actionType) {
          case 'limp':
            pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
            icon = <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />;
            label = 'Limp';
            break;
          case 'raise':
          case '3bet':
            pillStyle = 'bg-[#8F2323] border border-red-500/80 text-white shadow-sm';
            icon = <CornerUpLeft className="w-3.5 h-3.5 text-red-200" />;
            label = `Raise ${amount ? amount.toLocaleString('es-AR') : ''}`;
            break;
          case 'call':
            pillStyle = 'bg-[#194E9A] border border-blue-500/80 text-white shadow-sm';
            icon = <Plus className="w-3.5 h-3.5 text-blue-200" />;
            label = 'Call';
            break;
          case 'fold':
          default:
            pillStyle = 'bg-[#1B2533] border border-slate-700/60 text-slate-400';
            icon = <ArrowRight className="w-3.5 h-3.5 text-slate-500" />;
            label = 'Fold';
            break;
        }

        return (
          <div key={pos} className="flex items-center gap-2 w-full">
            {/* Posición (Círculo/Píldora izquierda) */}
            <div
              className={clsx(
                'w-13 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 select-none',
                isHero
                  ? 'bg-[#0E2A1E] border-2 border-poker-emerald text-poker-emerald shadow-neon-emerald'
                  : 'bg-[#162232] border border-[#23354B] text-slate-300'
              )}
            >
              {pos}
            </div>

            {/* Píldora de Acción Interactiva (Tocar cicla: Fold -> Limp -> Call -> Raise) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleSeatAction(pos);
              }}
              className={clsx(
                'flex-1 h-10 px-3.5 rounded-xl flex items-center justify-between transition-all select-none active:scale-[0.99]',
                pillStyle
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center">
                  {icon}
                </span>
                <span className="text-sm font-semibold tracking-wide">{label}</span>
              </div>

              {/* Botón de detalle '...' a la derecha como en el mockup */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic();
                  onOpenSeatDetail?.(pos);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                aria-label={`Detalle de ${pos}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </button>
          </div>
        );
      })}
    </div>
  );
};
