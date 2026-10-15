import { TablePosition } from '../types/poker';

export const getPositionsForPlayerCount = (playerCount: number): TablePosition[] => {
  switch (playerCount) {
    case 2:
      // En Heads-up: BTN es también SB y actúa primero preflop.
      return ['BTN', 'BB'];
    case 3:
      return ['BTN', 'SB', 'BB'];
    case 4:
      return ['BTN', 'SB', 'BB', 'CO'];
    case 5:
      return ['BTN', 'SB', 'BB', 'UTG', 'CO'];
    case 6:
      return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];
    case 7:
      return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']; // 7-max
    case 8:
      return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'];
    case 9:
    default:
      return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'];
  }
};

/**
 * Orden de acción preflop estándar en Texas Hold'em:
 * Comienza el jugador a la izquierda de la BB (UTG), y el último en actuar es la BB (salvo que haya subidas).
 */
export const getPreflopActionOrder = (playerCount: number): TablePosition[] => {
  if (playerCount === 2) {
    return ['BTN', 'BB']; // BTN/SB actúa primero preflop
  }
  const allPositions = getPositionsForPlayerCount(playerCount);
  // Reordenar para que comience en UTG (o la primera posición después de BB)
  const bbIndex = allPositions.indexOf('BB');
  const order: TablePosition[] = [];
  for (let i = 1; i <= allPositions.length; i++) {
    order.push(allPositions[(bbIndex + i) % allPositions.length]);
  }
  return order;
};
