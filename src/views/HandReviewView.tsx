import React from 'react';
import { ArrowLeft, Check, Edit3, Trash2 } from 'lucide-react';
import { Card, TablePosition, PlayerAction } from '../types/poker';
import { clsx } from 'clsx';

interface HandReviewViewProps {
  handNumber: number;
  createdAt?: number;
  blinds: { sb: number; bb: number };
  playerCount: number;
  heroPosition: TablePosition;
  heroCards?: Card[];
  stackAtStart?: number;
  preflopActions: PlayerAction[];
  flopCards?: Card[];
  flopActions?: PlayerAction[];
  notes?: string;
  onEdit: () => void;
  onSave: () => void;
  onBack: () => void;
  onDelete?: () => void;
  isExistingSavedHand?: boolean;
}

export const HandReviewView: React.FC<HandReviewViewProps> = ({
  handNumber,
  createdAt = Date.now(),
  blinds,
  playerCount,
  heroPosition,
  heroCards = [],
  stackAtStart,
  preflopActions,
  flopCards = [],
  flopActions = [],
  notes,
  onEdit,
  onSave,
  onBack,
  onDelete,
  isExistingSavedHand = false
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const formattedDate = new Date(createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getActionColor = (type: string) => {
    switch (type) {
      case 'raise':
      case '3bet':
      case '4bet':
      case 'bet':
        return 'text-red-400 font-bold';
      case 'call':
        return 'text-blue-400 font-semibold';
      case 'limp':
      case 'check':
        return 'text-emerald-400 font-semibold';
      case 'fold':
      default:
        return 'text-slate-500 font-medium';
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#070C12] text-white flex flex-col justify-between overflow-x-hidden pt-safe pb-safe max-w-md mx-auto px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onBack();
          }}
          className="w-9 h-9 rounded-xl bg-[#121E2C] border border-[#233347] flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Revisar mano
        </h1>

        {isExistingSavedHand && onDelete ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              if (confirm(`¿Eliminar la Mano #${handNumber}?`)) {
                onDelete();
              }
            }}
            className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 active:scale-90 transition-all"
            aria-label="Eliminar mano"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-3 py-3 overflow-y-auto no-scrollbar">
        {/* Metadatos Card */}
        <div className="bg-[#0C1624] border border-[#1E2E42] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
            <span className="font-extrabold text-base text-white tracking-wide">
              Mano #{handNumber}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {formattedDate}
            </span>
          </div>

          <div className="text-xs text-slate-400 mb-3">
            Ciegas: {blinds.sb.toLocaleString('es-AR')} / {blinds.bb.toLocaleString('es-AR')} &nbsp;|&nbsp; Mesa: {playerCount} jugadores
            {typeof stackAtStart === 'number' && stackAtStart > 0 && (
              <>
                {' '}&nbsp;|&nbsp; Stack:{' '}
                <span className="text-poker-emerald font-bold">
                  ${stackAtStart.toLocaleString('es-AR')} ({Number((stackAtStart / blinds.bb).toFixed(1))} BB)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Tu posición:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-poker-emerald font-black text-xs">
                {heroPosition}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tu mano:</span>
              {heroCards.length > 0 ? (
                <div className="flex items-center gap-1">
                  {heroCards.map((c, i) => (
                    <span
                      key={i}
                      className={clsx(
                        'px-2 py-0.5 rounded-md bg-white text-slate-950 font-black text-xs shadow flex items-center gap-0.5',
                        c.suit === 'hearts' ? 'text-red-600' : c.suit === 'diamonds' ? 'text-blue-600' : c.suit === 'clubs' ? 'text-emerald-700' : 'text-slate-900'
                      )}
                    >
                      {c.rank}{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No registrada</span>
              )}
            </div>
          </div>
        </div>

        {/* Preflop Breakdown Card */}
        <div className="bg-[#0A121D] border border-[#1A293D] rounded-2xl p-4 shadow-xl">
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2.5">
            Preflop
          </h2>

          {preflopActions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">Sin acciones registradas</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-800/60">
              {preflopActions.map((act) => (
                <div
                  key={act.id}
                  className={clsx(
                    'py-2 px-1 flex items-center justify-between text-xs',
                    act.isHero && 'bg-emerald-950/30 rounded-lg px-2'
                  )}
                >
                  <span className={clsx('font-bold', act.isHero ? 'text-poker-emerald' : 'text-slate-300')}>
                    {act.position} {act.isHero && '(HERO)'}
                  </span>

                  <span className={clsx('capitalize', getActionColor(act.actionType))}>
                    {act.actionType} {act.amount && `$${act.amount.toLocaleString('es-AR')}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flop Breakdown Card (if applicable) */}
        {(flopCards.length > 0 || flopActions.length > 0) && (
          <div className="bg-[#0A121D] border border-[#1A293D] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                Flop
              </h2>
              {flopCards.length > 0 && (
                <div className="flex items-center gap-1">
                  {flopCards.map((c, i) => (
                    <span
                      key={i}
                      className={clsx(
                        'px-1.5 py-0.5 rounded bg-white font-black text-xs shadow-sm flex items-center',
                        c.suit === 'hearts' ? 'text-red-600' : c.suit === 'diamonds' ? 'text-blue-600' : c.suit === 'clubs' ? 'text-emerald-700' : 'text-slate-900'
                      )}
                    >
                      {c.rank}{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {flopActions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">Sin acciones postflop registradas</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-800/60">
                {flopActions.map((act) => (
                  <div
                    key={act.id}
                    className={clsx(
                      'py-2 px-1 flex items-center justify-between text-xs',
                      act.isHero && 'bg-emerald-950/30 rounded-lg px-2'
                    )}
                  >
                    <span className={clsx('font-bold', act.isHero ? 'text-poker-emerald' : 'text-slate-300')}>
                      {act.position} {act.isHero && '(HERO)'}
                    </span>

                    <span className={clsx('capitalize', getActionColor(act.actionType))}>
                      {act.actionType} {act.amount && `$${act.amount.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {notes && (
          <div className="bg-[#0A121D] border border-[#1A293D] rounded-2xl p-3 text-xs text-slate-300">
            <span className="text-slate-500 font-semibold block mb-0.5">Nota:</span>
            {notes}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar (Editar & Guardar Mano) */}
      <div className="pt-2 pb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onEdit();
          }}
          className="flex-1 h-14 bg-[#142132] hover:bg-[#1E2E42] border border-[#223348] text-slate-200 font-bold text-base rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        >
          <Edit3 className="w-4 h-4 text-slate-400" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            onSave();
          }}
          className="flex-[2] h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-5 h-5 fill-white text-white" />
          <span>{isExistingSavedHand ? 'Actualizar mano' : 'Guardar mano'}</span>
        </button>
      </div>
    </div>
  );
};
