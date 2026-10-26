import { describe, it, expect } from 'vitest';
import { exportUtils } from './exportUtils';
import { SessionConfig, RecordedHand } from '../types/session';

describe('exportUtils - Sistema de Exportación (WhatsApp, CSV, JSON)', () => {
  const baseSession: SessionConfig = {
    id: 'sess-123',
    createdAt: new Date(2026, 9, 26, 11, 34, 0).getTime(), // 26/10/2026 11:34
    status: 'active',
    initialStack: 50000,
    currentStack: 50000,
    blinds: { sb: 1000, bb: 1000 },
    playerCount: 9,
    straddle: { enabled: false },
    rake: { enabled: false }
  };

  const exampleHandCO: RecordedHand = {
    id: 'hand-1',
    sessionId: 'sess-123',
    handNumber: 1,
    createdAt: new Date(2026, 9, 26, 11, 35, 0).getTime(),
    heroPosition: 'CO',
    heroCards: [
      { rank: 'A', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' }
    ],
    stackAtStart: 50000,
    preflopActions: [
      { id: '1', position: 'UTG', isHero: false, actionType: 'fold', timestamp: 1 },
      { id: '2', position: 'UTG+1', isHero: false, actionType: 'fold', timestamp: 2 },
      { id: '3', position: 'UTG+2', isHero: false, actionType: 'fold', timestamp: 3 },
      { id: '4', position: 'MP', isHero: false, actionType: 'fold', timestamp: 4 },
      { id: '5', position: 'HJ', isHero: false, actionType: 'fold', timestamp: 5 },
      { id: '6', position: 'CO', isHero: true, actionType: 'raise', amount: 3000, timestamp: 6 },
      { id: '7', position: 'BTN', isHero: false, actionType: 'call', amount: 3000, timestamp: 7 },
      { id: '8', position: 'SB', isHero: false, actionType: 'fold', timestamp: 8 },
      { id: '9', position: 'BB', isHero: false, actionType: 'call', amount: 3000, timestamp: 9 }
    ],
    isQuickMode: true,
    isComplete: true,
    isEstimated: false,
    wasHeroFoldPreflop: false
  };

  it('debe conservar intactos los formatos de exportación JSON y CSV (Regresión)', () => {
    const jsonStr = exportUtils.formatSessionAsJson(baseSession, [exampleHandCO]);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.app).toBe('RecTheHand');
    expect(parsed.session.id).toBe('sess-123');
    expect(parsed.hands).toHaveLength(1);
    expect(parsed.hands[0].preflopActions).toHaveLength(9);

    const csvStr = exportUtils.formatSessionAsCsv(baseSession, [exampleHandCO]);
    const lines = csvStr.split('\n');
    expect(lines[0]).toBe(
      'Mano,Fecha,PosicionHero,CartasHero,AccionPreflop,CartasFlop,AccionFlop,Ciegas,StackInicial,Notas'
    );
    expect(lines[1]).toContain('CO');
    expect(lines[1]).toContain('AH KH');
    expect(lines[1]).toContain('UTG:fold > UTG+1:fold');
  });

  it('1, 4, 10, 17: debe generar el resumen exacto para una sesión de 1 mano con open raise de Hero, compresión de folds y ciegas iguales ($1.000/$1.000)', () => {
    const text = exportUtils.formatSessionAsPlainText(baseSession, [exampleHandCO]);

    expect(text).toContain('🃏 RecTheHand | Resumen de sesión');
    expect(text).toContain('📅 26/10/2026 · 11:34');
    expect(text).toContain('👥 Jugadores: 9');
    expect(text).toContain('💰 Ciegas: $1.000 / $1.000');
    expect(text).toContain('🏦 Stack inicial: $50.000 (50 BB)');
    expect(text).toContain('Manos: 1 | VPIP: 100% | PFR: 100%');
    expect(text).toContain('#001 | CO | A♥ K♥');
    expect(text).toContain('Stack Hero: $50.000 (50 BB)');
    expect(text).toContain('• Todos foldean hasta CO');
    expect(text).toContain('• Hero (CO): Raise a $3.000');
    expect(text).toContain('• BTN: Call a $3.000');
    expect(text).toContain('• BB: Call a $3.000');
    expect(text).not.toContain('UTG: Fold');
    expect(text).not.toContain('SB: Fold');
    expect(text).toContain('Jugadores al flop: 3');
    expect(text).toContain('Postflop: No registrado');
  });

  it('3: debe representar de forma compacta cuando Hero foldea inicialmente en UTG (Escenario G)', () => {
    const handUTGFold: RecordedHand = {
      ...exampleHandCO,
      id: 'h-utg',
      handNumber: 7,
      heroPosition: 'UTG',
      heroCards: [
        { rank: '7', suit: 'clubs' },
        { rank: '2', suit: 'diamonds' }
      ],
      preflopActions: [
        { id: '1', position: 'UTG', isHero: true, actionType: 'fold', timestamp: 1 }
      ],
      wasHeroFoldPreflop: true,
      notes: 'Hero fold preflop'
    };

    const text = exportUtils.formatSingleHandForWhatsApp(handUTGFold, baseSession);
    expect(text).toContain('#007 | UTG | 7♣ 2♦');
    expect(text).toContain('• Hero (UTG): Fold');
    expect(text).not.toContain('Todos foldean');
    expect(text).not.toContain('Registro incompleto');
    expect(text).not.toContain('Nota: Hero fold preflop');
  });

  it('5, 7: debe representar correctamente cuando Hero paga un raise o foldea ante una subida/3-bet (Escenario B y 3.3)', () => {
    const handBBFold: RecordedHand = {
      ...exampleHandCO,
      handNumber: 2,
      heroPosition: 'BB',
      heroCards: [
        { rank: 'K', suit: 'spades' },
        { rank: 'J', suit: 'diamonds' }
      ],
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'raise', amount: 4000, timestamp: 1 },
        { id: '2', position: 'MP', isHero: false, actionType: 'fold', timestamp: 2 },
        { id: '3', position: 'BTN', isHero: false, actionType: 'call', amount: 4000, timestamp: 3 },
        { id: '4', position: 'SB', isHero: false, actionType: 'fold', timestamp: 4 },
        { id: '5', position: 'BB', isHero: true, actionType: 'fold', timestamp: 5 }
      ],
      wasHeroFoldPreflop: true
    };

    const textB = exportUtils.formatSingleHandForWhatsApp(handBBFold, baseSession);
    expect(textB).toContain('#002 | BB | K♠ J♦');
    expect(textB).toContain('• UTG: Raise a $4.000');
    expect(textB).toContain('• BTN: Call a $4.000');
    expect(textB).toContain('• Hero (BB): Fold');
    expect(textB).not.toContain('MP: Fold');
    expect(textB).not.toContain('SB: Fold');

    // Hero abre y foldea frente a una 3-bet (Sección 3.3)
    const handHeroFoldTo3Bet: RecordedHand = {
      ...exampleHandCO,
      handNumber: 12,
      heroPosition: 'HJ',
      heroCards: [
        { rank: 'A', suit: 'spades' },
        { rank: 'Q', suit: 'clubs' }
      ],
      preflopActions: [
        { id: '1', position: 'HJ', isHero: true, actionType: 'raise', amount: 3000, timestamp: 1 },
        { id: '2', position: 'BTN', isHero: false, actionType: 'raise', amount: 10000, timestamp: 2 },
        { id: '3', position: 'HJ', isHero: true, actionType: 'fold', timestamp: 3 }
      ],
      wasHeroFoldPreflop: true
    };

    const text3Bet = exportUtils.formatSingleHandForWhatsApp(handHeroFoldTo3Bet, baseSession);
    expect(text3Bet).toContain('• Hero (HJ): Raise a $3.000');
    expect(text3Bet).toContain('• BTN: 3-bet a $10.000');
    expect(text3Bet).toContain('• Hero (HJ): Fold');
  });

  it('6: debe detectar y formatear un 3-bet de Hero y llegada al flop de 2 jugadores (Escenario C)', () => {
    const hand3Bet: RecordedHand = {
      ...exampleHandCO,
      handNumber: 3,
      heroPosition: 'BTN',
      heroCards: [
        { rank: 'Q', suit: 'spades' },
        { rank: 'Q', suit: 'hearts' }
      ],
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'fold', timestamp: 1 },
        { id: '2', position: 'HJ', isHero: false, actionType: 'raise', amount: 3000, timestamp: 2 },
        { id: '3', position: 'CO', isHero: false, actionType: 'fold', timestamp: 3 },
        { id: '4', position: 'BTN', isHero: true, actionType: 'raise', amount: 10000, timestamp: 4 },
        { id: '5', position: 'SB', isHero: false, actionType: 'fold', timestamp: 5 },
        { id: '6', position: 'BB', isHero: false, actionType: 'fold', timestamp: 6 },
        { id: '7', position: 'HJ', isHero: false, actionType: 'call', amount: 10000, timestamp: 7 }
      ]
    };

    const text = exportUtils.formatSingleHandForWhatsApp(hand3Bet, baseSession);
    expect(text).toContain('#003 | BTN | Q♠ Q♥');
    expect(text).toContain('• HJ: Raise a $3.000');
    expect(text).toContain('• Hero (BTN): 3-bet a $10.000');
    expect(text).toContain('• HJ: Call a $10.000');
    expect(text).toContain('Jugadores al flop: 2');
  });

  it('8: debe representar correctamente cuando Hero realiza un All-in', () => {
    const handAllIn: RecordedHand = {
      ...exampleHandCO,
      handNumber: 8,
      heroPosition: 'BTN',
      heroCards: [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'clubs' }
      ],
      preflopActions: [
        { id: '1', position: 'CO', isHero: false, actionType: 'raise', amount: 3000, timestamp: 1 },
        { id: '2', position: 'BTN', isHero: true, actionType: 'allin', amount: 50000, timestamp: 2 },
        { id: '3', position: 'SB', isHero: false, actionType: 'fold', timestamp: 3 },
        { id: '4', position: 'BB', isHero: false, actionType: 'fold', timestamp: 4 },
        { id: '5', position: 'CO', isHero: false, actionType: 'call', amount: 50000, timestamp: 5 }
      ]
    };

    const text = exportUtils.formatSingleHandForWhatsApp(handAllIn, baseSession);
    expect(text).toContain('• CO: Raise a $3.000');
    expect(text).toContain('• Hero (BTN): All-in a $50.000');
    expect(text).toContain('• CO: Call a $50.000');
    expect(text).toContain('Jugadores al flop: 2');
  });

  it('9, 11: debe conservar folds de limpers que abandonan tras un raise y omitir folds en frío intercalados (Escenario D)', () => {
    const handLimpers: RecordedHand = {
      ...exampleHandCO,
      handNumber: 4,
      heroPosition: 'CO',
      heroCards: [
        { rank: 'J', suit: 'spades' },
        { rank: '10', suit: 'spades' }
      ],
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'limp', amount: 1000, timestamp: 1 },
        { id: '2', position: 'UTG+1', isHero: false, actionType: 'fold', timestamp: 2 },
        { id: '3', position: 'MP', isHero: false, actionType: 'limp', amount: 1000, timestamp: 3 },
        { id: '4', position: 'HJ', isHero: false, actionType: 'fold', timestamp: 4 },
        { id: '5', position: 'CO', isHero: true, actionType: 'raise', amount: 6000, timestamp: 5 },
        { id: '6', position: 'BTN', isHero: false, actionType: 'fold', timestamp: 6 },
        { id: '7', position: 'SB', isHero: false, actionType: 'fold', timestamp: 7 },
        { id: '8', position: 'BB', isHero: false, actionType: 'fold', timestamp: 8 },
        { id: '9', position: 'UTG', isHero: false, actionType: 'call', amount: 6000, timestamp: 9 },
        { id: '10', position: 'MP', isHero: false, actionType: 'fold', timestamp: 10 }
      ]
    };

    const text = exportUtils.formatSingleHandForWhatsApp(handLimpers, baseSession);
    expect(text).toContain('• UTG: Limp');
    expect(text).toContain('• MP: Limp');
    expect(text).toContain('• Hero (CO): Raise a $6.000');
    expect(text).toContain('• UTG: Call a $6.000');
    expect(text).toContain('• MP: Fold');
    expect(text).not.toContain('UTG+1: Fold');
    expect(text).not.toContain('HJ: Fold');
    expect(text).toContain('Jugadores al flop: 2');
  });

  it('12: debe representar correctamente cuando Hero gana preflop por abandono de rivales (Escenario E)', () => {
    const handHeroWinsPreflop: RecordedHand = {
      ...exampleHandCO,
      handNumber: 5,
      heroPosition: 'BTN',
      heroCards: [
        { rank: 'A', suit: 'clubs' },
        { rank: 'Q', suit: 'diamonds' }
      ],
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'fold', timestamp: 1 },
        { id: '2', position: 'UTG+1', isHero: false, actionType: 'fold', timestamp: 2 },
        { id: '3', position: 'UTG+2', isHero: false, actionType: 'fold', timestamp: 3 },
        { id: '4', position: 'MP', isHero: false, actionType: 'fold', timestamp: 4 },
        { id: '5', position: 'HJ', isHero: false, actionType: 'fold', timestamp: 5 },
        { id: '6', position: 'CO', isHero: false, actionType: 'fold', timestamp: 6 },
        { id: '7', position: 'BTN', isHero: true, actionType: 'raise', amount: 3000, timestamp: 7 },
        { id: '8', position: 'SB', isHero: false, actionType: 'fold', timestamp: 8 },
        { id: '9', position: 'BB', isHero: false, actionType: 'fold', timestamp: 9 }
      ],
      notes: 'Hero gana preflop (todos foldearon)'
    };

    const text = exportUtils.formatSingleHandForWhatsApp(handHeroWinsPreflop, baseSession);
    expect(text).toContain('• Todos foldean hasta BTN');
    expect(text).toContain('• Hero (BTN): Raise a $3.000');
    expect(text).toContain('• Rivales restantes: Fold');
    expect(text).toContain('Hero gana preflop');
    expect(text).not.toContain('Jugadores al flop');
  });

  it('13: debe mostrar cartas y acciones del Flop cuando están registradas', () => {
    const handWithFlop: RecordedHand = {
      ...exampleHandCO,
      flopCards: [
        { rank: 'Q', suit: 'hearts' },
        { rank: '7', suit: 'spades' },
        { rank: '2', suit: 'clubs' }
      ],
      flopActions: [
        { id: 'f1', position: 'CO', isHero: true, actionType: 'bet', amount: 5000, timestamp: 20 }
      ]
    };

    const text = exportUtils.formatSingleHandForWhatsApp(handWithFlop, baseSession);
    expect(text).toContain('Jugadores al flop: 3');
    expect(text).toContain('FLOP: Q♥ 7♠ 2♣');
    expect(text).toContain('• Hero (CO): Bet a $5.000');
    expect(text).not.toContain('Postflop: No registrado');
  });

  it('14: debe identificar una mano con registro incompleto sin inventar llegada al flop ni contaminar VPIP/PFR (Escenario F)', () => {
    const incompleteWithHeroCall: RecordedHand = {
      ...exampleHandCO,
      handNumber: 6,
      heroPosition: 'SB',
      heroCards: [
        { rank: '9', suit: 'hearts' },
        { rank: '9', suit: 'clubs' }
      ],
      preflopActions: [
        { id: '1', position: 'BTN', isHero: false, actionType: 'raise', amount: 3000, timestamp: 1 },
        { id: '2', position: 'SB', isHero: true, actionType: 'call', amount: 3000, timestamp: 2 }
        // Falta la acción de BB
      ]
    };

    const text = exportUtils.formatSingleHandForWhatsApp(incompleteWithHeroCall, baseSession);
    expect(text).toContain('#006 | SB | 9♥ 9♣');
    expect(text).toContain('• BTN: Raise a $3.000');
    expect(text).toContain('• Hero (SB): Call a $3.000');
    expect(text).toContain('Registro incompleto');
    expect(text).not.toContain('Jugadores al flop');

    // Mano abortada antes de que el turno llegue a Hero: no debe reducir artificialmente VPIP/PFR
    const abortedBeforeHero: RecordedHand = {
      ...exampleHandCO,
      id: 'h-aborted',
      handNumber: 2,
      heroPosition: 'BTN',
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'raise', amount: 3000, timestamp: 1 }
      ],
      wasHeroFoldPreflop: false
    };

    const stats = exportUtils.calculateSessionStats([exampleHandCO, abortedBeforeHero]);
    expect(stats.totalHands).toBe(2);
    expect(stats.validHands).toBe(1);
    expect(stats.vpipPercent).toBe(100);
    expect(stats.pfrPercent).toBe(100);
  });

  it('15, 16, 18, 19: debe soportar datos opcionales ausentes, variación de stack entre manos, straddle/rake y mesas de 2 o 6 jugadores', () => {
    const session6Max: SessionConfig = {
      ...baseSession,
      playerCount: 6,
      straddle: { enabled: true, amount: 2000, position: 'UTG' },
      rake: { enabled: true, percentage: 5, cap: 5000 },
      notes: 'Mesa rápida 6-max'
    };

    const handNoCardsCustomStack: RecordedHand = {
      ...exampleHandCO,
      handNumber: 1,
      heroPosition: 'BTN',
      heroCards: undefined,
      stackAtStart: 75000, // 75 BB
      preflopActions: [
        { id: '1', position: 'UTG', isHero: false, actionType: 'fold', timestamp: 1 },
        { id: '2', position: 'MP', isHero: false, actionType: 'fold', timestamp: 2 },
        { id: '3', position: 'CO', isHero: false, actionType: 'fold', timestamp: 3 },
        { id: '4', position: 'BTN', isHero: true, actionType: 'raise', amount: 3000, timestamp: 4 },
        { id: '5', position: 'SB', isHero: false, actionType: 'fold', timestamp: 5 },
        { id: '6', position: 'BB', isHero: false, actionType: 'call', amount: 3000, timestamp: 6 }
      ],
      notes: 'Villano en BB paga muy loose'
    };

    const text = exportUtils.formatSessionAsPlainText(session6Max, [handNoCardsCustomStack]);
    expect(text).toContain('👥 Jugadores: 6');
    expect(text).toContain('🔥 Straddle: $2.000 (UTG)');
    expect(text).toContain('🏛️ Rake: 5% (Cap $5.000)');
    expect(text).toContain('📝 Nota: Mesa rápida 6-max');
    expect(text).toContain('#001 | BTN | Sin cartas');
    expect(text).toContain('Stack Hero: $75.000 (75 BB)');
    expect(text).toContain('Jugadores al flop: 2');
    expect(text).toContain('Nota: Villano en BB paga muy loose');
  });

  it('2: debe soportar sesiones extensas (ej. 65 manos) dividiendo en bloques numerados sin truncar manos', () => {
    const manyHands: RecordedHand[] = Array.from({ length: 65 }, (_, idx) => ({
      ...exampleHandCO,
      id: `hand-${idx + 1}`,
      handNumber: idx + 1,
      stackAtStart: 50000 + idx * 1000
    }));

    const fullText = exportUtils.formatSessionAsPlainText(baseSession, manyHands);
    expect(fullText).toContain('#001 | CO | A♥ K♥');
    expect(fullText).toContain('#065 | CO | A♥ K♥');

    const blocks = exportUtils.formatSessionWhatsAppBlocks(baseSession, manyHands, 30);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toContain('Parte 1/3');
    expect(blocks[0]).toContain('#001 a #030');
    expect(blocks[1]).toContain('Parte 2/3');
    expect(blocks[1]).toContain('#031 a #060');
    expect(blocks[2]).toContain('Parte 3/3');
    expect(blocks[2]).toContain('#061 a #065');
  });

  it('20 & Integridad: no debe mutar los objetos originales y debe ser 100% determinista', () => {
    const handClone = JSON.parse(JSON.stringify(exampleHandCO)) as RecordedHand;
    const sessionClone = JSON.parse(JSON.stringify(baseSession)) as SessionConfig;

    const firstExport = exportUtils.formatSessionAsPlainText(sessionClone, [handClone]);
    const secondExport = exportUtils.formatSessionAsPlainText(sessionClone, [handClone]);

    expect(firstExport).toBe(secondExport);
    expect(handClone).toEqual(exampleHandCO);
    expect(sessionClone).toEqual(baseSession);

    const url = exportUtils.generateWhatsAppUrl(sessionClone, [handClone], '5491162411992');
    expect(url).toContain('https://api.whatsapp.com/send?phone=5491162411992&text=');
    expect(decodeURIComponent(url)).toContain('#001 | CO | A♥ K♥');
  });
});
