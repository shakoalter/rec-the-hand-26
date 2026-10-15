import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { NumberStepper } from '../common/NumberStepper';
import { PresetPill } from '../common/PresetPill';
import { CustomNumberModal } from '../common/CustomNumberModal';

interface StackPickerProps {
  value: number;
  onChange: (val: number) => void;
}

const PRESETS = [
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '30K', value: 30000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
];

export const StackPicker: React.FC<StackPickerProps> = ({ value, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePreset = (presetVal: number) => {
    onChange(presetVal);
  };

  const handleIncrement = () => {
    const step = value >= 50000 ? 10000 : 5000;
    onChange(value + step);
  };

  const handleDecrement = () => {
    const step = value > 50000 ? 10000 : 5000;
    if (value - step >= 1000) {
      onChange(value - step);
    }
  };

  const isCustom = !PRESETS.some((p) => p.value === value);

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Top row: Icon + Info + Stepper */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-3">
          {/* Green Chips Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <svg className="w-6 h-6 text-poker-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="6" rx="8" ry="3" fill="#10B981" fillOpacity="0.4" />
              <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
              <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-wide">Stack inicial</h2>
            <p className="text-poker-textMuted text-xs">Monto con el que entrás a la mesa</p>
          </div>
        </div>

        {/* Stepper */}
        <NumberStepper
          value={value}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          min={1000}
        />
      </div>

      {/* Bottom row: Presets */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {PRESETS.map((p) => (
          <PresetPill
            key={p.label}
            label={p.label}
            isActive={value === p.value}
            onClick={() => handlePreset(p.value)}
          />
        ))}
        <PresetPill
          label="Otro"
          isActive={isCustom}
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <CustomNumberModal
        isOpen={isModalOpen}
        title="Ingresar Stack Inicial"
        initialValue={value}
        onConfirm={onChange}
        onClose={() => setIsModalOpen(false)}
      />
    </GlassCard>
  );
};
