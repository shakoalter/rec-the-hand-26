import React, { useState, useEffect } from 'react';
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
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStrValue(initialValue > 0 ? initialValue.toString() : '0');
      setHasTyped(false);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDigit = (digit: string) => {
    triggerHaptic();
    if (!hasTyped) {
      setStrValue(digit);
      setHasTyped(true);
      return;
    }
    if (strValue === '0') {
      setStrValue(digit);
    } else if (strValue.length < 8) {
      setStrValue(strValue + digit);
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    setHasTyped(true);
    if (strValue.length > 1) {
      setStrValue(strValue.slice(0, -1));
    } else {
      setStrValue('0');
    }
  };

  const handleClear = () => {
    triggerHaptic();
    setHasTyped(true);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-2.5 sm:p-3">
      <div className="w-full max-w-sm bg-[#0E1724] border border-[#223348] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-200 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#182638] flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-all"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-[#080E16] border border-[#1C2C3E] rounded-2xl py-3 sm:py-4 px-4 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-poker-emerald tracking-wider">
            $ {numDisplay}
          </span>
        </div>

        {/* Keypad Grid (Adaptativo para 320x568+) */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-12 sm:h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-xl font-bold text-white shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 sm:h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-sm font-bold text-slate-300 flex items-center justify-center transition-all active:scale-95"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 sm:h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-xl font-bold text-white shadow-sm flex items-center justify-center transition-all active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 sm:h-14 bg-[#142132] active:bg-[#1E3048] rounded-xl text-slate-200 flex items-center justify-center transition-all active:scale-95"
            aria-label="Borrar último dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full h-12 sm:h-13 bg-gradient-to-r from-poker-emerald to-poker-emeraldDark text-white font-bold rounded-xl shadow-neon-emerald flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Check className="w-5 h-5" /> Confirmar valor
        </button>
      </div>
    </div>
  );
};
