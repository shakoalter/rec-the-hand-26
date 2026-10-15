import React, { useState } from 'react';
import { Card, CardRank, Suit } from '../../types/poker';
import { X, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface CardSelectorProps {
  cards: Card[];
  onAddCard: (card: Card) => void;
  onRemoveCard: (index: number) => void;
  onClear: () => void;
  maxCards?: number;
  label?: string;
}

const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

const SUITS: { suit: Suit; symbol: string; colorClass: string; bgClass: string; borderClass: string }[] = [
  { suit: 'spades', symbol: '♠', colorClass: 'text-slate-100', bgClass: 'bg-slate-800', borderClass: 'border-slate-600' },
  { suit: 'hearts', symbol: '♥', colorClass: 'text-red-500', bgClass: 'bg-red-950/60', borderClass: 'border-red-600/50' },
  { suit: 'diamonds', symbol: '♦', colorClass: 'text-blue-400', bgClass: 'bg-blue-950/60', borderClass: 'border-blue-500/50' },
  { suit: 'clubs', symbol: '♣', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-950/60', borderClass: 'border-emerald-500/50' },
];

export const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  onAddCard,
  onRemoveCard,
  onClear,
  maxCards = 2,
  label = 'Tu mano'
}) => {
  const [selectedRank, setSelectedRank] = useState<CardRank | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleRankClick = (rank: CardRank) => {
    triggerHaptic();
    if (selectedSuit) {
      // Si ya teníamos el palo seleccionado, combinamos inmediatamente
      onAddCard({ rank, suit: selectedSuit });
      setSelectedRank(null);
      setSelectedSuit(null);
    } else {
      setSelectedRank(rank === selectedRank ? null : rank);
    }
  };

  const handleSuitClick = (suit: Suit) => {
    triggerHaptic();
    if (selectedRank) {
      // Si ya teníamos el rango seleccionado, combinamos inmediatamente
      onAddCard({ rank: selectedRank, suit });
      setSelectedRank(null);
      setSelectedSuit(null);
    } else {
      setSelectedSuit(suit === selectedSuit ? null : suit);
    }
  };

  const isCardDuplicate = (rank: CardRank, suit: Suit) => {
    return cards.some((c) => c.rank === rank && c.suit === suit);
  };

  return (
    <div className="flex flex-col gap-2.5 bg-[#0A121D]/90 border border-[#1A293D] rounded-2xl p-3.5 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white tracking-wide">{label}</span>
        {cards.length > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClear();
            }}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-800/50 border border-slate-700/50 active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar</span>
          </button>
        )}
      </div>

      {/* Ranks Matrix (13 buttons in 3 rows) */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-5 gap-1.5">
          {RANKS.slice(0, 5).map((rank) => (
            <button
              key={rank}
              type="button"
              disabled={cards.length >= maxCards}
              onClick={() => handleRankClick(rank)}
              className={clsx(
                'h-10 rounded-xl font-bold text-base transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
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
              disabled={cards.length >= maxCards}
              onClick={() => handleRankClick(rank)}
              className={clsx(
                'h-10 rounded-xl font-bold text-base transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
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
              disabled={cards.length >= maxCards}
              onClick={() => handleRankClick(rank)}
              className={clsx(
                'h-10 rounded-xl font-bold text-base transition-all select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
                selectedRank === rank
                  ? 'bg-poker-emerald text-white shadow-neon-emerald scale-105'
                  : 'bg-[#142132] text-slate-200 border border-[#203144] hover:border-slate-500'
              )}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Suits Selector Row */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {SUITS.map(({ suit, symbol, colorClass, bgClass, borderClass }) => {
          const isSelected = selectedSuit === suit;
          const isCurrentRankTaken = selectedRank ? isCardDuplicate(selectedRank, suit) : false;

          return (
            <button
              key={suit}
              type="button"
              disabled={cards.length >= maxCards || isCurrentRankTaken}
              onClick={() => handleSuitClick(suit)}
              className={clsx(
                'h-11 rounded-xl text-2xl font-bold border flex items-center justify-center transition-all select-none active:scale-90 disabled:opacity-30 disabled:pointer-events-none',
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

      {/* Visual Display of Selected Cards */}
      <div className="flex items-center justify-center gap-3 pt-2 min-h-[88px]">
        {Array.from({ length: maxCards }).map((_, idx) => {
          const card = cards[idx];
          if (!card) {
            return (
              <div
                key={idx}
                className="w-14 h-20 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-900/30 flex items-center justify-center text-slate-600 text-xs font-semibold"
              >
                Slot {idx + 1}
              </div>
            );
          }

          const suitInfo = SUITS.find((s) => s.suit === card.suit)!;

          return (
            <div
              key={idx}
              className="relative w-15 h-21 bg-white rounded-xl shadow-2xl p-1.5 flex flex-col justify-between border border-slate-200 animate-in zoom-in-95 duration-150 select-none group"
            >
              {/* Top rank & suit */}
              <div className="flex flex-col items-start leading-none">
                <span className={clsx('text-xs font-black', suitInfo.suit === 'hearts' ? 'text-red-600' : suitInfo.suit === 'diamonds' ? 'text-blue-600' : suitInfo.suit === 'clubs' ? 'text-emerald-700' : 'text-slate-900')}>
                  {card.rank}
                </span>
                <span className={clsx('text-xs font-bold -mt-0.5', suitInfo.colorClass.replace('text-', 'text-'))}>
                  {suitInfo.symbol}
                </span>
              </div>

              {/* Center Suit */}
              <div className={clsx('text-xl font-bold text-center leading-none', suitInfo.suit === 'hearts' ? 'text-red-600' : suitInfo.suit === 'diamonds' ? 'text-blue-600' : suitInfo.suit === 'clubs' ? 'text-emerald-700' : 'text-slate-900')}>
                {suitInfo.symbol}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onRemoveCard(idx);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                aria-label="Quitar carta"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
