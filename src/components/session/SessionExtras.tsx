import React from 'react';
import { Settings, FileText, Coins } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { ToggleSwitch } from '../common/ToggleSwitch';

interface SessionExtrasProps {
  straddleEnabled: boolean;
  onStraddleChange: (enabled: boolean) => void;
  rakeEnabled: boolean;
  onRakeChange: (enabled: boolean) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export const SessionExtras: React.FC<SessionExtrasProps> = ({
  straddleEnabled,
  onStraddleChange,
  rakeEnabled,
  onRakeChange,
  note,
  onNoteChange,
}) => {
  return (
    <GlassCard compact className="relative overflow-hidden">
      {/* Header: Gear Icon + Title */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-700/30 border border-slate-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Settings className="w-4 h-4 text-slate-300" />
          </div>
          <h2 className="text-white font-bold text-sm sm:text-base tracking-wide">
            Opciones adicionales
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">Opcionales</span>
      </div>

      {/* Straddle & Rake en 2 columnas compactas */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5 relative z-10">
        <div className="flex items-center justify-between bg-[#0A121D] border border-[#1E2E42] rounded-xl px-3 py-2">
          <span className="text-xs sm:text-sm font-semibold text-white">Straddle</span>
          <ToggleSwitch
            checked={straddleEnabled}
            onChange={onStraddleChange}
            id="straddle-toggle"
          />
        </div>

        <div className="flex items-center justify-between bg-[#0A121D] border border-[#1E2E42] rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-slate-400 hidden xs:inline" />
            <span className="text-xs sm:text-sm font-semibold text-white">Rake</span>
          </div>
          <ToggleSwitch
            checked={rakeEnabled}
            onChange={onRakeChange}
            id="rake-toggle"
          />
        </div>
      </div>

      {/* Session Note en 1 línea integrada */}
      <div className="relative z-10 flex items-center gap-2 bg-[#0A111A]/90 border border-[#203144] rounded-xl px-3 h-10 focus-within:border-poker-emerald focus-within:ring-1 focus-within:ring-poker-emerald transition-all">
        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          id="session-note"
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Nota opcional (Club, día, rivales...)"
          aria-label="Nota de la sesión"
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>
    </GlassCard>
  );
};
