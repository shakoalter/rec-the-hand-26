import { db } from './db';
import { SessionConfig, RecordedHand } from '../types/session';

export const sessionRepository = {
  async createSession(
    data: Omit<SessionConfig, 'id' | 'createdAt' | 'status' | 'currentStack'>
  ): Promise<SessionConfig> {
    const session: SessionConfig = {
      ...data,
      id: crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      status: 'active',
      currentStack: data.initialStack
    };

    await db.sessions.add(session);
    return session;
  },

  async getActiveSession(): Promise<SessionConfig | undefined> {
    return await db.sessions.where('status').equals('active').first();
  },

  async endSession(id: string): Promise<void> {
    await db.sessions.update(id, {
      status: 'completed',
      endedAt: Date.now()
    });
  },

  async getHandsBySession(sessionId: string): Promise<RecordedHand[]> {
    return await db.hands.where('sessionId').equals(sessionId).sortBy('handNumber');
  },

  async getHandById(id: string): Promise<RecordedHand | undefined> {
    return await db.hands.get(id);
  },

  async saveHand(hand: RecordedHand): Promise<void> {
    await db.hands.put(hand);
  },

  async deleteHand(id: string): Promise<void> {
    await db.hands.delete(id);
  }
};
