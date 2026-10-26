import { TablePosition, ActionType } from '../types/poker';

export interface BettingPlayerState {
  position: TablePosition;
  isHero: boolean;
  status: 'active' | 'folded' | 'allin';
  totalContributed: number; // Monto total aportado al pozo en esta calle
  hasActedInRound: boolean;  // Ha actuado al menos una vez en la calle
  actions: { actionType: ActionType; amount?: number }[];
}

export interface BettingRoundStatus {
  isRoundComplete: boolean;
  isHandOver: boolean;         // Solo queda 1 jugador activo (todos los demás foldearon)
  winnerPosition?: TablePosition;
  highestBet: number;
  nextPositionToAct: TablePosition | null;
  activePlayersCount: number;
}

export const bettingEngine = {
  /**
   * Inicializa los estados de los asientos al comienzo del preflop,
   * asignando las ciegas obligatorias (SB y BB).
   */
  initPreflopSeats(
    actionOrder: TablePosition[],
    heroPosition: TablePosition,
    blinds: { sb: number; bb: number }
  ): Record<TablePosition, BettingPlayerState> {
    const seats: Record<string, BettingPlayerState> = {};

    actionOrder.forEach((pos) => {
      let contributed = 0;
      if (pos === 'SB') contributed = blinds.sb;
      if (pos === 'BB') contributed = blinds.bb;

      seats[pos] = {
        position: pos,
        isHero: pos === heroPosition,
        status: 'active',
        totalContributed: contributed,
        hasActedInRound: false,
        actions: []
      };
    });

    return seats as Record<TablePosition, BettingPlayerState>;
  },

  /**
   * Aplica una acción a un jugador y actualiza su contribución y estado.
   */
  applyAction(
    currentSeats: Record<TablePosition, BettingPlayerState>,
    position: TablePosition,
    actionType: ActionType,
    amount: number | undefined,
    highestBet: number,
    bbAmount: number
  ): {
    updatedSeats: Record<TablePosition, BettingPlayerState>;
    newHighestBet: number;
  } {
    const player = { ...currentSeats[position] };
    let newHighest = highestBet;
    let finalAmount = amount;

    if (actionType === 'fold') {
      player.status = 'folded';
      player.hasActedInRound = true;
      player.actions = [...player.actions, { actionType: 'fold' }];
    } else if (actionType === 'check') {
      player.hasActedInRound = true;
      player.actions = [...player.actions, { actionType: 'check' }];
    } else if (actionType === 'limp') {
      player.totalContributed = bbAmount;
      player.hasActedInRound = true;
      finalAmount = bbAmount;
      player.actions = [...player.actions, { actionType: 'limp', amount: finalAmount }];
    } else if (actionType === 'call') {
      player.totalContributed = highestBet;
      player.hasActedInRound = true;
      finalAmount = highestBet;
      player.actions = [...player.actions, { actionType: 'call', amount: finalAmount }];
    } else if (
      actionType === 'raise' ||
      actionType === '3bet' ||
      actionType === '4bet' ||
      actionType === 'bet' ||
      actionType === 'allin'
    ) {
      finalAmount = amount || highestBet * 2;
      player.totalContributed = finalAmount;
      player.hasActedInRound = true;
      if (actionType === 'allin') {
        player.status = 'allin';
      }
      newHighest = Math.max(highestBet, finalAmount);
      player.actions = [...player.actions, { actionType, amount: finalAmount }];
    }

    return {
      updatedSeats: {
        ...currentSeats,
        [position]: player
      },
      newHighestBet: newHighest
    };
  },

  /**
   * Evalúa si la ronda ha terminado, si la mano terminó por abandono general,
   * y calcula qué posición actúa a continuación según el orden de mesa.
   */
  evaluateRound(
    actionOrder: TablePosition[],
    seats: Record<TablePosition, BettingPlayerState>,
    currentTurnPosition: TablePosition,
    highestBet: number
  ): BettingRoundStatus {
    const inHandSeats = actionOrder.map((pos) => seats[pos]).filter((s) => s && s.status !== 'folded');
    const activeSeats = inHandSeats.filter((s) => s.status === 'active');

    // 1. Si solo queda 1 jugador en la mano, todos los demás foldearon -> Mano terminada
    if (inHandSeats.length <= 1) {
      return {
        isRoundComplete: true,
        isHandOver: true,
        winnerPosition: inHandSeats[0]?.position,
        highestBet,
        nextPositionToAct: null,
        activePlayersCount: inHandSeats.length
      };
    }

    // 2. Verificar si todos los activos actuaron al menos una vez y todos igualaron la apuesta más alta
    const allActed = activeSeats.every((s) => s.hasActedInRound);
    const allMatched = activeSeats.every((s) => s.totalContributed === highestBet);

    if (allActed && allMatched) {
      return {
        isRoundComplete: true,
        isHandOver: false,
        highestBet,
        nextPositionToAct: null,
        activePlayersCount: inHandSeats.length
      };
    }

    // 3. Buscar el siguiente jugador en sentido horario que deba actuar
    const currentIndex = actionOrder.indexOf(currentTurnPosition);
    for (let i = 1; i <= actionOrder.length; i++) {
      const candidatePos = actionOrder[(currentIndex + i) % actionOrder.length];
      const candidate = seats[candidatePos];

      if (
        candidate &&
        candidate.status === 'active' &&
        (!candidate.hasActedInRound || candidate.totalContributed < highestBet)
      ) {
        return {
          isRoundComplete: false,
          isHandOver: false,
          highestBet,
          nextPositionToAct: candidatePos,
          activePlayersCount: inHandSeats.length
        };
      }
    }

    // Caso de cierre
    return {
      isRoundComplete: true,
      isHandOver: false,
      highestBet,
      nextPositionToAct: null,
      activePlayersCount: inHandSeats.length
    };
  }
};
