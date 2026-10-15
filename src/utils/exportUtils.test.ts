import { describe, it, expect } from 'vitest';
import { exportUtils } from './exportUtils';
import { SessionConfig, RecordedHand } from '../types/session';

describe('exportUtils', () => {
  const mockSession: SessionConfig = {
    id: 'sess-123',
    createdAt: 1700000000000,
    status: 'active',
    initialStack: 50000,
    currentStack: 50000,
    blinds: { sb: 1000, bb: 1000 },
    playerCount: 9,
    straddle: { enabled: false },
    rake: { enabled: false },
    notes: 'Partida en City Center'
  };

  const mockHands: RecordedHand[] = [
    {
      id: 'hand-1',
      sessionId: 'sess-123',
      handNumber: 1,
      createdAt: 1700000050000,
      heroPosition: 'BTN',
      heroCards: [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'spades' }
      ],
      stackAtStart: 50000,
      preflopActions: [
        { id: 'a1', position: 'UTG', isHero: false, actionType: 'limp', amount: 1000, timestamp: 1700000055000 },
        { id: 'a2', position: 'BTN', isHero: true, actionType: 'raise', amount: 4000, timestamp: 1700000060000 }
      ],
      isQuickMode: true,
      isComplete: true,
      isEstimated: false,
      wasHeroFoldPreflop: false
    }
  ];

  it('debe generar un JSON válido y estructurado', () => {
    const jsonStr = exportUtils.formatSessionAsJson(mockSession, mockHands);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.app).toBe('RecTheHand');
    expect(parsed.session.id).toBe('sess-123');
    expect(parsed.hands).toHaveLength(1);
    expect(parsed.hands[0].heroCards[0].rank).toBe('A');
  });

  it('debe generar un CSV formateado correctamente con encabezados', () => {
    const csvStr = exportUtils.formatSessionAsCsv(mockSession, mockHands);
    const lines = csvStr.split('\n');

    expect(lines[0]).toContain('Mano,Fecha,PosicionHero,CartasHero');
    expect(lines[1]).toContain('1,');
    expect(lines[1]).toContain('BTN');
    expect(lines[1]).toContain('AS KS');
    expect(lines[1]).toContain('UTG:limp(1000) > BTN:raise(4000)');
  });
});
