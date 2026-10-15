import { create } from 'zustand';
import { SessionConfig } from '../types/session';
import { sessionRepository } from '../db/sessionRepository';

interface SessionState {
  activeSession: SessionConfig | null;
  isLoading: boolean;
  loadActiveSession: () => Promise<void>;
  startNewSession: (
    data: Omit<SessionConfig, 'id' | 'createdAt' | 'status' | 'currentStack'>
  ) => Promise<SessionConfig>;
  finishSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isLoading: true,

  loadActiveSession: async () => {
    set({ isLoading: true });
    try {
      const session = await sessionRepository.getActiveSession();
      set({ activeSession: session || null, isLoading: false });
    } catch (err) {
      console.error('Error al cargar la sesión activa:', err);
      set({ isLoading: false });
    }
  },

  startNewSession: async (data) => {
    const session = await sessionRepository.createSession(data);
    set({ activeSession: session });
    return session;
  },

  finishSession: async () => {
    const current = get().activeSession;
    if (current) {
      await sessionRepository.endSession(current.id);
      set({ activeSession: null });
    }
  }
}));
