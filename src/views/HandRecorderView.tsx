import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, MoreVertical, CheckCircle2 } from 'lucide-react';
import { PokerTable } from '../components/poker/PokerTable';
import { CardSelector } from '../components/poker/CardSelector';
import { ActionConsole } from '../components/poker/ActionConsole';
import { PreflopActionTimeline } from '../components/poker/PreflopActionTimeline';
import { CommunityCardsPicker } from '../components/poker/CommunityCardsPicker';
import { FlopActionConsole } from '../components/poker/FlopActionConsole';
import { HandReviewView } from './HandReviewView';
import { useHandStore } from '../stores/handStore';
import { useSessionStore } from '../stores/sessionStore';
import { ActionType, HandStreet, TablePosition } from '../types/poker';
import { getPositionsForPlayerCount, getPreflopActionOrder } from '../core/positionEngine';
import { bettingEngine, BettingPlayerState, BettingRoundStatus } from '../core/bettingEngine';
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
  const [raiseAmount, setRaiseAmount] = useState<number>(4000);
  const [currentHighestBet, setCurrentHighestBet] = useState<number>(activeSession?.blinds.bb || 1000);

  if (!activeSession) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const allPositions = getPositionsForPlayerCount(activeSession.playerCount);
  const actionOrder = getPreflopActionOrder(activeSession.playerCount);
  const activePlayers = getActivePlayersForFlop(allPositions);

  // Asientos y estado de apuestas con bettingEngine
  const [seatStates, setSeatStates] = useState<Record<TablePosition, BettingPlayerState>>(() =>
    bettingEngine.initPreflopSeats(actionOrder, heroPosition, activeSession.blinds)
  );

  // Turno actual: TablePosition o null cuando la ronda preflop ha concluido
  const [currentTurnPosition, setCurrentTurnPosition] = useState<TablePosition | null>(actionOrder[0] || heroPosition);
  const isHeroTurn = currentTurnPosition === heroPosition;
  const heroIndex = actionOrder.indexOf(heroPosition);
  const currentTurnIndex = currentTurnPosition ? actionOrder.indexOf(currentTurnPosition) : -1;

  // Estado general de la ronda
  const [roundStatus, setRoundStatus] = useState<BettingRoundStatus>({
    isRoundComplete: false,
    isHandOver: false,
    highestBet: activeSession.blinds.bb,
    nextPositionToAct: actionOrder[0] || null,
    activePlayersCount: actionOrder.length
  });

  // Si cambia heroPosition en Paso 1, sincronizar la marca isHero sin reiniciar si no es necesario
  useEffect(() => {
    if (preflopActions.length === 0) {
      const initial = bettingEngine.initPreflopSeats(actionOrder, heroPosition, activeSession.blinds);
      setSeatStates(initial);
      setCurrentTurnPosition(actionOrder[0] || heroPosition);
      setCurrentHighestBet(activeSession.blinds.bb);
      setRaiseAmount(activeSession.blinds.bb * 2);
      setRoundStatus({
        isRoundComplete: false,
        isHandOver: false,
        highestBet: activeSession.blinds.bb,
        nextPositionToAct: actionOrder[0] || null,
        activePlayersCount: actionOrder.length
      });
    } else {
      setSeatStates((prev) => {
        const updated = { ...prev };
        actionOrder.forEach((pos) => {
          if (updated[pos]) {
            updated[pos] = { ...updated[pos], isHero: pos === heroPosition };
          }
        });
        return updated;
      });
    }
  }, [heroPosition, actionOrder, activeSession.blinds, preflopActions.length]);

  // Manejar acción del jugador en turno
  const handleActionSelect = (action: ActionType, amount?: number) => {
    if (!currentTurnPosition) return;
    const actingPos = currentTurnPosition;
    const isHero = actingPos === heroPosition;

    // 1. Aplicar la acción a través de bettingEngine
    const { updatedSeats, newHighestBet } = bettingEngine.applyAction(
      seatStates,
      actingPos,
      action,
      amount,
      currentHighestBet,
      activeSession.blinds.bb
    );

    setSeatStates(updatedSeats);
    setCurrentHighestBet(newHighestBet);

    let finalAmount = amount;
    if (action === 'raise' || action === '3bet' || action === '4bet') {
      finalAmount = amount || newHighestBet;
      setRaiseAmount(newHighestBet * 2);
    } else if (action === 'call') {
      finalAmount = newHighestBet;
    } else if (action === 'limp') {
      finalAmount = activeSession.blinds.bb;
    }

    addPreflopAction(actingPos, isHero, action, finalAmount);

    // 2. Si Hero foldea -> autoguardado rápido
    if (isHero && action === 'fold') {
      saveHand('Hero fold preflop').then(() => {
        triggerHaptic();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          resetHand();
          onBackToSession();
        }, 1200);
      });
      return;
    }

    // 3. Evaluar el estado de la ronda de apuestas (re-apertura de turnos o cierre)
    const evalStatus = bettingEngine.evaluateRound(
      actionOrder,
      updatedSeats,
      actingPos,
      newHighestBet
    );
    setRoundStatus(evalStatus);

    if (evalStatus.isHandOver) {
      // Todos foldearon ante la subida
      if (evalStatus.winnerPosition === heroPosition) {
        saveHand('Hero gana preflop (todos foldearon)').then(() => {
          triggerHaptic();
          setSavedSuccess(true);
          setTimeout(() => {
            setSavedSuccess(false);
            resetHand();
            onBackToSession();
          }, 1400);
        });
      } else {
        setCurrentTurnPosition(null);
      }
      return;
    }

    if (evalStatus.isRoundComplete) {
      // Ronda terminada: todos los activos igualaron la apuesta más alta
      setCurrentTurnPosition(null);
    } else {
      // Ronda sigue activa: pasar el turno al siguiente jugador que debe hablar (ej: villano ante un 3-bet)
      setCurrentTurnPosition(evalStatus.nextPositionToAct);
    }
  };

  // Atajo: Folds hasta Hero en 1 toque
  const handleFastForwardToHero = () => {
    if (!currentTurnPosition || currentTurnIndex === -1 || heroIndex <= currentTurnIndex) return;

    let tempSeats = { ...seatStates };
    let tempHighest = currentHighestBet;

    for (let i = currentTurnIndex; i < heroIndex; i++) {
      const pos = actionOrder[i];
      if (tempSeats[pos] && tempSeats[pos].status === 'active') {
        const res = bettingEngine.applyAction(
          tempSeats,
          pos,
          'fold',
          undefined,
          tempHighest,
          activeSession.blinds.bb
        );
        tempSeats = res.updatedSeats;
        tempHighest = res.newHighestBet;
        addPreflopAction(pos, false, 'fold');
      }
    }

    setSeatStates(tempSeats);
    setCurrentHighestBet(tempHighest);
    setCurrentTurnPosition(heroPosition);

    const evalStatus = bettingEngine.evaluateRound(
      actionOrder,
      tempSeats,
      heroPosition,
      tempHighest
    );
    setRoundStatus(evalStatus);
  };

  const handleNextStep = () => {
    triggerHaptic();
    if (currentStep === 1) {
      setStep(2);
      setStreet('preflop');
      const initial = bettingEngine.initPreflopSeats(actionOrder, heroPosition, activeSession.blinds);
      setSeatStates(initial);
      setCurrentTurnPosition(actionOrder[0] || heroPosition);
      setCurrentHighestBet(activeSession.blinds.bb);
      setRaiseAmount(activeSession.blinds.bb * 2);
      setRoundStatus({
        isRoundComplete: false,
        isHandOver: false,
        highestBet: activeSession.blinds.bb,
        nextPositionToAct: actionOrder[0] || null,
        activePlayersCount: actionOrder.length
      });
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

  // Saber si la ronda preflop está completada
  const isPreflopComplete = roundStatus.isRoundComplete;

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

      {/* Encabezado (< | Mano #12 | ⋮) */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={handlePrevStep}
          className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
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

      {/* Barra Horizontal Superior de Posiciones: Exclusivamente los asientos reales sin duplicados */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-b border-slate-800/60">
        {actionOrder.map((pos) => {
          const isHero = pos === heroPosition;
          const isCurrent = pos === currentTurnPosition;
          const playerState = seatStates[pos];
          const isFolded = playerState?.status === 'folded';
          const acted = playerState?.hasActedInRound;

          return (
            <button
              key={pos}
              type="button"
              onClick={() => {
                triggerHaptic();
                setCurrentTurnPosition(pos);
              }}
              className={clsx(
                'h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center flex-shrink-0 select-none active:scale-95',
                isCurrent
                  ? 'bg-blue-600 text-white ring-2 ring-white shadow-md'
                  : isHero
                    ? 'bg-[#0E2A1E] border border-poker-emerald text-poker-emerald shadow-neon-emerald'
                    : isFolded
                      ? 'bg-[#121A24] text-slate-600 opacity-50'
                      : acted
                        ? 'bg-[#182638] text-slate-300'
                        : 'bg-[#101924] text-slate-500 border border-[#1E2E42]'
              )}
            >
              {isHero ? `HERO (${pos})` : pos}
            </button>
          );
        })}
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
          /* PASO 2: Acción Preflop por turnos */
          <div className="flex flex-col gap-2">
            <PreflopActionTimeline
              positions={actionOrder}
              heroPosition={heroPosition}
              currentTurnPosition={currentTurnPosition}
              seatStates={seatStates}
              onSelectTurn={(pos) => {
                setCurrentTurnPosition(pos);
              }}
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

      {/* Zona Inferior Anclada */}
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
          <div className="flex flex-col gap-2">
            {currentTurnPosition && (
              <ActionConsole
                currentPosition={currentTurnPosition}
                isHero={isHeroTurn}
                currentHighestBet={currentHighestBet}
                raiseAmount={raiseAmount}
                onActionSelect={handleActionSelect}
                onRaiseAmountChange={setRaiseAmount}
                onFastForwardToHero={handleFastForwardToHero}
                canFastForwardToHero={Boolean(
                  currentTurnIndex !== -1 &&
                  heroIndex > currentTurnIndex &&
                  currentHighestBet === activeSession.blinds.bb &&
                  !seatStates[heroPosition]?.hasActedInRound
                )}
                bbAmount={activeSession.blinds.bb}
              />
            )}

            {isPreflopComplete && (
              <div className="flex flex-col gap-2 bg-[#0D1826] border border-poker-emerald/40 p-3 rounded-2xl animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-poker-emerald">
                    <CheckCircle2 className="w-4 h-4 text-poker-emerald" />
                    Ronda Preflop Completada
                  </span>
                  <span className="text-slate-400">
                    Apuesta igualada: ${roundStatus.highestBet.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Revisar mano</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 h-12 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-sm rounded-xl shadow-neon-emerald flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Ir al Flop</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
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
