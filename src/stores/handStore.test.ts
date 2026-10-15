import { describe, it, expect, beforeEach } from 'vitest';
import { useHandStore } from './handStore';

describe('useHandStore', () => {
  beforeEach(() => {
    useHandStore.setState({
      sessionId: 'test-session-123',
      handNumber: 1,
      currentStep: 1,
      heroPosition: 'BTN',
      heroCards: [],
      preflopActions: [],
      stackAtStart: 50000
    });
  });

  it('debe permitir añadir hasta 2 cartas a la mano de Hero', () => {
    const store = useHandStore.getState();
    store.addCard({ rank: 'A', suit: 'spades' });
    store.addCard({ rank: 'K', suit: 'hearts' });
    expect(useHandStore.getState().heroCards).toHaveLength(2);

    // Intentar agregar una 3ra carta debe ser ignorado
    store.addCard({ rank: 'Q', suit: 'diamonds' });
    expect(useHandStore.getState().heroCards).toHaveLength(2);
  });

  it('no debe permitir cartas duplicadas en la misma mano', () => {
    const store = useHandStore.getState();
    store.addCard({ rank: 'A', suit: 'spades' });
    store.addCard({ rank: 'A', suit: 'spades' });
    expect(useHandStore.getState().heroCards).toHaveLength(1);
  });

  it('debe permitir remover cartas y limpiar la mano', () => {
    const store = useHandStore.getState();
    store.addCard({ rank: 'A', suit: 'spades' });
    store.addCard({ rank: 'K', suit: 'hearts' });
    store.removeCard(0);
    expect(useHandStore.getState().heroCards).toHaveLength(1);
    expect(useHandStore.getState().heroCards[0].rank).toBe('K');

    store.clearCards();
    expect(useHandStore.getState().heroCards).toHaveLength(0);
  });

  it('debe registrar acciones preflop con orden y montos', () => {
    const store = useHandStore.getState();
    store.addPreflopAction('UTG', false, 'limp', 1000);
    store.addPreflopAction('BTN', true, 'raise', 4000);

    const actions = useHandStore.getState().preflopActions;
    expect(actions).toHaveLength(2);
    expect(actions[0].actionType).toBe('limp');
    expect(actions[1].isHero).toBe(true);
    expect(actions[1].amount).toBe(4000);
  });
});
