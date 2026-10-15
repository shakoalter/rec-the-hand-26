import { Card, TablePosition, PlayerAction } from './poker';

export interface SessionConfig {
  id: string;                     // UUIDv4
  createdAt: number;              // Timestamp Unix
  endedAt?: number;
  status: 'active' | 'paused' | 'completed';
  initialStack: number;           // Ej: 50000
  currentStack: number;
  blinds: {
    sb: number;                   // Ej: 1000
    bb: number;                   // Ej: 1000
  };
  playerCount: number;            // 2 a 9
  straddle: {
    enabled: boolean;
    amount?: number;
    position?: TablePosition;
  };
  rake: {
    enabled: boolean;
    percentage?: number;          // Ej: 5
    cap?: number;                 // Ej: 5000
  };
  notes?: string;
  location?: string;
}

export interface RecordedHand {
  id: string;                     // UUIDv4
  sessionId: string;              // FK hacia SessionConfig
  handNumber: number;             // Secuencial en la sesión (1, 2, 3...)
  createdAt: number;
  heroPosition: TablePosition;
  heroCards?: [Card, Card];
  stackAtStart: number;
  preflopActions: PlayerAction[];
  flopCards?: [Card, Card, Card];
  flopActions?: PlayerAction[];
  
  isQuickMode: boolean;
  isComplete: boolean;
  isEstimated: boolean;
  wasHeroFoldPreflop: boolean;
  notes?: string;
}
