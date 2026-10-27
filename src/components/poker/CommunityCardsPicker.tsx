import React, { useState, useEffect } from 'react';
import { Card, CardRank, Suit } from '../../types/poker';
import { X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CommunityCardsPickerProps {
  flopCards: Card[];
  onAddCard: (card: Card) => void;
  onRemoveCard: (index: number) => void;
  onClear: () => void;
  isCardInUse: (card: Card) => boolean;
}

const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

const SUITS: {
  suit: Suit;
  symbol: string;
  colorClass: string;
  cardTextClass: string;
  bgClass: string;
  borderClass: string;
}[] = [
  {
    suit: 'spades',
    symbol: '♠',
    colorClass: 'text-slate-100',
    cardTextClass: 'text-slate-900',
    bgClass: 'bg-slate-800',
    borderClass: 'border-slate-600'
  },
  {
    suit: 'hearts',
    symbol: '♥',
    colorClass: 'text-red-500',
    cardTextClass: 'text-red-600',
    bgClass: 'bg-red-950/60',
    borderClass: 'border-red-600/50'
  },
  {
    suit: 'diamonds',
    symbol: '♦',
    colorClass: 'text-blue-400',
    cardTextClass: 'text-blue-600',
    bgClass: 'bg-blue-950/60',
    borderClass: 'border-blue-500/50'
  },
  {
    suit: 'clubs',
    symbol: '♣',
    colorClass: 'text-emerald-400',
    cardTextClass: 'text-emerald-700',
    bgClass: 'bg-emerald-950/60',
    borderClass: 'border-emerald-500/50'
  }
];

export const CommunityCardsPicker: React.FC<CommunityCardsPickerProps> = ({
  flopCards,
  onAddCard,
  onRemoveCard,
  onClear,
  isCardInUse
}) => {
  const [selectedRank, setSelectedRank] = useState<CardRank | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [isManualExpanded, setIsManualExpanded] = useState<boolean>(false);

  const isFlopComplete = flopCards.length >= 3;
  const showPickerGrid = !isFlopComplete || isManualExpanded;

  useEffect(() => {
    if (flopCards.length === 3) {
      setIsManualExpanded(false);
    }
  }, [flopCards.length]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleRankClick = (rank: CardRank) => {
    triggerHaptic();
    if (selectedSuit) {
      if (!isCardInUse({ rank, suit: selectedSuit })) {
        onAddCard({ rank, suit: selectedSuit });
        setSelectedRank(null);
        setSelectedSuit(null);
      }
    } else {
      setSelectedRank(rank === selectedRank ? null : rank);
    }
  };

  const handleSuitClick = (suit: Suit) => {
    triggerHaptic();
    if (selectedRank) {
      if (!isCardInUse({ rank: selectedRank, suit })) {
        onAddCard({ rank: selectedRank, suit });
        setSelectedRank(null);
        setSelectedSuit(null);
      }
    } else {
      setSelectedSuit(suit === selectedSuit ? null : suit);
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-[#0A121D]/95 border border-[#1A293D] rounded-2xl p-3 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs xs:text-sm font-bold text-white tracking-wide whitespace-nowrap">
            Cartas del Flop ({flopCards.length}/3)
          </span>
          {isFlopComplete && (
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-poker-emerald text-[10px] font-bold flex-shrink-0">
              Completo
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isFlopComplete && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsManualExpanded((prev) => !prev);
              }}
              className="h-8 px-2 xs:px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-[#142132] border border-[#233347] active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="xs:hidden">{showPickerGrid ? 'Ocultar' : 'Teclado'}</span>
              <span className="hidden xs:inline">{showPickerGrid ? 'Ocultar teclado' : 'Teclado'}</span>
              {showPickerGrid ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {flopCards.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onClear();
                setSelectedRank(null);
                setSelectedSuit(null);
              }}
              aria-label="Borrar cartas del flop"
              title="Borrar cartas del flop"
              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-red-400 flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Borrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Board Display (3 Flop Cards + Turn/River honest placeholders) */}
      <div className="flex items-center justify-center gap-1.5 xs:gap-2 py-1">
        {[0, 1, 2].map((idx) => {
          const card = flopCards[idx];
          if (!card) {
            return (
              <div
                key={idx}
                className="w-12 h-16 xs:w-14 xs:h-19 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-900/30 flex items-center justify-center text-slate-400 text-xs font-semibold"
              >
                Flop {idx + 1}
              </div>
            );
          }

          const suitInfo = SUITS.find((s) => s.suit === card.suit)!;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                triggerHaptic();
                onRemoveCard(idx);
              }}
              title="Tocar para quitar carta del flop"
              className="relative w-12 h-16 xs:w-14 xs:h-19 bg-white hover:bg-red-50 rounded-xl shadow-xl p-1.5 flex flex-col justify-between border border-slate-200 animate-in zoom-in-95 duration-150 select-none active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-between w-full leading-none">
                <span className={cn('text-xs font-black', suitInfo.cardTextClass)}>
                  {card.rank}
                </span>
                <X className="w-3 h-3 text-slate-400" />
              </div>

              <div className={cn('text-lg xs:text-xl font-bold text-center leading-none', suitInfo.cardTextClass)}>
                {suitInfo.symbol}
              </div>

              <div className={cn('text-[10px] font-bold self-end leading-none', suitInfo.cardTextClass)}>
                {suitInfo.symbol}
              </div>
            </button>
          );
        })}

        {/* Turn & River Honest Placeholders */}
        <div className="w-10 h-16 xs:w-12 xs:h-19 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-center text-slate-600 text-[10px] font-semibold opacity-50">
          <span>Turn</span>
          <span className="text-[8px] uppercase">Próx.</span>
        </div>
        <div className="w-10 h-16 xs:w-12 xs:h-19 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-center text-slate-600 text-[10px] font-semibold opacity-50">
          <span>River</span>
          <span className="text-[8px] uppercase">Próx.</span>
        </div>
      </div>

      {/* Matriz de Rangos y Palos (Se pliega automáticamente al completar las 3 cartas del Flop) */}
      {showPickerGrid && (
        <div className="flex flex-col gap-1.5 pt-0.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-5 gap-1.5">
            {RANKS.slice(0, 5).map((rank) => (
              <button
                key={rank}
                type="button"
                disabled={flopCards.length >= 3}
                onClick={() => handleRankClick(rank)}
                className={cn(
                  'h-9 rounded-xl font-bold text-sm transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
                  selectedRank === rank
                    ? 'bg-poker-emerald text-white shadow-neon-emerald scale-105'
                    : 'bg-[#142132] text-slate-200 border border-[#203144] hover:border-slate-500'
                )}
              >
                {rank}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {RANKS.slice(5, 10).map((rank) => (
              <button
                key={rank}
                type="button"
                disabled={flopCards.length >= 3}
                onClick={() => handleRankClick(rank)}
                className={cn(
                  'h-9 rounded-xl font-bold text-sm transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
                  selectedRank === rank
                    ? 'bg-poker-emerald text-white shadow-neon-emerald scale-105'
                    : 'bg-[#142132] text-slate-200 border border-[#203144] hover:border-slate-500'
                )}
              >
                {rank}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-w-[60%] mx-auto w-full">
            {RANKS.slice(10, 13).map((rank) => (
              <button
                key={rank}
                type="button"
                disabled={flopCards.length >= 3}
                onClick={() => handleRankClick(rank)}
                className={cn(
                  'h-9 rounded-xl font-bold text-sm transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
                  selectedRank === rank
                    ? 'bg-poker-emerald text-white shadow-neon-emerald scale-105'
                    : 'bg-[#142132] text-slate-200 border border-[#203144] hover:border-slate-500'
                )}
              >
                {rank}
              </button>
            ))}
          </div>

          {/* 4 Suits Selector Row */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {SUITS.map(({ suit, symbol, colorClass, bgClass, borderClass }) => {
              const isSelected = selectedSuit === suit;
              const isCurrentRankTaken = selectedRank
                ? isCardInUse({ rank: selectedRank, suit })
                : false;

              return (
                <button
                  key={suit}
                  type="button"
                  disabled={flopCards.length >= 3 || isCurrentRankTaken}
                  onClick={() => handleSuitClick(suit)}
                  className={cn(
                    'h-10 rounded-xl text-xl font-bold border flex items-center justify-center transition-all select-none active:scale-90 disabled:opacity-30 disabled:pointer-events-none',
                    bgClass,
                    borderClass,
                    colorClass,
                    isSelected ? 'ring-2 ring-white shadow-lg scale-105' : 'hover:brightness-125'
                  )}
                >
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
