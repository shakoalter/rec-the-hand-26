import { describe, it, expect, beforeEach } from 'vitest';
import { useHandStore } from './handStore';

describe('useHandStore', () => {
  beforeEach(() => {
    useHandStore.setState({
      sessionId: 'test-session-123',
      handNumber: 1,
      currentStep: 1,
      currentStreet: 'preflop',
      heroPosition: 'BTN',
      heroCards: [],
      preflopActions: [],
      flopCards: [],
      flopActions: [],
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

  it('debe permitir añadir hasta 3 cartas al flop y bloquear duplicadas con Hero', () => {
    const store = useHandStore.getState();
    store.addCard({ rank: 'A', suit: 'spades' });
    store.addCard({ rank: 'K', suit: 'hearts' });

    // Intentar agregar A♠ al flop debe ser bloqueado por colisión
    store.addFlopCard({ rank: 'A', suit: 'spades' });
    expect(useHandStore.getState().flopCards).toHaveLength(0);

    // Agregar cartas válidas al flop
    store.addFlopCard({ rank: 'Q', suit: 'hearts' });
    store.addFlopCard({ rank: '7', suit: 'spades' });
    store.addFlopCard({ rank: '8', suit: 'diamonds' });
    expect(useHandStore.getState().flopCards).toHaveLength(3);

    // Intentar agregar una 4ta carta al flop debe ser ignorado
    store.addFlopCard({ rank: '2', suit: 'clubs' });
    expect(useHandStore.getState().flopCards).toHaveLength(3);
  });

  it('debe calcular los jugadores activos filtrando los que foldearon preflop', () => {
    const store = useHandStore.getState();
    store.addPreflopAction('UTG', false, 'limp');
    store.addPreflopAction('UTG+1', false, 'fold');
    store.addPreflopAction('MP', false, 'fold');
    store.addPreflopAction('BTN', true, 'call');

    const allPositions = ['UTG', 'UTG+1', 'MP', 'BTN'];
    const active = store.getActivePlayersForFlop(allPositions as any);
    expect(active).toEqual(['UTG', 'BTN']);
  });

  it('debe dejar stackAtStart como undefined por defecto al iniciar mano y permitir asignarlo o limpiarlo opcionalmente', async () => {
    const store = useHandStore.getState();
    await store.initHand('session-1', 50000, 'CO');
    expect(useHandStore.getState().stackAtStart).toBeUndefined();

    store.setStackAtStart(62000);
    expect(useHandStore.getState().stackAtStart).toBe(62000);

    store.resetHand();
    expect(useHandStore.getState().stackAtStart).toBeUndefined();
  });
});
