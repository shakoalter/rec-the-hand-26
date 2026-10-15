import React, { useState, useEffect } from 'react';
import { Play, Square, Layers, Clock, ChevronRight } from 'lucide-react';
import { useSessionStore } from '../stores/sessionStore';
import { useHandStore } from '../stores/handStore';
import { sessionRepository } from '../db/sessionRepository';
import { RecordedHand } from '../types/session';
import { GlassCard } from '../components/common/GlassCard';
import { HandRecorderView } from './HandRecorderView';
import { HandReviewView } from './HandReviewView';

export const SessionActiveView: React.FC = () => {
  const { activeSession, finishSession } = useSessionStore();
  const { initHand } = useHandStore();

  const [isRecording, setIsRecording] = useState(false);
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

  // Métricas rápidas de póker
  const totalHands = recordedHands.length;
  const vpipHands = recordedHands.filter((h) =>
    h.preflopActions.some((a) => a.isHero && (a.actionType === 'call' || a.actionType === 'raise' || a.actionType === 'limp'))
  ).length;
  const pfrHands = recordedHands.filter((h) =>
    h.preflopActions.some((a) => a.isHero && a.actionType === 'raise')
  ).length;

  const vpipPercent = totalHands > 0 ? Math.round((vpipHands / totalHands) * 100) : 0;
  const pfrPercent = totalHands > 0 ? Math.round((pfrHands / totalHands) * 100) : 0;

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
        preflopActions={selectedHandForReview.preflopActions}
        flopCards={selectedHandForReview.flopCards}
        flopActions={selectedHandForReview.flopActions}
        notes={selectedHandForReview.notes}
        isExistingSavedHand={true}
        onEdit={() => {
          // Permite editar o regresar
          setSelectedHandForReview(null);
        }}
        onSave={() => setSelectedHandForReview(null)}
        onBack={() => setSelectedHandForReview(null)}
        onDelete={() => handleDeleteHand(selectedHandForReview.id)}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#070C12] text-white flex flex-col justify-between p-4 pt-safe pb-safe max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald shadow-neon-emerald">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Sesión en Vivo</h1>
            <p className="text-xs text-poker-emerald flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-poker-emerald animate-pulse" />
              Mesa de {activeSession.playerCount} jugadores
            </p>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-900/50 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Square className="w-3.5 h-3.5" /> Finalizar
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-3 py-3 overflow-y-auto no-scrollbar">
        {/* Parámetros & Estadísticas Rápidas */}
        <GlassCard>
          <div className="grid grid-cols-2 gap-2 text-sm mb-2.5">
            <div className="bg-[#0A111A] p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Ciegas</span>
              <p className="font-bold text-white text-sm">
                ${activeSession.blinds.sb.toLocaleString('es-AR')} / ${activeSession.blinds.bb.toLocaleString('es-AR')}
              </p>
            </div>

            <div className="bg-[#0A111A] p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Stack Inicial</span>
              <p className="font-bold text-poker-emerald text-sm">
                ${activeSession.initialStack.toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="bg-[#080E16] p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Manos</span>
              <span className="text-base font-black text-white">{totalHands}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">VPIP</span>
              <span className="text-base font-black text-blue-400">{vpipPercent}%</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">PFR</span>
              <span className="text-base font-black text-red-400">{pfrPercent}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Historial de manos de esta sesión */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Historial de manos ({recordedHands.length})
            </span>
          </div>

          {recordedHands.length === 0 ? (
            <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800/80 rounded-2xl text-center">
              <p className="text-sm font-medium text-slate-300 mb-1">
                Aún no has registrado manos en esta sesión.
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Tocá el botón verde para registrar una mano en segundos sin teclado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recordedHands.map((hand) => (
                <button
                  key={hand.id}
                  type="button"
                  onClick={() => setSelectedHandForReview(hand)}
                  className="w-full text-left bg-[#0D1624] hover:bg-[#132032] border border-[#1E2E42] active:scale-[0.99] rounded-xl p-3 flex items-center justify-between transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                      #{hand.handNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-400">{hand.heroPosition}</span>
                        {hand.heroCards && hand.heroCards.length > 0 && (
                          <span className="text-xs font-semibold text-slate-200">
                            {hand.heroCards.map((c) => `${c.rank}${c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}`).join(' ')}
                          </span>
                        )}
                        {hand.flopCards && hand.flopCards.length > 0 && (
                          <span className="text-[11px] text-blue-300 font-mono ml-1">
                            [{hand.flopCards.map((c) => `${c.rank}${c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}`).join(' ')}]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {hand.wasHeroFoldPreflop ? 'Fold preflop' : `${hand.preflopActions.length} preflop ${hand.flopActions ? `· ${hand.flopActions.length} flop` : ''}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-2">
        <button
          onClick={handleStartRecording}
          className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2.5 transition-all"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span>Registrar nueva mano</span>
        </button>
      </div>
    </div>
  );
};
