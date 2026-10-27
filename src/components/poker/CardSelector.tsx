import React, { useState } from 'react';
import { Card, CardRank, Suit } from '../../types/poker';
import { X, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CardSelectorProps {
  cards: Card[];
  onAddCard: (card: Card) => void;
  onRemoveCard: (index: number) => void;
  onClear: () => void;
  maxCards?: number;
  label?: string;
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
    <div className="flex flex-col gap-2 bg-[#0A121D]/95 border border-[#1A293D] rounded-2xl p-3 shadow-xl select-none">
      {/* Cabecera Integrada con los Slots de Cartas Seleccionadas */}
      <div className="flex items-center justify-between gap-2 pb-0.5">
        <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">
            {label}
          </span>

          {/* Slots inline de cartas (tocar carta completa para quitarla) */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxCards }).map((_, idx) => {
              const card = cards[idx];
              if (!card) {
                return (
                  <div
                    key={idx}
                    className="h-9 px-2 xs:px-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center text-slate-400 text-xs font-semibold min-w-[48px] xs:min-w-[54px] whitespace-nowrap"
                  >
                    Carta {idx + 1}
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
                  title="Tocar para quitar esta carta"
                  className="h-9 px-2 xs:px-2.5 bg-white hover:bg-red-50 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 active:scale-95 transition-all min-w-[54px] xs:min-w-[58px] justify-between"
                >
                  <span className={cn('text-sm font-black flex items-center gap-0.5', suitInfo.cardTextClass)}>
                    <span>{card.rank}</span>
                    <span>{suitInfo.symbol}</span>
                  </span>
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              );
            })}
          </div>
        </div>

        {cards.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClear();
              setSelectedRank(null);
              setSelectedSuit(null);
            }}
            aria-label="Borrar cartas seleccionadas"
            title="Borrar cartas seleccionadas"
            className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-red-400 flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 active:scale-95 transition-all flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Borrar</span>
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 truncate text-right">
            {selectedRank
              ? `Elegí palo para ${selectedRank}`
              : selectedSuit
                ? 'Elegí rango'
                : 'Rango + Palo'}
          </span>
        )}
      </div>

      {/* Matriz de 13 Rangos (3 filas cómodas de h-10 = 40px) */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-5 gap-1.5">
          {RANKS.slice(0, 5).map((rank) => (
            <button
              key={rank}
              type="button"
              disabled={cards.length >= maxCards}
              onClick={() => handleRankClick(rank)}
              className={cn(
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
              className={cn(
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
              className={cn(
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

      {/* Fila de 4 Palos (h-11 = 44px) */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        {SUITS.map(({ suit, symbol, colorClass, bgClass, borderClass }) => {
          const isSelected = selectedSuit === suit;
          const isCurrentRankTaken = selectedRank ? isCardDuplicate(selectedRank, suit) : false;

          return (
            <button
              key={suit}
              type="button"
              disabled={cards.length >= maxCards || isCurrentRankTaken}
              onClick={() => handleSuitClick(suit)}
              className={cn(
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
    </div>
  );
};
