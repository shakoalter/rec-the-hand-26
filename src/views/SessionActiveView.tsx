import React from 'react';
import { Play, Square, Layers } from 'lucide-react';
import { useSessionStore } from '../stores/sessionStore';
import { GlassCard } from '../components/common/GlassCard';

export const SessionActiveView: React.FC = () => {
  const { activeSession, finishSession } = useSessionStore();

  if (!activeSession) return null;

  const handleFinish = async () => {
    if (confirm('¿Deseás finalizar la sesión actual?')) {
      await finishSession();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#070C12] text-white flex flex-col justify-between p-4 pt-safe pb-safe max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Sesión en Curso</h1>
            <p className="text-xs text-poker-emerald flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-poker-emerald animate-pulse" />
              Mesa de {activeSession.playerCount} jugadores
            </p>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-900/50 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Square className="w-3.5 h-3.5" /> Finalizar
        </button>
      </div>

      {/* Session Details Card */}
      <div className="flex flex-col gap-3 my-auto">
        <GlassCard>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
            Parámetros de la partida
          </h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#0A111A] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs">Ciegas</span>
              <p className="font-bold text-white text-base">
                ${activeSession.blinds.sb.toLocaleString('es-AR')} / ${activeSession.blinds.bb.toLocaleString('es-AR')}
              </p>
            </div>

            <div className="bg-[#0A111A] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs">Stack Inicial</span>
              <p className="font-bold text-poker-emerald text-base">
                ${activeSession.initialStack.toLocaleString('es-AR')}
              </p>
            </div>

            <div className="bg-[#0A111A] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs">Jugadores</span>
              <p className="font-bold text-white text-base">
                {activeSession.playerCount} en mesa
              </p>
            </div>

            <div className="bg-[#0A111A] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs">Straddle</span>
              <p className="font-bold text-white text-base">
                {activeSession.straddle.enabled ? 'Activado' : 'Desactivado'}
              </p>
            </div>
          </div>

          {activeSession.notes && (
            <div className="mt-3 p-3 bg-[#0A111A] rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400 font-semibold block mb-0.5">Nota:</span>
              {activeSession.notes}
            </div>
          )}
        </GlassCard>

        {/* Action Prompt */}
        <div className="text-center py-4">
          <p className="text-sm text-slate-300 mb-1">
            Sesión inicializada y persistida con éxito en IndexedDB.
          </p>
          <p className="text-xs text-slate-500">
            Listo para la integración de la Fase 5 (Registrador Preflop en 2 toques).
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pb-2">
        <button
          onClick={() => alert('Fase 5 en preparación: Registrador preflop con mesa de póker interactiva.')}
          className="w-full h-14 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark text-white font-bold text-lg rounded-2xl shadow-neon-emerald flex items-center justify-center gap-2.5 active:scale-98 transition-all"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span>Registrar nueva mano</span>
        </button>
      </div>
    </div>
  );
};
