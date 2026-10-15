export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardRank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  rank: CardRank;
  suit: Suit;
}

export type TablePosition = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'UTG+2' | 'MP' | 'HJ' | 'CO';

export type ActionType = 'fold' | 'check' | 'limp' | 'call' | 'bet' | 'raise' | '3bet' | '4bet' | 'allin';

export interface PlayerAction {
  id: string;
  position: TablePosition;
  isHero: boolean;
  actionType: ActionType;
  amount?: number;
  potBeforeAction?: number;
  timestamp: number;
}

export type HandStreet = 'preflop' | 'flop' | 'turn' | 'river';
