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
    <GlassCard className="relative overflow-hidden pb-4">
      {/* Decorative Aces peeking in lower right corner */}
      <div className="absolute -bottom-6 -right-4 pointer-events-none opacity-20 transform rotate-12 scale-90 select-none">
        <div className="relative flex">
          {/* Ace of Hearts */}
          <div className="w-20 h-28 bg-white/90 rounded-lg shadow-lg flex flex-col items-center justify-between p-2 text-red-600 font-bold border border-white/20 transform -rotate-12 translate-x-4 translate-y-2">
            <div className="text-sm self-start leading-none">A<br/>♥</div>
            <div className="text-2xl">♥</div>
            <div className="text-sm self-end leading-none rotate-180">A<br/>♥</div>
          </div>
          {/* Ace of Spades */}
          <div className="w-20 h-28 bg-white/95 rounded-lg shadow-2xl flex flex-col items-center justify-between p-2 text-slate-900 font-bold border border-white/30 transform rotate-6">
            <div className="text-sm self-start leading-none">A<br/>♠</div>
            <div className="text-2xl">♠</div>
            <div className="text-sm self-end leading-none rotate-180">A<br/>♠</div>
          </div>
        </div>
      </div>

      {/* Header: Gear Icon + Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-700/30 border border-slate-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
          <Settings className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h2 className="text-white font-bold text-base tracking-wide">Opciones adicionales</h2>
          <p className="text-poker-textMuted text-xs">Opcionales, podés modificarlos luego</p>
        </div>
      </div>

      {/* Options list */}
      <div className="flex flex-col gap-3.5 relative z-10">
        {/* Straddle row */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="7" rx="8" ry="3.5" />
                <path d="M4 7v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">Straddle</span>
          </div>
          <ToggleSwitch
            checked={straddleEnabled}
            onChange={onStraddleChange}
            id="straddle-toggle"
          />
        </div>

        {/* Rake row */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">Rake</span>
          </div>
          <ToggleSwitch
            checked={rakeEnabled}
            onChange={onRakeChange}
            id="rake-toggle"
          />
        </div>

        {/* Session Note */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-slate-400" />
            <label htmlFor="session-note" className="text-xs font-medium text-slate-300">
              Nota de la sesión <span className="text-slate-500">(opcional)</span>
            </label>
          </div>
          <input
            id="session-note"
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Ej: Club, día, rivales habituales..."
            className="w-full h-11 px-3.5 bg-[#0A111A]/90 border border-[#203144] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-poker-emerald focus:ring-1 focus:ring-poker-emerald transition-all"
          />
        </div>
      </div>
    </GlassCard>
  );
};
