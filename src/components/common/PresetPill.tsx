import React from 'react';
import { cn } from '../../utils/cn';

interface PresetPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const PresetPill: React.FC<PresetPillProps> = ({
  label,
  isActive,
  onClick,
  className
}) => {
  const handleClick = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'h-10 px-3.5 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center select-none active:scale-95 whitespace-nowrap',
        isActive
          ? 'bg-[#0E2922] text-white border-2 border-poker-emerald shadow-neon-emerald'
          : 'bg-[#121E2C] text-[#94A3B8] border border-[#223347] hover:border-slate-500 hover:text-white',
        className
      )}
    >
      {label}
    </button>
  );
};
