import React from 'react';
import { TablePosition, ActionType } from '../../types/poker';
import { cn } from '../../utils/cn';
import { CornerUpLeft, Plus, HelpCircle, ArrowRight, Check, X } from 'lucide-react';
import { BettingPlayerState } from '../../core/bettingEngine';

interface PreflopActionTimelineProps {
  positions: TablePosition[];
  heroPosition: TablePosition;
  currentTurnPosition: TablePosition | null;
  seatStates: Record<TablePosition, BettingPlayerState>;
  highestBet?: number;
  onSelectTurn: (position: TablePosition) => void;
}

export const PreflopActionTimeline: React.FC<PreflopActionTimelineProps> = ({
  positions,
  heroPosition,
  currentTurnPosition,
  seatStates,
  highestBet = 0,
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
        if (a.actionType === 'allin') {
          return `All-in ${a.amount ? `$${a.amount.toLocaleString('es-AR')}` : ''}`;
        }
        if (a.actionType === 'call') {
          return `Call ${a.amount ? `$${a.amount.toLocaleString('es-AR')}` : ''}`;
        }
        if (a.actionType === 'limp') return 'Limp';
        if (a.actionType === 'check') return 'Check';
        return 'Fold';
      })
      .join(' › ');
  };

  // Clasificación para el Modelo 3 (Timeline Híbrido Compacto):
  // 1. Folds en frío: foldearon en su 1ra acción sin invertir dinero voluntariamente
  const coldFoldedPositions = positions.filter((pos) => {
    if (pos === currentTurnPosition) return false;
    const p = seatStates[pos];
    return (
      p &&
      p.status === 'folded' &&
      p.actions.length === 1 &&
      p.actions[0].actionType === 'fold'
    );
  });

  // 2. Jugadores con acción voluntaria en la calle (o que foldearon tras invertir) y no están en turno actual
  const activeOrVoluntaryActedPositions = positions.filter((pos) => {
    if (pos === currentTurnPosition) return false;
    const p = seatStates[pos];
    if (!p) return false;
    const hasActed = p.hasActedInRound || p.actions.length > 0;
    if (!hasActed) return false;
    const isColdFold =
      p.status === 'folded' && p.actions.length === 1 && p.actions[0].actionType === 'fold';
    return !isColdFold;
  });

  // 3. Jugadores pendientes que aún no han hablado en la calle y no son el turno actual
  const pendingPositions = positions.filter((pos) => {
    if (pos === currentTurnPosition) return false;
    const p = seatStates[pos];
    return p && p.status === 'active' && !p.hasActedInRound && p.actions.length === 0;
  });

  const currentTurnPlayer = currentTurnPosition ? seatStates[currentTurnPosition] : null;
  const isHeroCurrentTurn = currentTurnPosition === heroPosition;

  return (
    <div className="flex flex-col gap-2 w-full py-0.5 select-none">
      {/* ZONA 1A: Folds en frío comprimidos en tira horizontal de chips interactivos */}
      {coldFoldedPositions.length > 0 && (
        <div className="bg-[#0B131E] border border-[#1A293D] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
            Folds ({coldFoldedPositions.length}):
          </span>
          {coldFoldedPositions.map((pos) => {
            const isHero = pos === heroPosition;
            return (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectTurn(pos);
                }}
                title={`Corregir acción de ${pos}`}
                className={cn(
                  'min-h-[32px] px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 border',
                  isHero
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#131D2B] hover:bg-[#1A283B] border-slate-700/70 text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{isHero ? `HERO (${pos})` : pos}</span>
                <X className="w-3 h-3 text-slate-500" />
              </button>
            );
          })}
        </div>
      )}

      {/* ZONA 1B: Jugadores con acción voluntaria en el pozo (Limp, Call, Raise, Check o Fold posterior) */}
      {activeOrVoluntaryActedPositions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {activeOrVoluntaryActedPositions.map((pos) => {
            const isHero = pos === heroPosition;
            const player = seatStates[pos];
            const isFolded = player?.status === 'folded';
            const lastAction = player?.actions[player.actions.length - 1];
            const needsToRespond =
              !isFolded &&
              player?.status === 'active' &&
              highestBet > 0 &&
              player.totalContributed < highestBet;

            let pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white';
            let icon = <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />;

            if (isFolded) {
              pillStyle = 'bg-[#16202E] border border-slate-700/70 text-slate-400';
              icon = <ArrowRight className="w-3.5 h-3.5 text-slate-400" />;
            } else if (
              lastAction?.actionType === 'raise' ||
              lastAction?.actionType === '3bet' ||
              lastAction?.actionType === '4bet' ||
              lastAction?.actionType === 'allin'
            ) {
              pillStyle = 'bg-[#8F2323] border border-red-500/80 text-white shadow-sm';
              icon = <CornerUpLeft className="w-3.5 h-3.5 text-red-200" />;
            } else if (lastAction?.actionType === 'call') {
              pillStyle = 'bg-[#194E9A] border border-blue-500/80 text-white shadow-sm';
              icon = <Plus className="w-3.5 h-3.5 text-blue-200" />;
            } else if (lastAction?.actionType === 'check') {
              pillStyle = 'bg-[#15462D] border border-emerald-500/70 text-white shadow-sm';
              icon = <Check className="w-3.5 h-3.5 text-emerald-300" />;
            }

            return (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectTurn(pos);
                }}
                className="flex items-center gap-2 w-full rounded-xl transition-all active:scale-98 text-left"
              >
                <div
                  className={cn(
                    'w-14 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 leading-none',
                    isHero
                      ? 'bg-[#0E2A1E] border-2 border-poker-emerald text-poker-emerald shadow-neon-emerald'
                      : isFolded
                        ? 'bg-[#101722] border border-slate-800 text-slate-500'
                        : 'bg-[#162232] border border-[#23354B] text-slate-200'
                  )}
                >
                  {isHero ? (
                    <>
                      <span className="text-[10px] font-black text-poker-emerald">HERO</span>
                      <span className="text-[9px] font-bold text-emerald-300/90 mt-0.5">{pos}</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold">{pos}</span>
                  )}
                </div>

                <div
                  className={cn(
                    'flex-1 h-10 px-3 rounded-xl flex items-center justify-between overflow-hidden',
                    pillStyle
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </span>
                    <span className="text-xs sm:text-sm font-bold tracking-wide truncate">
                      {formatActionLabel(player?.actions || [])}
                    </span>
                  </div>

                  {needsToRespond ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 flex-shrink-0 ml-1">
                      Falta igualar
                    </span>
                  ) : !isFolded ? (
                    <Check className="w-4 h-4 text-white/70 flex-shrink-0 ml-1" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ZONA 2: Tarjeta Protagonista del Jugador en Turno Actual */}
      {currentTurnPosition && currentTurnPlayer && (
        <div
          className={cn(
            'flex items-center justify-between gap-2.5 w-full p-2.5 rounded-2xl border-2 transition-all',
            isHeroCurrentTurn
              ? 'bg-[#0A2319] border-poker-emerald shadow-neon-emerald'
              : 'bg-blue-950/50 border-blue-400 shadow-lg'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'w-14 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 leading-none font-bold',
                isHeroCurrentTurn
                  ? 'bg-poker-emerald text-slate-950 shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
              )}
            >
              {isHeroCurrentTurn ? (
                <>
                  <span className="text-[10px] font-black tracking-wider">HERO</span>
                  <span className="text-xs font-black mt-0.5">{currentTurnPosition}</span>
                </>
              ) : (
                <span className="text-xs font-extrabold">{currentTurnPosition}</span>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  'text-xs sm:text-sm font-extrabold tracking-wide truncate',
                  isHeroCurrentTurn ? 'text-emerald-300' : 'text-white'
                )}
              >
                {isHeroCurrentTurn ? 'Tu turno de decidir' : `Turno de ${currentTurnPosition}`}
              </span>
              <span className="text-[11px] font-medium text-slate-300 truncate">
                {currentTurnPlayer.actions.length > 0
                  ? `Previo: ${formatActionLabel(currentTurnPlayer.actions)}`
                  : highestBet > 0
                    ? `Apuesta actual en mesa: $${highestBet.toLocaleString('es-AR')}`
                    : 'Esperando decisión...'}
              </span>
            </div>
          </div>

          <span
            className={cn(
              'text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full flex-shrink-0',
              isHeroCurrentTurn
                ? 'bg-poker-emerald text-slate-950 animate-pulse'
                : 'bg-blue-500 text-white'
            )}
          >
            {isHeroCurrentTurn ? 'Tu Turno' : 'En Turno'}
          </span>
        </div>
      )}

      {/* ZONA 3: Cola de Próximos por Hablar (Píldoras Horizontales Interactivas) */}
      {pendingPositions.length > 0 && (
        <div className="bg-[#0B131E] border border-[#1A293D] rounded-xl px-2.5 py-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
            En espera ({pendingPositions.length}):
          </span>
          {pendingPositions.map((pos) => {
            const isHero = pos === heroPosition;
            return (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectTurn(pos);
                }}
                title={`Saltar turno a ${pos}`}
                className={cn(
                  'min-h-[34px] px-2.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all active:scale-95',
                  isHero
                    ? 'bg-[#0E2A1E] border border-poker-emerald text-poker-emerald shadow-neon-emerald'
                    : 'bg-[#131F2E] hover:bg-[#1A2B40] border border-[#22344A] text-slate-300'
                )}
              >
                {isHero ? `HERO (${pos})` : pos}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
