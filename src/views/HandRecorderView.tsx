import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MoreVertical, CheckCircle2 } from 'lucide-react';
import { PokerTable } from '../components/poker/PokerTable';
import { CardSelector } from '../components/poker/CardSelector';
import { ActionConsole } from '../components/poker/ActionConsole';
import { PreflopActionTimeline, SeatActionState } from '../components/poker/PreflopActionTimeline';
import { CommunityCardsPicker } from '../components/poker/CommunityCardsPicker';
import { FlopActionConsole } from '../components/poker/FlopActionConsole';
import { HandReviewView } from './HandReviewView';
import { useHandStore } from '../stores/handStore';
import { useSessionStore } from '../stores/sessionStore';
import { ActionType, HandStreet, TablePosition } from '../types/poker';
import { getPositionsForPlayerCount, getPreflopActionOrder } from '../core/positionEngine';
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
  const [heroAction, setHeroAction] = useState<ActionType | null>(null);
  const [raiseAmount, setRaiseAmount] = useState<number>(4000);

  if (!activeSession) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const allPositions = getPositionsForPlayerCount(activeSession.playerCount);
  const actionOrder = getPreflopActionOrder(activeSession.playerCount);
  const activePlayers = getActivePlayersForFlop(allPositions);

  // Inicializar estado individual de acciones por asiento
  const [seatActions, setSeatActions] = useState<Record<TablePosition, SeatActionState>>(() => {
    const initial: Record<string, SeatActionState> = {};
    actionOrder.forEach((pos) => {
      initial[pos] = {
        position: pos,
        isHero: pos === heroPosition,
        actionType: 'fold'
      };
    });
    return initial as Record<TablePosition, SeatActionState>;
  });

  // Tocar una píldora de asiento cicla: fold -> limp -> call -> raise -> fold
  const handleToggleSeatAction = (pos: TablePosition) => {
    setSeatActions((prev) => {
      const current = prev[pos] || { position: pos, isHero: pos === heroPosition, actionType: 'fold' };
      let nextType: ActionType = 'limp';
      let nextAmount: number | undefined = undefined;

      if (current.actionType === 'fold') {
        nextType = 'limp';
        nextAmount = activeSession.blinds.bb;
      } else if (current.actionType === 'limp') {
        nextType = 'raise';
        nextAmount = raiseAmount;
      } else if (current.actionType === 'raise') {
        nextType = 'call';
        nextAmount = raiseAmount;
      } else {
        nextType = 'fold';
      }

      return {
        ...prev,
        [pos]: {
          ...current,
          actionType: nextType,
          amount: nextAmount
        }
      };
    });
  };

  // Manejar acción de Hero desde la consola inferior
  const handleHeroActionSelect = (action: ActionType, amount?: number) => {
    setHeroAction(action);
    setSeatActions((prev) => ({
      ...prev,
      [heroPosition]: {
        position: heroPosition,
        isHero: true,
        actionType: action,
        amount: action === 'raise' ? (amount || raiseAmount) : (action === 'call' ? activeSession.blinds.bb : undefined)
      }
    }));

    addPreflopAction(heroPosition, true, action, amount);

    // Si foldea, persistencia ultrarrápida automática
    if (action === 'fold') {
      saveHand('Hero fold preflop').then(() => {
        triggerHaptic();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          resetHand();
          onBackToSession();
        }, 1200);
      });
    }
  };

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
          onBackToSession();
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
          <span>¡Mano #{handNumber} guardada con éxito!</span>
        </div>
      )}

      {/* Encabezado idéntico al mockup (< | Mano #12 | ⋮) */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={handlePrevStep}
          className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">
            Mano #{handNumber}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleNextStep}
          className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          aria-label="Opciones"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Barra Horizontal Superior de Posiciones ([UTG] [UTG+1] ... [HERO]) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-b border-slate-800/60">
        {actionOrder.map((pos) => {
          const isHero = pos === heroPosition;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => {
                triggerHaptic();
                setHeroPosition(pos);
              }}
              className={clsx(
                'h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 select-none active:scale-95',
                isHero
                  ? 'bg-poker-emerald text-white shadow-neon-emerald ring-1 ring-white/30'
                  : 'bg-[#15202E] text-slate-300 border border-[#223348] hover:border-slate-500'
              )}
            >
              {pos}
            </button>
          );
        })}
        {/* Píldora HERO Verde Destacada */}
        <div className="h-8 px-3 rounded-lg bg-poker-emerald text-white text-xs font-black flex items-center justify-center shadow-neon-emerald flex-shrink-0">
          HERO
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col gap-2 py-2 overflow-y-auto no-scrollbar">
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
          /* PASO 2: Acción Preflop idéntico a la Imagen 2 */
          <div className="flex flex-col gap-2">
            <PreflopActionTimeline
              positions={actionOrder}
              heroPosition={heroPosition}
              seatActions={seatActions}
              onToggleSeatAction={handleToggleSeatAction}
            />
          </div>
        )}

        {currentStep === 3 && (
          /* PASO 3: Flop Comunitario y Acciones */
          <>
            {/* Jugadores activos restantes */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
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
          </>
        )}
      </div>

      {/* Zona Inferior Anclada: Consola en Paso 2 o Botón Siguiente en Paso 1 */}
      <div className="pt-1 pb-1">
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
          <ActionConsole
            heroAction={heroAction}
            raiseAmount={raiseAmount}
            onHeroActionSelect={handleHeroActionSelect}
            onRaiseAmountChange={setRaiseAmount}
            bbAmount={activeSession.blinds.bb}
          />
        )}

        {currentStep === 3 && (
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2 transition-all"
          >
            <span>Revisar y Guardar mano</span>
          </button>
        )}
      </div>
    </div>
  );
};
