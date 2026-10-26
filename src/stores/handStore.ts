import { create } from 'zustand';
import { Card, TablePosition, PlayerAction, ActionType, HandStreet } from '../types/poker';
import { RecordedHand } from '../types/session';
import { sessionRepository } from '../db/sessionRepository';

interface HandState {
  sessionId: string | null;
  handNumber: number;
  currentStep: 1 | 2 | 3 | 4; // 1: Posición y Mano, 2: Acción Preflop, 3: Flop, 4: Revisar Mano
  currentStreet: HandStreet;
  heroPosition: TablePosition;
  dealerPosition: TablePosition;
  heroCards: Card[];
  preflopActions: PlayerAction[];
  flopCards: Card[];
  flopActions: PlayerAction[];
  stackAtStart: number | undefined;

  // Acciones
  initHand: (sessionId: string, currentStack?: number, defaultHeroPos?: TablePosition) => Promise<void>;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setStreet: (street: HandStreet) => void;
  setHeroPosition: (pos: TablePosition) => void;
  setDealerPosition: (pos: TablePosition) => void;
  setStackAtStart: (stack: number | undefined) => void;
  addCard: (card: Card) => void;
  removeCard: (index: number) => void;
  clearCards: () => void;
  addPreflopAction: (position: TablePosition, isHero: boolean, actionType: ActionType, amount?: number) => void;
  clearPreflopActions: () => void;

  // Flop
  addFlopCard: (card: Card) => void;
  removeFlopCard: (index: number) => void;
  clearFlopCards: () => void;
  addFlopAction: (position: TablePosition, isHero: boolean, actionType: ActionType, amount?: number) => void;
  clearFlopActions: () => void;

  isCardInUse: (card: Card) => boolean;
  getActivePlayersForFlop: (allPositions: TablePosition[]) => TablePosition[];
  saveHand: (notes?: string) => Promise<RecordedHand>;
  resetHand: () => void;
}

export const useHandStore = create<HandState>((set, get) => ({
  sessionId: null,
  handNumber: 1,
  currentStep: 1,
  currentStreet: 'preflop',
  heroPosition: 'BTN',
  dealerPosition: 'BTN',
  heroCards: [],
  preflopActions: [],
  flopCards: [],
  flopActions: [],
  stackAtStart: undefined,

  initHand: async (sessionId, _currentStack, defaultHeroPos = 'BTN') => {
    let nextHandNumber = 1;
    try {
      const existingHands = await sessionRepository.getHandsBySession(sessionId);
      nextHandNumber = existingHands.length + 1;
    } catch {
      nextHandNumber = 1;
    }

    set({
      sessionId,
      handNumber: nextHandNumber,
      currentStep: 1,
      currentStreet: 'preflop',
      heroPosition: defaultHeroPos,
      dealerPosition: 'BTN',
      heroCards: [],
      preflopActions: [],
      flopCards: [],
      flopActions: [],
      stackAtStart: undefined,
    });
  },

  setStep: (step) => set({ currentStep: step }),

  setStreet: (street) => set({ currentStreet: street }),

  setHeroPosition: (pos) => set({ heroPosition: pos }),

  setDealerPosition: (pos) => set({ dealerPosition: pos }),

  setStackAtStart: (stack) => set({ stackAtStart: stack }),

  addCard: (card) => {
    const { heroCards, flopCards } = get();
    if (heroCards.length >= 2) return;
    const inUse = [...heroCards, ...flopCards].some(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
    if (!inUse) {
      set({ heroCards: [...heroCards, card] });
    }
  },

  removeCard: (index) => {
    const { heroCards } = get();
    set({ heroCards: heroCards.filter((_, i) => i !== index) });
  },

  clearCards: () => set({ heroCards: [] }),

  addPreflopAction: (position, isHero, actionType, amount) => {
    const newAction: PlayerAction = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      position,
      isHero,
      actionType,
      amount,
      timestamp: Date.now()
    };
    set((state) => ({
      preflopActions: [...state.preflopActions, newAction]
    }));
  },

  clearPreflopActions: () => set({ preflopActions: [] }),

  // Flop methods
  addFlopCard: (card) => {
    const { heroCards, flopCards } = get();
    if (flopCards.length >= 3) return;
    const inUse = [...heroCards, ...flopCards].some(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
    if (!inUse) {
      set({ flopCards: [...flopCards, card] });
    }
  },

  removeFlopCard: (index) => {
    const { flopCards } = get();
    set({ flopCards: flopCards.filter((_, i) => i !== index) });
  },

  clearFlopCards: () => set({ flopCards: [] }),

  addFlopAction: (position, isHero, actionType, amount) => {
    const newAction: PlayerAction = {
      id: crypto.randomUUID ? crypto.randomUUID() : `flop_act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      position,
      isHero,
      actionType,
      amount,
      timestamp: Date.now()
    };
    set((state) => ({
      flopActions: [...state.flopActions, newAction]
    }));
  },

  clearFlopActions: () => set({ flopActions: [] }),

  isCardInUse: (card) => {
    const { heroCards, flopCards } = get();
    return [...heroCards, ...flopCards].some(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
  },

  getActivePlayersForFlop: (allPositions) => {
    const { preflopActions } = get();
    const foldedPositions = new Set(
      preflopActions.filter((a) => a.actionType === 'fold').map((a) => a.position)
    );
    return allPositions.filter((pos) => !foldedPositions.has(pos));
  },

  saveHand: async (notes) => {
    const state = get();
    if (!state.sessionId) throw new Error('No hay sesión activa para guardar la mano');

    const heroFolded = state.preflopActions.some((a) => a.isHero && a.actionType === 'fold') ||
      state.flopActions.some((a) => a.isHero && a.actionType === 'fold');

    const hand: RecordedHand = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: state.sessionId,
      handNumber: state.handNumber,
      createdAt: Date.now(),
      heroPosition: state.heroPosition,
      heroCards: state.heroCards.length === 2 ? [state.heroCards[0], state.heroCards[1]] : undefined,
      stackAtStart: state.stackAtStart,
      preflopActions: state.preflopActions,
      flopCards: state.flopCards.length === 3 ? [state.flopCards[0], state.flopCards[1], state.flopCards[2]] : undefined,
      flopActions: state.flopActions.length > 0 ? state.flopActions : undefined,
      isQuickMode: true,
      isComplete: state.preflopActions.length > 0,
      isEstimated: false,
      wasHeroFoldPreflop: heroFolded,
      notes
    };

    await sessionRepository.saveHand(hand);
    return hand;
  },

  resetHand: () => {
    set((state) => ({
      handNumber: state.handNumber + 1,
      currentStep: 1,
      currentStreet: 'preflop',
      heroCards: [],
      preflopActions: [],
      flopCards: [],
      flopActions: [],
      stackAtStart: undefined
    }));
  }
}));
