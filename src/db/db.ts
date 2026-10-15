import Dexie, { type Table } from 'dexie';
import { SessionConfig, RecordedHand } from '../types/session';

export class RecTheHandDatabase extends Dexie {
  sessions!: Table<SessionConfig, string>;
  hands!: Table<RecordedHand, string>;

  constructor() {
    super('RecTheHandDB');
    this.version(1).stores({
      sessions: 'id, createdAt, status',
      hands: 'id, sessionId, handNumber, createdAt, heroPosition'
    });
  }
}

export const db = new RecTheHandDatabase();
