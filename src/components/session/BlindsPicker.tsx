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
    <GlassCard className="relative overflow-hidden">
      {/* Title & Icon */}
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400/20 to-slate-600/30 border border-slate-400/30 flex items-center justify-center flex-shrink-0 shadow-inner">
          <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="7" rx="8" ry="3.5" fill="#94A3B8" fillOpacity="0.3" />
            <path d="M4 7v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V7" />
            <path d="M4 12v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-white font-bold text-base tracking-wide">Ciegas</h2>
          <p className="text-poker-textMuted text-xs">Valor de la ciega chica y grande</p>
        </div>
      </div>

      {/* Sub-columns: Ciega chica & Ciega grande */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {/* SB column */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400 text-center">
            Ciega chica (SB)
          </span>
          <NumberStepper
            value={sb}
            onIncrement={handleSbInc}
            onDecrement={handleSbDec}
            min={100}
            compact
            className="w-full"
          />
        </div>

        {/* BB column */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">
              Ciega grande (BB)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-poker-emerald shadow-neon-emerald"></span>
          </div>
          <NumberStepper
            value={bb}
            onIncrement={handleBbInc}
            onDecrement={handleBbDec}
            min={100}
            compact
            className="w-full"
          />
        </div>
      </div>

      {/* Presets row */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <PresetPill
            key={p.label}
            label={p.label}
            isActive={sb === p.sb && bb === p.bb}
            onClick={() => handlePreset(p.sb, p.bb)}
            className="text-xs px-2"
          />
        ))}
        <PresetPill
          label="Otro"
          isActive={isCustom}
          onClick={() => setModalType('bb')}
          className="text-xs px-2"
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
