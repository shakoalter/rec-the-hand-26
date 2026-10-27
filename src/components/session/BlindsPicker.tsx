import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { NumberStepper } from '../common/NumberStepper';
import { PresetPill } from '../common/PresetPill';
import { CustomNumberModal } from '../common/CustomNumberModal';

interface BlindsPickerProps {
  sb: number;
  bb: number;
  onChange: (sb: number, bb: number) => void;
}

const PRESETS = [
  { label: '500 / 1.000', sb: 500, bb: 1000 },
  { label: '1.000 / 1.000', sb: 1000, bb: 1000 },
  { label: '1.000 / 2.000', sb: 1000, bb: 2000 },
];

export const BlindsPicker: React.FC<BlindsPickerProps> = ({ sb, bb, onChange }) => {
  const [modalType, setModalType] = useState<'sb' | 'bb' | null>(null);

  const activePreset = PRESETS.find((p) => p.sb === sb && p.bb === bb);
  const isCustom = !activePreset;

  const handlePreset = (presetSb: number, presetBb: number) => {
    onChange(presetSb, presetBb);
  };

  const handleSbInc = () => {
    const step = sb >= 1000 ? 500 : 250;
    onChange(sb + step, bb);
  };

  const handleSbDec = () => {
    const step = sb > 1000 ? 500 : 250;
    if (sb - step >= 100) {
      onChange(sb - step, bb);
    }
  };

  const handleBbInc = () => {
    const step = bb >= 1000 ? 500 : 250;
    onChange(sb, bb + step);
  };

  const handleBbDec = () => {
    const step = bb > 1000 ? 500 : 250;
    if (bb - step >= 100) {
      onChange(sb, bb - step);
    }
  };

  return (
    <GlassCard compact className="relative overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400/20 to-slate-600/30 border border-slate-400/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <svg className="w-4.5 h-4.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="7" rx="8" ry="3.5" fill="#94A3B8" fillOpacity="0.3" />
              <path d="M4 7v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V7" />
              <path d="M4 12v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-5" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-sm sm:text-base tracking-wide whitespace-nowrap">
            Ciegas (SB / BB)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 truncate">
          <span className="xs:hidden">Tocá para editar</span>
          <span className="hidden xs:inline">Tocá un valor para editar</span>
        </span>
      </div>

      {/* Sub-columns: Ciega chica & Ciega grande */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-2.5 mb-2.5">
        {/* SB column */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-300 text-center">
            Ciega chica (SB)
          </span>
          <NumberStepper
            value={sb}
            onIncrement={handleSbInc}
            onDecrement={handleSbDec}
            onValueClick={() => setModalType('sb')}
            min={100}
            compact
            className="w-full"
          />
        </div>

        {/* BB column */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-300">
              Ciega grande (BB)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-poker-emerald shadow-neon-emerald" />
          </div>
          <NumberStepper
            value={bb}
            onIncrement={handleBbInc}
            onDecrement={handleBbDec}
            onValueClick={() => setModalType('bb')}
            min={100}
            compact
            className="w-full"
          />
        </div>
      </div>

      {/* Presets row */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
        {PRESETS.map((p) => (
          <PresetPill
            key={p.label}
            label={p.label}
            isActive={sb === p.sb && bb === p.bb}
            onClick={() => handlePreset(p.sb, p.bb)}
            className="text-[11px] sm:text-xs px-1 whitespace-nowrap"
          />
        ))}
        <PresetPill
          label="Otro"
          isActive={isCustom}
          onClick={() => setModalType('bb')}
          className="text-[11px] sm:text-xs px-1 whitespace-nowrap"
        />
      </div>

      {modalType && (
        <CustomNumberModal
          isOpen={true}
          title={modalType === 'sb' ? 'Ciega Chica (SB)' : 'Ciega Grande (BB)'}
          initialValue={modalType === 'sb' ? sb : bb}
          onConfirm={(val) => {
            if (modalType === 'sb') onChange(val, bb);
            else onChange(sb, val);
          }}
          onClose={() => setModalType(null)}
        />
      )}
    </GlassCard>
  );
};
