import React from 'react';
import { Card, TablePosition } from '../../types/poker';
import { getPositionsForPlayerCount } from '../../core/positionEngine';
import { cn } from '../../utils/cn';

interface PokerTableProps {
  playerCount: number;
  heroPosition: TablePosition;
  dealerPosition?: TablePosition;
  heroCards?: Card[];
  onSelectHeroPosition: (pos: TablePosition) => void;
  onRemoveHeroCard?: (index: number) => void;
  className?: string;
}

const SUIT_META: Record<Card['suit'], { symbol: string; textClass: string }> = {
  spades: { symbol: '♠', textClass: 'text-slate-900' },
  hearts: { symbol: '♥', textClass: 'text-red-600' },
  diamonds: { symbol: '♦', textClass: 'text-blue-600' },
  clubs: { symbol: '♣', textClass: 'text-emerald-700' }
};

export const PokerTable: React.FC<PokerTableProps> = ({
  playerCount,
  heroPosition,
  dealerPosition = 'BTN',
  heroCards = [],
  onSelectHeroPosition,
  onRemoveHeroCard,
  className
}) => {
  const positions = getPositionsForPlayerCount(playerCount);

  // Distribución elíptica optimizada alrededor del óvalo
  const getCoordinates = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2;
    const rx = 41; // Radio horizontal %
    const ry = 38; // Radio vertical %
    const x = 50 + rx * Math.cos(angle);
    const y = 50 + ry * Math.sin(angle);
    return { x, y };
  };

  const handleSeatClick = (pos: TablePosition) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    onSelectHeroPosition(pos);
  };

  return (
    <div
      className={cn(
        'relative w-full aspect-[16/9.5] max-w-sm mx-auto my-0.5 select-none',
        className
      )}
    >
      {/* Paño de la mesa (Óvalo exterior con margen optimizado inset-2.5) */}
      <div className="absolute inset-2.5 rounded-[56px] bg-gradient-to-b from-[#0A1624] via-[#08121E] to-[#050D15] border-2 border-[#1E3048] shadow-[inset_0_0_20px_rgba(0,0,0,0.85),0_6px_16px_rgba(0,0,0,0.5)] flex items-center justify-center">
        {/* Línea interior de la mesa con información viva de Hero */}
        <div className="w-[78%] h-[72%] rounded-[44px] border border-cyan-500/15 border-dashed flex flex-col items-center justify-center gap-1 px-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Posición:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-poker-emerald font-black text-xs">
              {heroPosition}
            </span>
          </div>

          {heroCards.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              {heroCards.map((c, idx) => {
                const meta = SUIT_META[c.suit];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onRemoveHeroCard?.(idx)}
                    title="Tocar para quitar carta"
                    className={cn(
                      'px-2 py-0.5 rounded-md bg-white font-black text-xs shadow-md flex items-center gap-0.5 active:scale-90 transition-transform',
                      meta.textClass
                    )}
                  >
                    <span>{c.rank}</span>
                    <span>{meta.symbol}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] font-medium text-slate-400/80">
              Tocá un asiento para cambiar posición
            </span>
          )}
        </div>
      </div>

      {/* Asientos distribuidos */}
      {positions.map((pos, idx) => {
        const { x, y } = getCoordinates(idx, positions.length);
        const isHero = heroPosition === pos;
        const isDealer = dealerPosition === pos;

        return (
          <button
            key={pos}
            type="button"
            onClick={() => handleSeatClick(pos)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 z-20 flex flex-col items-center justify-center cursor-pointer active:scale-95',
              isHero
                ? 'w-12 h-12 bg-[#0B251B] border-2 border-poker-emerald shadow-neon-emerald ring-2 ring-poker-emerald/30'
                : 'w-11 h-11 bg-[#101B29] border border-[#23354C] hover:border-slate-400 text-slate-200'
            )}
            aria-label={`Seleccionar asiento ${pos}`}
          >
            {/* Dealer Button Badge */}
            {isDealer && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-md border border-amber-200">
                D
              </span>
            )}

            {isHero ? (
              <>
                <span className="text-[9px] font-black text-poker-emerald tracking-wider leading-none">
                  HERO
                </span>
                <span className="text-[10px] font-extrabold text-emerald-200 leading-none mt-0.5">
                  {pos}
                </span>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-200 tracking-tight">
                {pos}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
