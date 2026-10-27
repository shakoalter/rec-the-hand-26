import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NumberStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onValueClick?: () => void;
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
  onValueClick,
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

  const handleCenterClick = (e: React.MouseEvent) => {
    if (!onValueClick) return;
    e.stopPropagation();
    triggerHaptic();
    onValueClick();
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-between bg-[#131E2C] border border-[#233347] rounded-xl text-white font-semibold',
        compact ? 'h-11 px-1.5 min-w-[124px]' : 'h-11 sm:h-12 px-1.5 min-w-[144px] sm:min-w-[168px]',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDec}
        disabled={value <= min}
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1B293A] hover:bg-[#25364D] active:scale-90 active:bg-poker-surfaceActive text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all flex-shrink-0"
        aria-label="Disminuir"
      >
        <Minus className="w-4 h-4" />
      </button>

      {onValueClick ? (
        <button
          type="button"
          onClick={handleCenterClick}
          className={cn(
            'flex-1 h-9 mx-1 rounded-lg tracking-wide text-center font-bold px-1.5 hover:bg-slate-800/60 active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-slate-700',
            compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          )}
          title="Tocar para ingresar valor exacto"
        >
          {formatValue(value)}
        </button>
      ) : (
        <span
          className={cn(
            'tracking-wide text-center font-bold px-1.5 select-text',
            compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          )}
        >
          {formatValue(value)}
        </span>
      )}

      <button
        type="button"
        onClick={handleInc}
        disabled={value >= max}
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1B293A] hover:bg-[#25364D] active:scale-90 active:bg-poker-surfaceActive text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all flex-shrink-0"
        aria-label="Aumentar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
