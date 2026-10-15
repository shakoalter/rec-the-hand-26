import { describe, it, expect } from 'vitest';
import { getPositionsForPlayerCount, getPreflopActionOrder } from './positionEngine';

describe('Poker Position Engine', () => {
  it('debe calcular correctamente las posiciones para una mesa de 9 jugadores', () => {
    const positions = getPositionsForPlayerCount(9);
    expect(positions).toEqual(['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO']);
  });

  it('debe calcular correctamente las posiciones para una mesa de 6 jugadores (6-max)', () => {
    const positions = getPositionsForPlayerCount(6);
    expect(positions).toEqual(['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO']);
  });

  it('debe manejar correctamente el caso Heads-Up (2 jugadores)', () => {
    const positions = getPositionsForPlayerCount(2);
    expect(positions).toEqual(['BTN', 'BB']);
  });

  it('debe ordenar la acción preflop comenzando por UTG en mesa de 9 jugadores', () => {
    const order = getPreflopActionOrder(9);
    expect(order[0]).toBe('UTG');
    expect(order[order.length - 1]).toBe('BB'); // BB cierra la acción preflop
  });

  it('debe ordenar la acción preflop en Heads-Up comenzando por BTN', () => {
    const order = getPreflopActionOrder(2);
    expect(order).toEqual(['BTN', 'BB']);
  });
});
