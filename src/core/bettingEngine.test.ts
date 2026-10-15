import { describe, it, expect } from 'vitest';
import { bettingEngine } from './bettingEngine';
import { TablePosition } from '../types/poker';

describe('Betting Engine - Reglas de Apuestas de Texas Holdem', () => {
  const actionOrder: TablePosition[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const blinds = { sb: 1000, bb: 1000 };

  it('debe reabrir la acción y devolver el turno al villano tras una 3-Bet de Hero', () => {
    let seats = bettingEngine.initPreflopSeats(actionOrder, 'BTN', blinds);
    let highestBet = 1000;

    // 1. UTG foldea
    let res = bettingEngine.applyAction(seats, 'UTG', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    // 2. UTG+1 sube a 3.000 (Open-Raise)
    res = bettingEngine.applyAction(seats, 'UTG+1', 'raise', 3000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;
    expect(highestBet).toBe(3000);

    // 3. Folds hasta Hero (UTG+2, MP, HJ, CO foldean)
    ['UTG+2', 'MP', 'HJ', 'CO'].forEach((pos) => {
      res = bettingEngine.applyAction(seats, pos as TablePosition, 'fold', undefined, highestBet, 1000);
      seats = res.updatedSeats;
    });

    // 4. Hero en BTN hace 3-Bet a 6.000
    res = bettingEngine.applyAction(seats, 'BTN', 'raise', 6000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;
    expect(highestBet).toBe(6000);

    // 5. SB y BB foldean ante el 3-Bet
    res = bettingEngine.applyAction(seats, 'SB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;
    res = bettingEngine.applyAction(seats, 'BB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    // EVALUACIÓN CRÍTICA: La ronda NO debe terminar; debe volver obligatoriamente a UTG+1
    const evalStatus = bettingEngine.evaluateRound(actionOrder, seats, 'BB', highestBet);
    expect(evalStatus.isRoundComplete).toBe(false);
    expect(evalStatus.nextPositionToAct).toBe('UTG+1');

    // 6. UTG+1 paga (Call 6.000)
    res = bettingEngine.applyAction(seats, 'UTG+1', 'call', 6000, highestBet, 1000);
    seats = res.updatedSeats;

    // Ahora ambos pusieron 6.000: la ronda preflop debe completarse
    const finalEval = bettingEngine.evaluateRound(actionOrder, seats, 'UTG+1', highestBet);
    expect(finalEval.isRoundComplete).toBe(true);
    expect(finalEval.isHandOver).toBe(false);
    expect(finalEval.activePlayersCount).toBe(2); // UTG+1 y Hero van al Flop
  });

  it('debe terminar la mano inmediatamente si todos los rivales foldean ante la subida de Hero', () => {
    let seats = bettingEngine.initPreflopSeats(actionOrder, 'BTN', blinds);
    let highestBet = 1000;

    // Todos foldean hasta BTN (Hero)
    ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'].forEach((pos) => {
      const r = bettingEngine.applyAction(seats, pos as TablePosition, 'fold', undefined, highestBet, 1000);
      seats = r.updatedSeats;
    });

    // Hero sube a 3.000
    let res = bettingEngine.applyAction(seats, 'BTN', 'raise', 3000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;

    // SB y BB foldean
    res = bettingEngine.applyAction(seats, 'SB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;
    res = bettingEngine.applyAction(seats, 'BB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    const evalStatus = bettingEngine.evaluateRound(actionOrder, seats, 'BB', highestBet);
    expect(evalStatus.isRoundComplete).toBe(true);
    expect(evalStatus.isHandOver).toBe(true); // Mano ganada preflop
    expect(evalStatus.winnerPosition).toBe('BTN');
  });

  it('debe devolver el turno a BB si BB abrió/subió, Hero en BTN hace 3-bet a 6.000 y SB foldea', () => {
    let seats = bettingEngine.initPreflopSeats(actionOrder, 'BTN', blinds);
    let highestBet = 1000;

    // Supongamos que foldean hasta BTN, Hero sube a 3.000, SB foldea, pero BB sube a 6.000 (3-bet de BB)
    // O el caso del usuario: BB o un jugador previo sube, folds hasta Hero, Hero resube a 6.000, SB fold -> Turno a BB
    // Simulamos: todos foldean hasta BTN (Hero), Hero raise 3.000, SB fold, BB raise 6.000 -> vuelve a Hero!
    let res = bettingEngine.applyAction(seats, 'UTG', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;
    ['UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'].forEach((pos) => {
      res = bettingEngine.applyAction(seats, pos as TablePosition, 'fold', undefined, highestBet, 1000);
      seats = res.updatedSeats;
    });

    // Hero en BTN sube a 3.000
    res = bettingEngine.applyAction(seats, 'BTN', 'raise', 3000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;

    // SB foldea
    res = bettingEngine.applyAction(seats, 'SB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    // BB resube a 9.000 (3-bet de BB)
    res = bettingEngine.applyAction(seats, 'BB', 'raise', 9000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;

    // El turno debe volver obligatoriamente a BTN (Hero)
    const evalStatus = bettingEngine.evaluateRound(actionOrder, seats, 'BB', highestBet);
    expect(evalStatus.isRoundComplete).toBe(false);
    expect(evalStatus.nextPositionToAct).toBe('BTN');

    // Hero hace 4-bet a 20.000
    res = bettingEngine.applyAction(seats, 'BTN', 'raise', 20000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = res.newHighestBet;

    // Ahora SB ya foldeó, el turno debe volver a BB
    const evalAfter4bet = bettingEngine.evaluateRound(actionOrder, seats, 'BTN', highestBet);
    expect(evalAfter4bet.isRoundComplete).toBe(false);
    expect(evalAfter4bet.nextPositionToAct).toBe('BB');

    // BB foldea -> Hero gana la mano
    res = bettingEngine.applyAction(seats, 'BB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    const evalFinal = bettingEngine.evaluateRound(actionOrder, seats, 'BB', highestBet);
    expect(evalFinal.isRoundComplete).toBe(true);
    expect(evalFinal.isHandOver).toBe(true);
    expect(evalFinal.winnerPosition).toBe('BTN');
  });

  it('debe resolver ordenadamente un pozo multi-way de 3 jugadores con 3-Bet y llamadas sucesivas', () => {
    let seats = bettingEngine.initPreflopSeats(actionOrder, 'BTN', blinds);
    let highestBet = 1000;

    // UTG raise 3.000
    let res = bettingEngine.applyAction(seats, 'UTG', 'raise', 3000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = 3000;

    // MP paga (Call 3.000)
    res = bettingEngine.applyAction(seats, 'MP', 'call', 3000, highestBet, 1000);
    seats = res.updatedSeats;

    // Folds los demás hasta Hero en BTN
    ['UTG+1', 'UTG+2', 'HJ', 'CO'].forEach((pos) => {
      res = bettingEngine.applyAction(seats, pos as TablePosition, 'fold', undefined, highestBet, 1000);
      seats = res.updatedSeats;
    });

    // Hero en BTN hace 3-bet a 9.000
    res = bettingEngine.applyAction(seats, 'BTN', 'raise', 9000, highestBet, 1000);
    seats = res.updatedSeats;
    highestBet = 9000;

    // SB y BB foldean
    res = bettingEngine.applyAction(seats, 'SB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;
    res = bettingEngine.applyAction(seats, 'BB', 'fold', undefined, highestBet, 1000);
    seats = res.updatedSeats;

    // Turno debe regresar a UTG primero
    let roundEval = bettingEngine.evaluateRound(actionOrder, seats, 'BB', highestBet);
    expect(roundEval.isRoundComplete).toBe(false);
    expect(roundEval.nextPositionToAct).toBe('UTG');

    // UTG paga los 9.000
    res = bettingEngine.applyAction(seats, 'UTG', 'call', 9000, highestBet, 1000);
    seats = res.updatedSeats;

    // Ahora falta MP por igualar los 9.000 -> Turno debe ir a MP
    roundEval = bettingEngine.evaluateRound(actionOrder, seats, 'UTG', highestBet);
    expect(roundEval.isRoundComplete).toBe(false);
    expect(roundEval.nextPositionToAct).toBe('MP');

    // MP paga los 9.000
    res = bettingEngine.applyAction(seats, 'MP', 'call', 9000, highestBet, 1000);
    seats = res.updatedSeats;

    // Ahora UTG (9.000), MP (9.000) y BTN (9.000) igualaron la apuesta -> Ronda preflop completada
    roundEval = bettingEngine.evaluateRound(actionOrder, seats, 'MP', highestBet);
    expect(roundEval.isRoundComplete).toBe(true);
    expect(roundEval.isHandOver).toBe(false);
    expect(roundEval.activePlayersCount).toBe(3);
  });
});
