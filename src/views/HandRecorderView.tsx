import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, MoreVertical, CheckCircle2, Coins, Minus, Plus, X } from 'lucide-react';
import { PokerTable } from '../components/poker/PokerTable';
import { CardSelector } from '../components/poker/CardSelector';
import { ActionConsole } from '../components/poker/ActionConsole';
import { PreflopActionTimeline } from '../components/poker/PreflopActionTimeline';
import { CommunityCardsPicker } from '../components/poker/CommunityCardsPicker';
import { FlopActionConsole } from '../components/poker/FlopActionConsole';
import { CustomNumberModal } from '../components/common/CustomNumberModal';
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
    stackAtStart,
    setStep,
    setStreet,
    setHeroPosition,
    setStackAtStart,
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
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  const [lastKnownStack, setLastKnownStack] = useState<number>(
    activeSession?.currentStack || activeSession?.initialStack || 50000
  );
  const [raiseAmount, setRaiseAmount] = useState<number>((activeSession?.blinds.bb || 1000) * 2);
  const [currentHighestBet, setCurrentHighestBet] = useState<number>(activeSession?.blinds.bb || 1000);

  const allPositions = useMemo(
    () => getPositionsForPlayerCount(activeSession?.playerCount || 9),
    [activeSession?.playerCount]
  );
  const actionOrder = useMemo(
    () => getPreflopActionOrder(activeSession?.playerCount || 9),
    [activeSession?.playerCount]
  );
  const activePlayers = getActivePlayersForFlop(allPositions);

  // Asientos y estado de apuestas con bettingEngine
  const [seatStates, setSeatStates] = useState<Record<TablePosition, BettingPlayerState>>(() =>
    bettingEngine.initPreflopSeats(
      actionOrder,
      heroPosition,
      activeSession?.blinds || { sb: 1000, bb: 1000 }
    )
  );

  // Turno actual: TablePosition o null cuando la ronda preflop ha concluido
  const [currentTurnPosition, setCurrentTurnPosition] = useState<TablePosition | null>(
    actionOrder[0] || heroPosition
  );
  const isHeroTurn = currentTurnPosition === heroPosition;
  const heroIndex = actionOrder.indexOf(heroPosition);
  const currentTurnIndex = currentTurnPosition ? actionOrder.indexOf(currentTurnPosition) : -1;

  // Estado general de la ronda
  const [roundStatus, setRoundStatus] = useState<BettingRoundStatus>({
    isRoundComplete: false,
    isHandOver: false,
    highestBet: activeSession?.blinds.bb || 1000,
    nextPositionToAct: actionOrder[0] || null,
    activePlayersCount: actionOrder.length
  });

  // Si cambia heroPosition en Paso 1, sincronizar únicamente la marca isHero sin reiniciar los asientos ni el turno
  useEffect(() => {
    setSeatStates((prev) => {
      let hasChanges = false;
      const updated = { ...prev };
      actionOrder.forEach((pos) => {
        const shouldBeHero = pos === heroPosition;
        if (updated[pos] && updated[pos].isHero !== shouldBeHero) {
          updated[pos] = { ...updated[pos], isHero: shouldBeHero };
          hasChanges = true;
        }
      });
      return hasChanges ? updated : prev;
    });
  }, [heroPosition, actionOrder]);

  if (!activeSession) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

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
      }
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
        stackAtStart={stackAtStart}
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
          /* PASO 1: Posición, Stack Opcional y Mano */
          <>
            {/* Barra compacta de Stack Actual (Opcional) */}
            <div className="bg-[#0B1420] border border-[#1E2E42] rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-sm">
              {typeof stackAtStart === 'number' && stackAtStart > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setIsStackModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-left active:scale-98 transition-all"
                  >
                    <Coins className="w-4 h-4 text-poker-emerald flex-shrink-0" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-extrabold text-poker-emerald">
                        ${stackAtStart.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400/80">
                        ({Number((stackAtStart / activeSession.blinds.bb).toFixed(1))} BB)
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        const step = activeSession.blinds.bb;
                        const next = Math.max(step, stackAtStart - step);
                        setStackAtStart(next);
                        setLastKnownStack(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#152234] hover:bg-[#1D2F47] active:scale-90 text-slate-200 flex items-center justify-center border border-[#243750]"
                      aria-label="Restar 1 BB al stack"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        const step = activeSession.blinds.bb;
                        const next = stackAtStart + step;
                        setStackAtStart(next);
                        setLastKnownStack(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-[#152234] hover:bg-[#1D2F47] active:scale-90 text-slate-200 flex items-center justify-center border border-[#243750]"
                      aria-label="Sumar 1 BB al stack"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setIsStackModalOpen(true);
                      }}
                      className="h-7 px-2 rounded-lg bg-[#152234] hover:bg-[#1D2F47] active:scale-95 text-[11px] font-bold text-slate-300 border border-[#243750]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setStackAtStart(undefined);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-800 active:scale-90 text-slate-400 hover:text-white flex items-center justify-center"
                      aria-label="Quitar stack de esta mano"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-300">
                      Mi stack <span className="text-[11px] font-normal text-slate-500">(opcional)</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setStackAtStart(lastKnownStack);
                      }}
                      className="h-7 px-2.5 rounded-lg bg-[#122230] hover:bg-[#182E40] active:scale-95 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                    >
                      Usar ${(lastKnownStack / 1000).toLocaleString('es-AR')}K
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setIsStackModalOpen(true);
                      }}
                      className="h-7 px-2.5 rounded-lg bg-[#162334] hover:bg-[#1E3046] active:scale-95 border border-[#253852] text-slate-200 text-xs font-bold transition-all"
                    >
                      Cargar $
                    </button>
                  </div>
                </>
              )}
            </div>

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

            <CustomNumberModal
              isOpen={isStackModalOpen}
              title="Mi Stack Actual"
              initialValue={stackAtStart || lastKnownStack}
              onConfirm={(val) => {
                setStackAtStart(val);
                setLastKnownStack(val);
              }}
              onClose={() => setIsStackModalOpen(false)}
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
