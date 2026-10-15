import { create } from 'zustand';
import { Card, TablePosition, PlayerAction, ActionType } from '../types/poker';
import { RecordedHand } from '../types/session';
import { sessionRepository } from '../db/sessionRepository';

interface HandState {
  sessionId: string | null;
  handNumber: number;
  currentStep: 1 | 2; // Paso 1: Posición y Mano, Paso 2: Acción Preflop
  heroPosition: TablePosition;
  dealerPosition: TablePosition;
  heroCards: Card[];
  preflopActions: PlayerAction[];
  stackAtStart: number;

  // Acciones
  initHand: (sessionId: string, currentStack: number, defaultHeroPos?: TablePosition) => Promise<void>;
  setStep: (step: 1 | 2) => void;
  setHeroPosition: (pos: TablePosition) => void;
  setDealerPosition: (pos: TablePosition) => void;
  addCard: (card: Card) => void;
  removeCard: (index: number) => void;
  clearCards: () => void;
  addPreflopAction: (position: TablePosition, isHero: boolean, actionType: ActionType, amount?: number) => void;
  clearPreflopActions: () => void;
  saveHand: (notes?: string) => Promise<RecordedHand>;
  resetHand: () => void;
}

export const useHandStore = create<HandState>((set, get) => ({
  sessionId: null,
  handNumber: 1,
  currentStep: 1,
  heroPosition: 'BTN',
  dealerPosition: 'BTN',
  heroCards: [],
  preflopActions: [],
  stackAtStart: 50000,

  initHand: async (sessionId, currentStack, defaultHeroPos = 'BTN') => {
    const existingHands = await sessionRepository.getHandsBySession(sessionId);
    const nextHandNumber = existingHands.length + 1;

    set({
      sessionId,
      handNumber: nextHandNumber,
      currentStep: 1,
      heroPosition: defaultHeroPos,
      dealerPosition: 'BTN',
      heroCards: [],
      preflopActions: [],
      stackAtStart: currentStack,
    });
  },

  setStep: (step) => set({ currentStep: step }),

  setHeroPosition: (pos) => set({ heroPosition: pos }),

  setDealerPosition: (pos) => set({ dealerPosition: pos }),

  addCard: (card) => {
    const { heroCards } = get();
    if (heroCards.length >= 2) return;
    // Evitar cartas duplicadas
    const exists = heroCards.some((c) => c.rank === card.rank && c.suit === card.suit);
    if (!exists) {
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

  saveHand: async (notes) => {
    const state = get();
    if (!state.sessionId) throw new Error('No hay sesión activa para guardar la mano');

    const heroFolded = state.preflopActions.some((a) => a.isHero && a.actionType === 'fold');

    const hand: RecordedHand = {
      id: crypto.randomUUID ? crypto.randomUUID() : `hand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: state.sessionId,
      handNumber: state.handNumber,
      createdAt: Date.now(),
      heroPosition: state.heroPosition,
      heroCards: state.heroCards.length === 2 ? [state.heroCards[0], state.heroCards[1]] : undefined,
      stackAtStart: state.stackAtStart,
      preflopActions: state.preflopActions,
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
      heroCards: [],
      preflopActions: []
    }));
  }
}));
