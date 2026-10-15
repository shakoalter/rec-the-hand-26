import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { PokerTable } from '../components/poker/PokerTable';
import { CardSelector } from '../components/poker/CardSelector';
import { ActionConsole } from '../components/poker/ActionConsole';
import { CommunityCardsPicker } from '../components/poker/CommunityCardsPicker';
import { FlopActionConsole } from '../components/poker/FlopActionConsole';
import { HandReviewView } from './HandReviewView';
import { useHandStore } from '../stores/handStore';
import { useSessionStore } from '../stores/sessionStore';
import { ActionType, HandStreet } from '../types/poker';
import { getPositionsForPlayerCount } from '../core/positionEngine';
import { clsx } from 'clsx';

interface HandRecorderViewProps {
  onBackToSession: () => void;
}

const STREETS: { id: HandStreet; label: string }[] = [
  { id: 'preflop', label: 'PREFLOP' },
  { id: 'flop', label: 'FLOP' },
  { id: 'turn', label: 'TURN' },
  { id: 'river', label: 'RIVER' }
];

export const HandRecorderView: React.FC<HandRecorderViewProps> = ({ onBackToSession }) => {
  const { activeSession } = useSessionStore();
  const {
    handNumber,
    currentStep,
    currentStreet,
    heroPosition,
    dealerPosition,
    heroCards,
    preflopActions,
    flopCards,
    flopActions,
    setStep,
    setStreet,
    setHeroPosition,
    addCard,
    removeCard,
    clearCards,
    addPreflopAction,
    addFlopCard,
    removeFlopCard,
    clearFlopCards,
    addFlopAction,
    isCardInUse,
    getActivePlayersForFlop,
    saveHand,
    resetHand
  } = useHandStore();

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!activeSession) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const allPositions = getPositionsForPlayerCount(activeSession.playerCount);
  const activePlayers = getActivePlayersForFlop(allPositions);

  const handleNextStep = () => {
    triggerHaptic();
    if (currentStep === 1) {
      setStep(2);
      setStreet('preflop');
    } else if (currentStep === 2) {
      setStep(3);
      setStreet('flop');
    } else if (currentStep === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    triggerHaptic();
    if (currentStep === 4) {
      setStep(flopCards.length > 0 ? 3 : 2);
    } else if (currentStep === 3) {
      setStep(2);
      setStreet('preflop');
    } else if (currentStep === 2) {
      setStep(1);
    } else {
      onBackToSession();
    }
  };

  const handleHeroPreflopAction = async (actionType: ActionType, amount?: number) => {
    addPreflopAction(heroPosition, true, actionType, amount);

    // Si foldea en preflop, guardado rápido automático
    if (actionType === 'fold') {
      try {
        await saveHand('Hero fold preflop');
        triggerHaptic();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          resetHand();
        }, 1200);
      } catch (err) {
        console.error('Error al guardar la mano:', err);
      }
    }
  };

  const handleHeroFlopAction = async (actionType: ActionType, amount?: number) => {
    addFlopAction(heroPosition, true, actionType, amount);

    if (actionType === 'fold') {
      try {
        await saveHand('Hero fold en flop');
        triggerHaptic();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          resetHand();
        }, 1200);
      } catch (err) {
        console.error('Error al guardar la mano:', err);
      }
    }
  };

  const handleFinalSaveHand = async () => {
    try {
      await saveHand();
      triggerHaptic();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        resetHand();
        onBackToSession();
      }, 1200);
    } catch (err) {
      console.error('Error al guardar mano:', err);
    }
  };

  if (currentStep === 4) {
    return (
      <HandReviewView
        handNumber={handNumber}
        blinds={activeSession.blinds}
        playerCount={activeSession.playerCount}
        heroPosition={heroPosition}
        heroCards={heroCards}
        preflopActions={preflopActions}
        flopCards={flopCards}
        flopActions={flopActions}
        onEdit={() => setStep(flopCards.length > 0 ? 3 : 2)}
        onSave={handleFinalSaveHand}
        onBack={handlePrevStep}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#070C12] text-white flex flex-col justify-between overflow-x-hidden pt-safe pb-safe max-w-md mx-auto px-3.5">
      {/* Toast de confirmación de mano guardada */}
      {savedSuccess && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 border border-emerald-400 text-white font-bold py-2.5 px-5 rounded-2xl shadow-neon-emerald flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>¡Mano #{handNumber} guardada en 1 toque!</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={handlePrevStep}
          className="w-9 h-9 rounded-xl bg-[#121E2C] border border-[#233347] flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-white leading-tight">
            {currentStep === 1 ? `Mesa ${activeSession.playerCount} jugadores` : `Mano #${handNumber}`}
          </h1>
          <p className="text-[11px] text-slate-400">
            Ciegas: {activeSession.blinds.sb.toLocaleString('es-AR')} / {activeSession.blinds.bb.toLocaleString('es-AR')} | Stack: ${activeSession.initialStack.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald font-bold text-xs">
          P{currentStep}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-3 py-2 overflow-y-auto no-scrollbar">
        {currentStep === 1 && (
          /* PASO 1: Posición y Mano */
          <>
            <PokerTable
              playerCount={activeSession.playerCount}
              heroPosition={heroPosition}
              dealerPosition={dealerPosition}
              onSelectHeroPosition={setHeroPosition}
            />

            <CardSelector
              cards={heroCards}
              onAddCard={addCard}
              onRemoveCard={removeCard}
              onClear={clearCards}
              maxCards={2}
              label="Tu mano (2 toques: rango + palo)"
            />
          </>
        )}

        {currentStep === 2 && (
          /* PASO 2: Acción Preflop */
          <>
            <div className="flex items-center justify-between bg-[#0C1522] border border-[#1E2E42] rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Tu posición:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-poker-emerald font-bold text-xs">
                  {heroPosition}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Tus cartas:</span>
                {heroCards.length > 0 ? (
                  heroCards.map((c, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-white text-slate-950 font-black text-xs shadow-sm"
                    >
                      {c.rank}{c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : '♠'}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Sin registrar</span>
                )}
              </div>
            </div>

            <ActionConsole
              heroPosition={heroPosition}
              playerCount={activeSession.playerCount}
              bbAmount={activeSession.blinds.bb}
              onHeroAction={handleHeroPreflopAction}
            />

            {preflopActions.length > 0 && (
              <div className="bg-[#0A111A] border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Secuencia de la mano
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {preflopActions.map((act) => (
                    <span
                      key={act.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                    >
                      <span className="text-poker-emerald">{act.position}:</span>
                      <span className="capitalize">{act.actionType}</span>
                      {act.amount && <span className="text-slate-300">${act.amount.toLocaleString('es-AR')}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 3 && (
          /* PASO 3: Flop Comunitario y Acciones */
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jugadores activos ({activePlayers.length})
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {activePlayers.map((pos) => (
                  <span
                    key={pos}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0',
                      pos === heroPosition
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-poker-emerald shadow-sm'
                        : 'bg-[#121E2C] border-[#223348] text-slate-300'
                    )}
                  >
                    {pos === heroPosition ? `HERO (${pos})` : pos}
                  </span>
                ))}
              </div>
            </div>

            {/* Street Tabs */}
            <div className="grid grid-cols-4 gap-1.5 bg-[#0C1522] p-1 rounded-xl border border-[#1A293D]">
              {STREETS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (st.id === 'preflop') setStep(2);
                    setStreet(st.id);
                  }}
                  className={clsx(
                    'py-1.5 rounded-lg text-xs font-bold transition-all text-center',
                    currentStreet === st.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <CommunityCardsPicker
              flopCards={flopCards}
              onAddCard={addFlopCard}
              onRemoveCard={removeFlopCard}
              onClear={clearFlopCards}
              isCardInUse={isCardInUse}
            />

            <FlopActionConsole
              heroPosition={heroPosition}
              bbAmount={activeSession.blinds.bb}
              onHeroAction={handleHeroFlopAction}
            />

            {flopActions.length > 0 && (
              <div className="bg-[#0A111A] border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Acciones en el Flop
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {flopActions.map((act) => (
                    <span
                      key={act.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                    >
                      <span className="text-poker-emerald">{act.position}:</span>
                      <span className="capitalize">{act.actionType}</span>
                      {act.amount && <span className="text-slate-300">${act.amount.toLocaleString('es-AR')}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="pt-2 pb-1">
        {currentStep === 1 && (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2 transition-all"
          >
            <span>Siguiente</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {currentStep === 2 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={preflopActions.length === 0}
              className="flex-1 h-14 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Revisar</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-base rounded-2xl shadow-neon-emerald flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Ir al Flop</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2 transition-all"
          >
            <Eye className="w-5 h-5" />
            <span>Revisar y Guardar</span>
          </button>
        )}
      </div>
    </div>
  );
};
