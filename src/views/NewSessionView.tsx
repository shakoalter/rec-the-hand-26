import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { StackPicker } from '../components/session/StackPicker';
import { BlindsPicker } from '../components/session/BlindsPicker';
import { PlayerCountSelector } from '../components/session/PlayerCountSelector';
import { SessionExtras } from '../components/session/SessionExtras';
import { useSessionStore } from '../stores/sessionStore';

interface NewSessionViewProps {
  onSessionStarted: () => void;
}

export const NewSessionView: React.FC<NewSessionViewProps> = ({ onSessionStarted }) => {
  const [initialStack, setInitialStack] = useState<number>(50000);
  const [sb, setSb] = useState<number>(1000);
  const [bb, setBb] = useState<number>(1000);
  const [playerCount, setPlayerCount] = useState<number>(9);
  const [straddleEnabled, setStraddleEnabled] = useState<boolean>(false);
  const [rakeEnabled, setRakeEnabled] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const startNewSession = useSessionStore((state) => state.startNewSession);

  const isValid = initialStack >= bb * 5 && sb > 0 && bb > 0;

  const handleStartSession = async () => {
    if (!isValid || isSubmitting) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }

    setIsSubmitting(true);
    try {
      await startNewSession({
        initialStack,
        blinds: { sb, bb },
        playerCount,
        straddle: {
          enabled: straddleEnabled,
          amount: straddleEnabled ? bb * 2 : undefined,
          position: straddleEnabled ? 'UTG' : undefined
        },
        rake: {
          enabled: rakeEnabled,
          percentage: rakeEnabled ? 5 : undefined,
          cap: rakeEnabled ? 5000 : undefined
        },
        notes: note.trim() || undefined
      });

      onSessionStarted();
    } catch (err) {
      console.error('Error al iniciar la sesión:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative app-shell bg-[#070C12] text-white w-full max-w-md mx-auto px-2.5 xs:px-3.5 sm:px-4 pt-safe pb-safe">
      {/* Ambient background glows & chips illustration */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-0 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative blurred 3D chips at top right */}
      <div className="absolute top-2 right-4 pointer-events-none opacity-40 select-none">
        <div className="relative w-20 h-20">
          <div className="absolute -top-1 right-2 w-12 h-12 rounded-full border-2 border-red-500/50 bg-red-900/40 shadow-lg transform rotate-12 blur-[0.5px]" />
          <div className="absolute top-3 right-0 w-14 h-14 rounded-full border-2 border-slate-300/40 bg-slate-800/50 shadow-md transform -rotate-6" />
        </div>
      </div>

      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 pt-1 pb-2 border-b border-slate-800/60 z-10">
        {/* Glowing neon cards logo */}
        <div className="relative w-12 h-12 flex-shrink-0">
          {/* Back card */}
          <div className="absolute top-0 right-1 w-8 h-11 bg-[#121E2C] border border-cyan-400/40 rounded-lg shadow-sm transform rotate-12" />
          {/* Front card (Ace of Spades with neon glow) */}
          <div className="absolute top-1 left-0 w-8 h-11 bg-[#0E1A27] border-2 border-cyan-400/80 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.5)] flex flex-col items-center justify-center text-cyan-300 transform -rotate-6">
            <span className="text-[10px] font-bold leading-none self-start ml-1 mt-0.5">A</span>
            <span className="text-xs">♠</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            Nueva Sesión
          </h1>
          <p className="text-poker-textMuted text-xs font-normal">
            Configurá los parámetros de tu partida
          </p>
        </div>
      </header>

      {/* Scrollable Main Container for mobile ergonomics */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar flex flex-col gap-2.5 py-2.5 z-10">
        {/* Section 1: Stack Inicial */}
        <StackPicker
          value={initialStack}
          onChange={setInitialStack}
        />

        {/* Section 2: Ciegas */}
        <BlindsPicker
          sb={sb}
          bb={bb}
          onChange={(newSb, newBb) => {
            setSb(newSb);
            setBb(newBb);
          }}
        />

        {/* Section 3: Cantidad de Jugadores */}
        <PlayerCountSelector
          value={playerCount}
          onChange={setPlayerCount}
        />

        {/* Section 4: Opciones Adicionales */}
        <SessionExtras
          straddleEnabled={straddleEnabled}
          onStraddleChange={setStraddleEnabled}
          rakeEnabled={rakeEnabled}
          onRakeChange={setRakeEnabled}
          note={note}
          onNoteChange={setNote}
        />
      </main>

      {/* Anchored Footer within App Shell */}
      <footer className="shrink-0 pt-2 z-20">
        <button
          type="button"
          onClick={handleStartSession}
          disabled={!isValid || isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark hover:brightness-110 active:scale-[0.98] text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span>{isSubmitting ? 'Iniciando...' : 'Comenzar sesión'}</span>
        </button>
      </footer>
    </div>
  );
};
