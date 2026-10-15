import React, { useState } from 'react';
import { X, Delete, Check } from 'lucide-react';

interface CustomNumberModalProps {
  isOpen: boolean;
  title: string;
  initialValue: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
  step?: number;
}

export const CustomNumberModal: React.FC<CustomNumberModalProps> = ({
  isOpen,
  title,
  initialValue,
  onConfirm,
  onClose
}) => {
  const [strValue, setStrValue] = useState(initialValue.toString());

  if (!isOpen) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDigit = (digit: string) => {
    triggerHaptic();
    if (strValue === '0') {
      setStrValue(digit);
    } else if (strValue.length < 8) {
      setStrValue(strValue + digit);
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    if (strValue.length > 1) {
      setStrValue(strValue.slice(0, -1));
    } else {
      setStrValue('0');
    }
  };

  const handleClear = () => {
    triggerHaptic();
    setStrValue('0');
  };

  const handleConfirm = () => {
    triggerHaptic();
    const num = parseInt(strValue, 10);
    if (!isNaN(num) && num > 0) {
      onConfirm(num);
    }
    onClose();
  };

  const numDisplay = parseInt(strValue || '0', 10).toLocaleString('es-AR');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3">
      <div className="w-full max-w-sm bg-[#0E1724] border border-[#223348] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#182638] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-[#080E16] border border-[#1C2C3E] rounded-2xl py-4 px-6 text-center">
          <span className="text-3xl font-extrabold text-poker-emerald tracking-wider">
            $ {numDisplay}
          </span>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-xl font-bold text-white shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-sm font-semibold text-slate-400 flex items-center justify-center transition-all active:scale-95"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-xl font-bold text-white shadow-sm flex items-center justify-center transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-slate-300 flex items-center justify-center transition-all active:scale-95"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full h-13 py-3.5 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark text-white font-bold rounded-xl shadow-neon-emerald flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Check className="w-5 h-5" /> Confirmar valor
        </button>
      </div>
    </div>
  );
};
