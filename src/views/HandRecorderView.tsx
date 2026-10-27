import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Coins, Edit3, Minus, Plus, X, Lock } from 'lucide-react';
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
import { cn } from '../utils/cn';

interface HandRecorderViewProps {
  onBackToSession: () => void;
}

const STREETS: { id: HandStreet; label: string; disabled?: boolean }[] = [
  { id: 'preflop', label: 'PREFLOP' },
  { id: 'flop', label: 'FLOP' },
  { id: 'turn', label: 'TURN', disabled: true },
  { id: 'river', label: 'RIVER', disabled: true }
];

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

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
    clearFlopActions,
    isCardInUse,
    getActivePlayersForFlop,
    saveHand,
    resetHand
  } = useHandStore();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  const [isCustomRaiseModalOpen, setIsCustomRaiseModalOpen] = useState(false);
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

  // Cantidad de subidas preflop para etiquetar Raise / 3-Bet / 4-Bet
  const preflopRaiseCount = useMemo(
    () =>
      preflopActions.filter(
        (a) =>
          a.actionType === 'raise' ||
          a.actionType === '3bet' ||
          a.actionType === '4bet' ||
          a.actionType === 'allin'
      ).length,
    [preflopActions]
  );

  // Pozo estimado en mesa preflop
  const estimatedPot = useMemo(() => {
    return Object.values(seatStates).reduce((sum, s) => sum + (s?.totalContributed || 0), 0);
  }, [seatStates]);

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
      setCurrentTurnPosition(null);
    } else {
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

  const stepLabel =
    currentStep === 1
      ? 'Paso 1/3 · Posición y Mano'
      : currentStep === 2
        ? 'Paso 2/3 · Preflop'
        : 'Paso 3/3 · Postflop';

  return (
    <div className="relative app-shell bg-[#070C12] text-white w-full max-w-md mx-auto px-2.5 xs:px-3.5 sm:px-4 pt-safe pb-safe">
      {/* Toast de confirmación de mano guardada */}
      {savedSuccess && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 border border-emerald-400 text-white font-bold py-2.5 px-5 rounded-2xl shadow-neon-emerald flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span>¡Mano #{handNumber} guardada con éxito!</span>
        </div>
      )}

      {/* Encabezado Compacto con Indicador de Paso y Acceso Rápido a Revisión */}
      <header className="shrink-0 flex items-center justify-between py-2 border-b border-slate-800/80">
        <button
          type="button"
          onClick={handlePrevStep}
          className="w-10 h-10 rounded-xl bg-[#111C2A] border border-[#223348] flex items-center justify-center text-slate-200 hover:text-white active:scale-90 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">
            Mano #{handNumber}
          </h1>
          <span className="text-[11px] font-semibold text-slate-400 block">
            {stepLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setStep(4);
          }}
          className="h-10 px-3 rounded-xl bg-[#111C2A] border border-[#223348] text-xs font-bold text-slate-300 hover:text-white active:scale-95 transition-all flex items-center justify-center"
        >
          Revisar
        </button>
      </header>

      {/* Barra de Contexto Inteligente en Paso 2 y Paso 3 */}
      {currentStep >= 2 && (
        <div className="shrink-0 flex items-center justify-between gap-2 py-1.5 border-b border-slate-800/60 text-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setStep(1);
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-xl bg-[#0D231A] border border-poker-emerald/60 text-poker-emerald font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            title="Tocar para cambiar posición o cartas de Hero"
          >
            <span>Hero: {heroPosition}</span>
            {heroCards.length > 0 ? (
              <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 font-black text-[11px]">
                {heroCards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit] || ''}`).join(' ')}
              </span>
            ) : (
              <span className="text-[11px] text-emerald-300/70 font-normal">(Sin cartas)</span>
            )}
          </button>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
            <span className="px-2 py-1 rounded-lg bg-[#101A28] border border-[#1E2E42]">
              Pozo: <strong className="text-white">${estimatedPot.toLocaleString('es-AR')}</strong>
            </span>
            {currentStep === 2 && (
              <span className="px-2 py-1 rounded-lg bg-[#101A28] border border-[#1E2E42]">
                Apuesta: <strong className="text-poker-emerald">${currentHighestBet.toLocaleString('es-AR')}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 min-h-0 flex flex-col gap-2 py-1.5 overflow-y-auto no-scrollbar">
        {currentStep === 1 && (
          /* PASO 1: Posición, Stack Opcional y Mano */
          <>
            {/* Barra Ergonómica de Stack Actual (Opcional, botones >= 36x36px) */}
            <div className="bg-[#0B1420] border border-[#1E2E42] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm">
              {typeof stackAtStart === 'number' && stackAtStart > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setIsStackModalOpen(true);
                    }}
                    className="min-h-[36px] min-w-0 flex items-center gap-1.5 xs:gap-2 text-left active:scale-98 transition-all px-1.5 py-1 -ml-1 rounded-lg hover:bg-slate-800/60"
                    aria-label="Editar stack actual"
                    title="Tocá el monto para editar el stack"
                  >
                    <Coins className="w-4 h-4 text-poker-emerald flex-shrink-0" />
                    <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-extrabold text-poker-emerald whitespace-nowrap">
                        ${stackAtStart.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400/80 whitespace-nowrap">
                        ({Number((stackAtStart / activeSession.blinds.bb).toFixed(1))} BB)
                      </span>
                    </div>
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400/80 flex-shrink-0" />
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        const step = activeSession.blinds.bb;
                        const next = Math.max(step, stackAtStart - step);
                        setStackAtStart(next);
                        setLastKnownStack(next);
                      }}
                      className="w-9 h-9 rounded-lg bg-[#152234] hover:bg-[#1D2F47] active:scale-90 text-slate-200 flex items-center justify-center border border-[#243750]"
                      aria-label="Restar 1 BB al stack"
                    >
                      <Minus className="w-4 h-4" />
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
                      className="w-9 h-9 rounded-lg bg-[#152234] hover:bg-[#1D2F47] active:scale-90 text-slate-200 flex items-center justify-center border border-[#243750]"
                      aria-label="Sumar 1 BB al stack"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setStackAtStart(undefined);
                      }}
                      className="w-9 h-9 rounded-lg bg-slate-800/70 hover:bg-slate-800 active:scale-90 text-slate-300 hover:text-white flex items-center justify-center"
                      aria-label="Quitar stack de esta mano"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-300">
                      Mi stack <span className="text-[11px] font-normal text-slate-400">(opcional)</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setStackAtStart(lastKnownStack);
                      }}
                      className="h-9 px-3 rounded-lg bg-[#122230] hover:bg-[#182E40] active:scale-95 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                    >
                      Usar ${(lastKnownStack / 1000).toLocaleString('es-AR')}K
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setIsStackModalOpen(true);
                      }}
                      className="h-9 px-3 rounded-lg bg-[#162334] hover:bg-[#1E3046] active:scale-95 border border-[#253852] text-slate-200 text-xs font-bold transition-all"
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
              heroCards={heroCards}
              onSelectHeroPosition={setHeroPosition}
              onRemoveHeroCard={removeCard}
            />

            <CardSelector
              cards={heroCards}
              onAddCard={addCard}
              onRemoveCard={removeCard}
              onClear={clearCards}
              maxCards={2}
              label="Tu mano"
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
          /* PASO 2: Acción Preflop por turnos (Modelo 3 Híbrido Compacto) */
          <div className="flex flex-col gap-2">
            <PreflopActionTimeline
              positions={actionOrder}
              heroPosition={heroPosition}
              currentTurnPosition={currentTurnPosition}
              seatStates={seatStates}
              highestBet={currentHighestBet}
              onSelectTurn={(pos) => {
                setCurrentTurnPosition(pos);
              }}
            />

            <CustomNumberModal
              isOpen={isCustomRaiseModalOpen}
              title="Monto de Subida Preflop"
              initialValue={raiseAmount}
              onConfirm={(val) => {
                setRaiseAmount(Math.max(activeSession.blinds.bb * 2, val));
              }}
              onClose={() => setIsCustomRaiseModalOpen(false)}
            />
          </div>
        )}

        {currentStep === 3 && (
          /* PASO 3: Flop Comunitario y Acciones */
          <>
            {/* Jugadores activos en el Flop + Street Tabs Honestos */}
            <div className="flex items-center justify-between gap-2 bg-[#0B131E] border border-[#1A293D] rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">
                Al Flop ({activePlayers.length}):
              </span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {activePlayers.map((pos) => (
                  <span
                    key={pos}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-bold border flex-shrink-0',
                      pos === heroPosition
                        ? 'bg-emerald-950/90 border-emerald-500/80 text-poker-emerald'
                        : 'bg-[#121E2C] border-[#223348] text-slate-300'
                    )}
                  >
                    {pos === heroPosition ? `HERO (${pos})` : pos}
                  </span>
                ))}
              </div>
            </div>

            {/* Street Tabs (Turn y River deshabilitados honestamente con indicador Próx.) */}
            <div className="grid grid-cols-4 gap-1.5 bg-[#0C1522] p-1 rounded-xl border border-[#1A293D]">
              {STREETS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  disabled={st.disabled}
                  onClick={() => {
                    if (st.disabled) return;
                    triggerHaptic();
                    if (st.id === 'preflop') setStep(2);
                    setStreet(st.id);
                  }}
                  className={cn(
                    'py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1',
                    st.disabled
                      ? 'text-slate-600 cursor-not-allowed opacity-50'
                      : currentStreet === st.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                  )}
                >
                  <span>{st.label}</span>
                  {st.disabled && <Lock className="w-3 h-3 text-slate-600" />}
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
              flopActions={flopActions}
              onHeroAction={handleHeroFlopAction}
              onClearFlopActions={clearFlopActions}
            />
          </>
        )}
      </main>

      {/* Zona Inferior Anclada */}
      <footer className="shrink-0 pt-1 pb-0.5">
        {currentStep === 1 && (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2 transition-all"
          >
            <span>Siguiente: Preflop</span>
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
                raiseCount={preflopRaiseCount}
                onActionSelect={handleActionSelect}
                onRaiseAmountChange={setRaiseAmount}
                onOpenCustomRaiseModal={() => setIsCustomRaiseModalOpen(true)}
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
                  <span className="text-slate-300">
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
      </footer>
    </div>
  );
};
