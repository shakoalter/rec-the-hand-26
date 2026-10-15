import React, { useEffect } from 'react';
import { useSessionStore } from './stores/sessionStore';
import { NewSessionView } from './views/NewSessionView';
import { SessionActiveView } from './views/SessionActiveView';

export const App: React.FC = () => {
  const { activeSession, isLoading, loadActiveSession } = useSessionStore();

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070C12] flex flex-col items-center justify-center text-white p-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-poker-emerald/20 animate-ping" />
          <div className="relative w-12 h-16 bg-[#0E1A27] border-2 border-poker-emerald rounded-xl flex items-center justify-center text-poker-emerald shadow-neon-emerald">
            <span className="text-xl font-bold">♠</span>
          </div>
        </div>
        <span className="mt-4 text-xs font-semibold tracking-widest uppercase text-slate-400">
          Cargando RecTheHand...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#070C12]">
      {activeSession ? (
        <SessionActiveView />
      ) : (
        <NewSessionView onSessionStarted={() => {}} />
      )}
    </div>
  );
};

export default App;
