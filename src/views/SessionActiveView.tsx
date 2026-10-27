import React, { useState, useEffect } from 'react';
import { Play, Square, Layers, Clock, ChevronRight, Download, Sparkles } from 'lucide-react';
import { useSessionStore } from '../stores/sessionStore';
import { useHandStore } from '../stores/handStore';
import { sessionRepository } from '../db/sessionRepository';
import { RecordedHand } from '../types/session';
import { Card } from '../types/poker';
import { GlassCard } from '../components/common/GlassCard';
import { ExportModal } from '../components/common/ExportModal';
import { exportUtils } from '../utils/exportUtils';
import { HandRecorderView } from './HandRecorderView';
import { HandReviewView } from './HandReviewView';
import { cn } from '../utils/cn';

const SUIT_META: Record<Card['suit'], { symbol: string; textClass: string }> = {
  spades: { symbol: '♠', textClass: 'text-slate-900' },
  hearts: { symbol: '♥', textClass: 'text-red-600' },
  diamonds: { symbol: '♦', textClass: 'text-blue-600' },
  clubs: { symbol: '♣', textClass: 'text-emerald-700' }
};

export const SessionActiveView: React.FC = () => {
  const { activeSession, finishSession } = useSessionStore();
  const initHand = useHandStore((state) => state.initHand);

  const [isRecording, setIsRecording] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [recordedHands, setRecordedHands] = useState<RecordedHand[]>([]);
  const [selectedHandForReview, setSelectedHandForReview] = useState<RecordedHand | null>(null);

  const loadSessionHands = async () => {
    if (activeSession) {
      const hands = await sessionRepository.getHandsBySession(activeSession.id);
      setRecordedHands(hands);
    }
  };

  useEffect(() => {
    loadSessionHands();
  }, [activeSession, isRecording]);

  if (!activeSession) return null;

  const handleStartRecording = async () => {
    await initHand(activeSession.id, activeSession.currentStack);
    setIsRecording(true);
  };

  const handleFinish = async () => {
    if (confirm('¿Deseás finalizar la sesión actual?')) {
      await finishSession();
    }
  };

  const handleDeleteHand = async (handId: string) => {
    await sessionRepository.deleteHand(handId);
    setSelectedHandForReview(null);
    await loadSessionHands();
  };

  // Métricas rápidas de póker unificadas con el exportador
  const { totalHands, validHands, vpipPercent, pfrPercent } =
    exportUtils.calculateSessionStats(recordedHands);

  // Obtener etiqueta semántica resumida de la acción clave de Hero en la mano
  const getHandSummaryBadge = (hand: RecordedHand) => {
    if (hand.wasHeroFoldPreflop && (!hand.flopActions || hand.flopActions.length === 0)) {
      return {
        label: 'Fold PF',
        className: 'bg-slate-800/80 border-slate-700 text-slate-400'
      };
    }

    const heroFlopAct = hand.flopActions
      ? [...hand.flopActions].reverse().find((a) => a.isHero)
      : undefined;
    if (heroFlopAct) {
      const amt = heroFlopAct.amount ? ` $${heroFlopAct.amount.toLocaleString('es-AR')}` : '';
      return {
        label: `Flop: ${heroFlopAct.actionType.toUpperCase()}${amt}`,
        className: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
      };
    }

    const heroPreflopAct = [...hand.preflopActions].reverse().find((a) => a.isHero);
    if (heroPreflopAct) {
      const type = heroPreflopAct.actionType;
      const amt = heroPreflopAct.amount ? ` $${heroPreflopAct.amount.toLocaleString('es-AR')}` : '';
      if (type === 'raise' || type === '3bet' || type === '4bet' || type === 'allin') {
        return {
          label: `${type === 'raise' ? 'Raise' : type.toUpperCase()}${amt}`,
          className: 'bg-red-950/60 border-red-500/40 text-red-300'
        };
      }
      if (type === 'call') {
        return {
          label: `Call${amt}`,
          className: 'bg-blue-950/60 border-blue-500/40 text-blue-300'
        };
      }
      if (type === 'limp' || type === 'check') {
        return {
          label: type === 'check' ? 'Check' : 'Limp',
          className: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
        };
      }
    }

    if (hand.flopCards && hand.flopCards.length > 0) {
      return {
        label: 'Vio Flop',
        className: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
      };
    }

    return {
      label: `${hand.preflopActions.length} acc.`,
      className: 'bg-slate-800/80 border-slate-700 text-slate-300'
    };
  };

  if (isRecording) {
    return <HandRecorderView onBackToSession={() => setIsRecording(false)} />;
  }

  if (selectedHandForReview) {
    return (
      <HandReviewView
        handNumber={selectedHandForReview.handNumber}
        createdAt={selectedHandForReview.createdAt}
        blinds={activeSession.blinds}
        playerCount={activeSession.playerCount}
        heroPosition={selectedHandForReview.heroPosition}
        heroCards={selectedHandForReview.heroCards}
        stackAtStart={selectedHandForReview.stackAtStart}
        preflopActions={selectedHandForReview.preflopActions}
        flopCards={selectedHandForReview.flopCards}
        flopActions={selectedHandForReview.flopActions}
        notes={selectedHandForReview.notes}
        isExistingSavedHand={true}
        onEdit={() => setSelectedHandForReview(null)}
        onSave={() => setSelectedHandForReview(null)}
        onBack={() => setSelectedHandForReview(null)}
        onDelete={() => handleDeleteHand(selectedHandForReview.id)}
      />
    );
  }

  const initialBB = Math.round(activeSession.initialStack / activeSession.blinds.bb);

  return (
    <div className="app-shell bg-[#070C12] text-white w-full max-w-md mx-auto px-2.5 xs:px-3.5 sm:px-4 pt-safe pb-safe">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald shadow-neon-emerald">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
              Sesión en Vivo
            </h1>
            <p className="text-xs text-poker-emerald flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-poker-emerald animate-pulse" />
              Mesa de {activeSession.playerCount} jugadores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recordedHands.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="h-9 px-2.5 rounded-xl bg-[#142132] border border-[#233347] text-slate-200 hover:text-white active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Exportar sesión"
            >
              <Download className="w-4 h-4 text-poker-emerald" />
              <span>Exportar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFinish}
            className="h-9 px-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-900/50 flex items-center gap-1 active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5" /> Finalizar
          </button>
        </div>
      </header>

      {/* Main Content Area (Progresivo y con scroll interno aislado) */}
      <main className="flex-1 min-h-0 flex flex-col gap-3 py-2.5 overflow-y-auto no-scrollbar">
        {/* Parámetros Compactos & Mini-HUD Unificados */}
        <GlassCard compact>
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Ciegas:</span>
              <span className="font-bold text-white">
                ${activeSession.blinds.sb.toLocaleString('es-AR')} / ${activeSession.blinds.bb.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Stack:</span>
              <span className="font-bold text-poker-emerald">
                ${activeSession.initialStack.toLocaleString('es-AR')} ({initialBB} BB)
              </span>
            </div>
          </div>

          {/* Quick HUD Metrics (Muestra — cuando aún no hay manos válidas) */}
          <div className="bg-[#080E16] py-2 px-3 rounded-xl border border-slate-800/80 flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Manos</span>
              <span className="text-base font-black text-white">{totalHands}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">VPIP</span>
              <span
                className={cn(
                  'text-base font-black',
                  validHands > 0 ? 'text-blue-400' : 'text-slate-600'
                )}
              >
                {validHands > 0 ? `${vpipPercent}%` : '—'}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">PFR</span>
              <span
                className={cn(
                  'text-base font-black',
                  validHands > 0 ? 'text-red-400' : 'text-slate-600'
                )}
              >
                {validHands > 0 ? `${pfrPercent}%` : '—'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Historial de manos de esta sesión */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-poker-emerald" /> Historial de manos ({recordedHands.length})
            </span>
            {recordedHands.length > 0 && (
              <span className="text-[11px] text-slate-400">Tocá una mano para revisar</span>
            )}
          </div>

          {recordedHands.length === 0 ? (
            /* Estado Vacío Inteligente y Compacto (Ajustado al contenido) */
            <div className="bg-[#0B1420]/90 border border-dashed border-[#22344A] rounded-2xl p-5 flex flex-col items-center text-center gap-2 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald shadow-neon-emerald">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Mesa lista para registrar manos
                </p>
                <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                  Cargá tu posición, cartas y la secuencia preflop/flop en segundos con una sola mano.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recordedHands.map((hand) => {
                const badge = getHandSummaryBadge(hand);
                return (
                  <button
                    key={hand.id}
                    type="button"
                    onClick={() => setSelectedHandForReview(hand)}
                    className="w-full text-left bg-[#0D1624] hover:bg-[#132032] border border-[#1E2E42] active:scale-98 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-800/90 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-700 flex-shrink-0">
                        #{hand.handNumber}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-xs font-extrabold text-poker-emerald flex-shrink-0">
                        {hand.heroPosition}
                      </span>

                      {/* Cartas de Hero como mini-naipes de alto contraste */}
                      {hand.heroCards && hand.heroCards.length > 0 ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hand.heroCards.map((c, idx) => {
                            const meta = SUIT_META[c.suit];
                            return (
                              <span
                                key={idx}
                                className={cn(
                                  'px-1.5 py-0.5 rounded bg-white font-black text-xs shadow-sm flex items-center leading-none',
                                  meta.textClass
                                )}
                              >
                                {c.rank}
                                {meta.symbol}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic truncate">Sin cartas</span>
                      )}

                      {/* Cartas de Flop si existió */}
                      {hand.flopCards && hand.flopCards.length > 0 && (
                        <span className="text-[11px] text-blue-300 font-semibold truncate hidden xs:inline sm:inline">
                          [{hand.flopCards.map((c) => `${c.rank}${SUIT_META[c.suit].symbol}`).join(' ')}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-lg border text-[11px] font-bold',
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Button */}
      <footer className="shrink-0 pt-2">
        <button
          type="button"
          onClick={handleStartRecording}
          className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2.5 transition-all"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span>Registrar nueva mano</span>
        </button>
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        session={activeSession}
        hands={recordedHands}
      />
    </div>
  );
};
