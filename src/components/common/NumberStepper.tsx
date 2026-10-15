import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface NumberStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  formatValue?: (val: number) => string;
  min?: number;
  max?: number;
  className?: string;
  compact?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onIncrement,
  onDecrement,
  formatValue = (v) => v.toLocaleString('es-AR'),
  min = 0,
  max = Infinity,
  className,
  compact = false
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) {
      triggerHaptic();
      onDecrement();
    }
  };

  const handleInc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) {
      triggerHaptic();
      onIncrement();
    }
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-between bg-[#131E2C] border border-[#233347] rounded-xl text-white font-semibold',
        compact ? 'h-11 px-1.5 min-w-[130px]' : 'h-12 px-2 min-w-[170px]',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDec}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1B293A] hover:bg-[#25364D] active:scale-90 active:bg-poker-surfaceActive text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Disminuir"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className={clsx('tracking-wide text-center font-bold px-2 select-text', compact ? 'text-base' : 'text-lg')}>
        {formatValue(value)}
      </span>

      <button
        type="button"
        onClick={handleInc}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1B293A] hover:bg-[#25364D] active:scale-90 active:bg-poker-surfaceActive text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Aumentar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
