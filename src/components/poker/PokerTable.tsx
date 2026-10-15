import React from 'react';
import { TablePosition } from '../../types/poker';
import { getPositionsForPlayerCount } from '../../core/positionEngine';
import { clsx } from 'clsx';

interface PokerTableProps {
  playerCount: number;
  heroPosition: TablePosition;
  dealerPosition?: TablePosition;
  onSelectHeroPosition: (pos: TablePosition) => void;
  className?: string;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  playerCount,
  heroPosition,
  dealerPosition = 'BTN',
  onSelectHeroPosition,
  className
}) => {
  const positions = getPositionsForPlayerCount(playerCount);

  // Distribución elíptica de los asientos alrededor del óvalo (coordenadas porcentuales)
  const getCoordinates = (index: number, total: number) => {
    // Offset para que Hero / BTN quede en la zona inferior ergonómica
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2;
    const rx = 38; // Radio horizontal %
    const ry = 36; // Radio vertical %
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
    <div className={clsx('relative w-full aspect-[16/11] max-w-sm mx-auto my-1 select-none', className)}>
      {/* Paño de la mesa (Óvalo exterior con textura y borde luminoso) */}
      <div className="absolute inset-4 rounded-[60px] bg-gradient-to-b from-[#0A1624] via-[#08121E] to-[#050D15] border-2 border-[#1E3048] shadow-[inset_0_0_24px_rgba(0,0,0,0.8),0_8px_20px_rgba(0,0,0,0.6)] flex items-center justify-center">
        {/* Línea interior de la mesa */}
        <div className="w-[82%] h-[78%] rounded-[48px] border border-cyan-500/15 border-dashed flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500/60">
            Texas Hold'em Live
          </span>
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
            className={clsx(
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 z-20 flex flex-col items-center justify-center cursor-pointer active:scale-95',
              isHero
                ? 'w-13 h-13 bg-[#0B251B] border-2 border-poker-emerald shadow-neon-emerald ring-2 ring-poker-emerald/30'
                : 'w-11 h-11 bg-[#101B29] border border-[#23354C] hover:border-slate-400 text-slate-300'
            )}
            aria-label={`Seleccionar asiento ${pos}`}
          >
            {/* Dealer Button Badge */}
            {isDealer && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-md border border-amber-200">
                D
              </span>
            )}

            {isHero ? (
              <>
                <span className="text-[10px] font-black text-poker-emerald tracking-wider leading-none">
                  HERO
                </span>
                <span className="text-[9px] font-bold text-emerald-300/80 leading-none mt-0.5">
                  {pos}
                </span>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-300 tracking-tight">
                {pos}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
