import { SessionConfig, RecordedHand } from '../types/session';
import { Card, PlayerAction, Suit, TablePosition } from '../types/poker';
import { getPreflopActionOrder } from '../core/positionEngine';
import { bettingEngine } from '../core/bettingEngine';

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

const AUTO_GENERATED_NOTES = new Set([
  'Hero fold preflop',
  'Hero gana preflop (todos foldearon)',
  'Hero fold en flop'
]);

export const WHATSAPP_MAX_HANDS_PER_BLOCK = 30;

const formatCardSymbol = (card: Card): string => {
  return `${card.rank}${SUIT_SYMBOLS[card.suit] || card.suit[0].toUpperCase()}`;
};

const formatMoney = (amount: number): string => {
  return `$${amount.toLocaleString('es-AR')}`;
};

const formatBB = (stack: number | undefined, bb: number): string => {
  if (typeof stack !== 'number' || stack <= 0 || !bb || bb <= 0) return '';
  const bbValue = stack / bb;
  const formatted = Number.isInteger(bbValue)
    ? String(bbValue)
    : bbValue.toFixed(1).replace(/\.0$/, '');
  return ` (${formatted} BB)`;
};

const formatSessionDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} · ${hours}:${minutes}`;
};

export interface SessionStatsSummary {
  totalHands: number;
  validHands: number;
  vpipHands: number;
  pfrHands: number;
  vpipPercent: number;
  pfrPercent: number;
}

export interface PreflopInterpretation {
  lines: string[];
  heroFoldedPreflop: boolean;
  isRoundComplete: boolean;
  isHandOver: boolean;
  winnerPosition?: TablePosition;
  playersToFlop: number;
}

export interface OpenWhatsAppResult {
  success: boolean;
  method: 'location' | 'window' | 'failed';
  error?: string;
}

/**
 * Calcula las estadísticas descriptivas de la sesión (Manos, VPIP, PFR)
 * excluyendo del denominador aquellas manos incompletas donde Hero no llegó a registrar decisión.
 */
export function calculateSessionStats(hands: RecordedHand[]): SessionStatsSummary {
  const totalHands = hands.length;

  const validHandsList = hands.filter((h) => {
    const heroActed = h.preflopActions.some((a) => a.isHero);
    return heroActed || h.wasHeroFoldPreflop;
  });

  const validHands = validHandsList.length;

  const vpipHands = validHandsList.filter((h) =>
    h.preflopActions.some(
      (a) =>
        a.isHero &&
        (a.actionType === 'limp' ||
          a.actionType === 'call' ||
          a.actionType === 'bet' ||
          a.actionType === 'raise' ||
          a.actionType === '3bet' ||
          a.actionType === '4bet' ||
          a.actionType === 'allin')
    )
  ).length;

  const pfrHands = validHandsList.filter((h) =>
    h.preflopActions.some(
      (a) =>
        a.isHero &&
        (a.actionType === 'raise' ||
          a.actionType === '3bet' ||
          a.actionType === '4bet' ||
          a.actionType === 'allin')
    )
  ).length;

  const vpipPercent = validHands > 0 ? Math.round((vpipHands / validHands) * 100) : 0;
  const pfrPercent = validHands > 0 ? Math.round((pfrHands / validHands) * 100) : 0;

  return {
    totalHands,
    validHands,
    vpipHands,
    pfrHands,
    vpipPercent,
    pfrPercent
  };
}

/**
 * Interpreta y comprime visualmente la secuencia preflop de una mano
 * sin mutar los datos originales almacenados.
 */
export function interpretPreflopHand(
  hand: RecordedHand,
  session: SessionConfig
): PreflopInterpretation {
  const actions = hand.preflopActions || [];
  const actionOrder = getPreflopActionOrder(session.playerCount);
  const bbAmount = session.blinds.bb;

  let seats = bettingEngine.initPreflopSeats(actionOrder, hand.heroPosition, session.blinds);
  let highestBet = bbAmount;
  let lastPosIndex = -1;

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const posIndex = actionOrder.indexOf(act.position);

    // Si en el registro se saltaron posiciones intermedias que aún no habían actuado,
    // en orden horario esas posiciones foldearon en frío antes de esta acción.
    if (posIndex !== -1 && actionOrder.length > 0) {
      if (lastPosIndex === -1) {
        for (let idx = 0; idx < posIndex; idx++) {
          const skippedPos = actionOrder[idx];
          const seat = seats[skippedPos];
          if (seat && !seat.hasActedInRound && seat.status === 'active') {
            seats = {
              ...seats,
              [skippedPos]: {
                ...seat,
                status: 'folded',
                hasActedInRound: true
              }
            };
          }
        }
      } else if (posIndex !== lastPosIndex) {
        let step = 1;
        while ((lastPosIndex + step) % actionOrder.length !== posIndex && step < actionOrder.length) {
          const skippedPos = actionOrder[(lastPosIndex + step) % actionOrder.length];
          const seat = seats[skippedPos];
          if (seat && !seat.hasActedInRound && seat.status === 'active') {
            seats = {
              ...seats,
              [skippedPos]: {
                ...seat,
                status: 'folded',
                hasActedInRound: true
              }
            };
          }
          step++;
        }
      }
      lastPosIndex = posIndex;
    }

    if (seats[act.position]) {
      const res = bettingEngine.applyAction(
        seats,
        act.position,
        act.actionType,
        act.amount,
        highestBet,
        bbAmount
      );
      seats = res.updatedSeats;
      highestBet = res.newHighestBet;
    }
  }

  const lastActingPos =
    actions.length > 0 ? actions[actions.length - 1].position : actionOrder[0] || hand.heroPosition;

  const evalStatus = bettingEngine.evaluateRound(actionOrder, seats, lastActingPos, highestBet);

  const heroFoldedInActions = actions.some((a) => a.isHero && a.actionType === 'fold');
  const heroFoldedOnFlop = Boolean(hand.flopActions?.some((a) => a.isHero && a.actionType === 'fold'));
  const heroFoldedPreflop =
    heroFoldedInActions || (hand.wasHeroFoldPreflop && !heroFoldedOnFlop && actions.length === 0);

  const noteIndicatesHeroWonPreflop = Boolean(
    hand.notes && hand.notes.toLowerCase().includes('hero gana preflop')
  );

  const isHandOver = evalStatus.isHandOver || noteIndicatesHeroWonPreflop;
  const winnerPosition = noteIndicatesHeroWonPreflop
    ? hand.heroPosition
    : evalStatus.winnerPosition;
  const isRoundComplete = evalStatus.isRoundComplete || isHandOver;

  // Compresión visual de las acciones preflop
  const lines: string[] = [];

  if (actions.length === 0) {
    if (heroFoldedPreflop) {
      lines.push(`• Hero (${hand.heroPosition}): Fold`);
    } else {
      lines.push('• Sin acciones registradas');
    }
    return {
      lines,
      heroFoldedPreflop,
      isRoundComplete,
      isHandOver,
      winnerPosition,
      playersToFlop: evalStatus.activePlayersCount
    };
  }

  const firstHeroIndex = actions.findIndex((a) => a.isHero);
  let startIndex = 0;

  // 3.1. Folds consecutivos antes de Hero
  if (firstHeroIndex > 0) {
    const allBeforeHeroFolded = actions
      .slice(0, firstHeroIndex)
      .every((a) => a.actionType === 'fold');

    if (allBeforeHeroFolded) {
      lines.push(`• Todos foldean hasta ${hand.heroPosition}`);
      startIndex = firstHeroIndex;
    }
  } else if (firstHeroIndex === -1 && actions.every((a) => a.actionType === 'fold')) {
    if (isHandOver && winnerPosition === hand.heroPosition) {
      lines.push(`• Todos foldean hasta ${hand.heroPosition}`);
      startIndex = actions.length;
    } else {
      const lastFoldPos = actions[actions.length - 1].position;
      lines.push(`• Folds consecutivos hasta ${lastFoldPos}`);
      startIndex = actions.length;
    }
  }

  const voluntaryParticipants = new Set<TablePosition>();
  let raiseCount = 0;
  let explicitFoldAfterLastAggression = false;

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const isVoluntary =
      act.actionType === 'limp' ||
      act.actionType === 'call' ||
      act.actionType === 'bet' ||
      act.actionType === 'raise' ||
      act.actionType === '3bet' ||
      act.actionType === '4bet' ||
      act.actionType === 'allin';

    if (i < startIndex) {
      if (isVoluntary) {
        voluntaryParticipants.add(act.position);
      }
      if (
        act.actionType === 'raise' ||
        act.actionType === '3bet' ||
        act.actionType === '4bet' ||
        act.actionType === 'bet' ||
        act.actionType === 'allin'
      ) {
        raiseCount++;
      }
      continue;
    }

    const actor = act.isHero ? `Hero (${act.position})` : act.position;

    if (act.actionType === 'fold') {
      // Mostrar siempre el fold de Hero o el fold de un rival que ya había invertido voluntariamente
      if (act.isHero || voluntaryParticipants.has(act.position)) {
        lines.push(`• ${actor}: Fold`);
        explicitFoldAfterLastAggression = true;
      }
      continue;
    }

    if (act.actionType === 'check') {
      lines.push(`• ${actor}: Check`);
      continue;
    }

    if (act.actionType === 'limp') {
      voluntaryParticipants.add(act.position);
      lines.push(`• ${actor}: Limp`);
      continue;
    }

    if (act.actionType === 'call') {
      voluntaryParticipants.add(act.position);
      const amountSuffix = act.amount ? ` a ${formatMoney(act.amount)}` : '';
      lines.push(`• ${actor}: Call${amountSuffix}`);
      continue;
    }

    if (
      act.actionType === 'raise' ||
      act.actionType === '3bet' ||
      act.actionType === '4bet' ||
      act.actionType === 'bet'
    ) {
      voluntaryParticipants.add(act.position);
      raiseCount++;
      explicitFoldAfterLastAggression = false;

      let raiseLabel = 'Raise';
      if (act.actionType === '4bet' || raiseCount === 3) {
        raiseLabel = '4-bet';
      } else if (act.actionType === '3bet' || raiseCount === 2) {
        raiseLabel = '3-bet';
      } else if (raiseCount >= 4) {
        raiseLabel = `${raiseCount + 1}-bet`;
      }

      const amountSuffix = act.amount ? ` a ${formatMoney(act.amount)}` : '';
      lines.push(`• ${actor}: ${raiseLabel}${amountSuffix}`);
      continue;
    }

    if (act.actionType === 'allin') {
      voluntaryParticipants.add(act.position);
      raiseCount++;
      explicitFoldAfterLastAggression = false;
      const amountSuffix = act.amount ? ` a ${formatMoney(act.amount)}` : '';
      lines.push(`• ${actor}: All-in${amountSuffix}`);
    }
  }

  // Si la mano terminó preflop por abandono ante una subida y los rivales posteriores foldearon en frío
  if (isHandOver && raiseCount > 0 && !explicitFoldAfterLastAggression && !heroFoldedPreflop) {
    lines.push('• Rivales restantes: Fold');
  }

  return {
    lines,
    heroFoldedPreflop,
    isRoundComplete,
    isHandOver,
    winnerPosition,
    playersToFlop: evalStatus.activePlayersCount
  };
}

const formatPostflopActionLine = (action: PlayerAction): string => {
  const actor = action.isHero ? `Hero (${action.position})` : action.position;
  const labelMap: Record<string, string> = {
    fold: 'Fold',
    check: 'Check',
    limp: 'Limp',
    call: 'Call',
    bet: 'Bet',
    raise: 'Raise',
    '3bet': '3-bet',
    '4bet': '4-bet',
    allin: 'All-in'
  };
  const label = labelMap[action.actionType] || action.actionType;
  const amountSuffix =
    action.amount && action.actionType !== 'fold' && action.actionType !== 'check'
      ? ` a ${formatMoney(action.amount)}`
      : '';
  return `• ${actor}: ${label}${amountSuffix}`;
};

/**
 * Formatea una mano individual en el bloque compacto para WhatsApp.
 */
export function formatSingleHandForWhatsApp(
  hand: RecordedHand,
  session: SessionConfig
): string {
  const lines: string[] = [];
  const paddedNumber = String(hand.handNumber).padStart(3, '0');
  const heroCardsStr =
    hand.heroCards && hand.heroCards.length === 2
      ? hand.heroCards.map(formatCardSymbol).join(' ')
      : 'Sin cartas';

  lines.push(`#${paddedNumber} | ${hand.heroPosition} | ${heroCardsStr}`);

  if (typeof hand.stackAtStart === 'number' && hand.stackAtStart > 0) {
    lines.push(
      `Stack Hero: ${formatMoney(hand.stackAtStart)}${formatBB(hand.stackAtStart, session.blinds.bb)}`
    );
  }

  lines.push('');
  lines.push('PREFLOP');

  const preflop = interpretPreflopHand(hand, session);
  preflop.lines.forEach((line) => lines.push(line));

  const hasFlopCards = Boolean(hand.flopCards && hand.flopCards.length > 0);
  const hasFlopActions = Boolean(hand.flopActions && hand.flopActions.length > 0);
  const hasPostflopData = hasFlopCards || hasFlopActions;

  if (preflop.heroFoldedPreflop) {
    // Hero foldeó preflop: la participación de Hero concluyó en preflop
  } else if (preflop.isHandOver) {
    lines.push('');
    if (preflop.winnerPosition === hand.heroPosition) {
      lines.push('Hero gana preflop');
    } else if (preflop.winnerPosition) {
      lines.push(`${preflop.winnerPosition} gana preflop`);
    }
  } else if (preflop.isRoundComplete) {
    lines.push('');
    lines.push(`Jugadores al flop: ${preflop.playersToFlop}`);

    if (!hasPostflopData) {
      lines.push('Postflop: No registrado');
    } else {
      lines.push('');
      const flopBoard = hasFlopCards
        ? `: ${hand.flopCards!.map(formatCardSymbol).join(' ')}`
        : '';
      lines.push(`FLOP${flopBoard}`);
      if (hasFlopActions) {
        hand.flopActions!.forEach((act) => {
          lines.push(formatPostflopActionLine(act));
        });
      } else {
        lines.push('• Sin acciones postflop registradas');
      }
    }
  } else {
    lines.push('');
    if (hasPostflopData) {
      const flopBoard = hasFlopCards
        ? `: ${hand.flopCards!.map(formatCardSymbol).join(' ')}`
        : '';
      lines.push(`FLOP${flopBoard}`);
      if (hasFlopActions) {
        hand.flopActions!.forEach((act) => {
          lines.push(formatPostflopActionLine(act));
        });
      }
    }
    lines.push('Registro incompleto');
  }

  if (hand.notes?.trim() && !AUTO_GENERATED_NOTES.has(hand.notes.trim())) {
    lines.push(`Nota: ${hand.notes.trim()}`);
  }

  return lines.join('\n');
}

const buildSessionHeaderLines = (
  session: SessionConfig,
  stats: SessionStatsSummary,
  blockInfo?: { index: number; total: number; fromHand: number; toHand: number }
): string[] => {
  const lines: string[] = [];
  const titleSuffix = blockInfo ? ` (Parte ${blockInfo.index}/${blockInfo.total})` : '';
  lines.push(`🃏 RecTheHand | Resumen de sesión${titleSuffix}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`📅 ${formatSessionDate(session.createdAt)}`);
  lines.push(`👥 Jugadores: ${session.playerCount}`);
  lines.push(
    `💰 Ciegas: ${formatMoney(session.blinds.sb)} / ${formatMoney(session.blinds.bb)}`
  );

  if (session.straddle?.enabled) {
    const straddleAmt = session.straddle.amount
      ? formatMoney(session.straddle.amount)
      : 'Activo';
    const straddlePos = session.straddle.position ? ` (${session.straddle.position})` : '';
    lines.push(`🔥 Straddle: ${straddleAmt}${straddlePos}`);
  }

  if (session.rake?.enabled) {
    const rakePct = session.rake.percentage ? `${session.rake.percentage}%` : 'Activo';
    const rakeCap = session.rake.cap ? ` (Cap ${formatMoney(session.rake.cap)})` : '';
    lines.push(`🏛️ Rake: ${rakePct}${rakeCap}`);
  }

  lines.push(
    `🏦 Stack inicial: ${formatMoney(session.initialStack)}${formatBB(session.initialStack, session.blinds.bb)}`
  );

  if (session.notes?.trim()) {
    lines.push(`📝 Nota: ${session.notes.trim()}`);
  }

  lines.push('');
  lines.push('📊 ESTADÍSTICAS');
  lines.push(
    `Manos: ${stats.totalHands} | VPIP: ${stats.vpipPercent}% | PFR: ${stats.pfrPercent}%`
  );
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');

  if (blockInfo) {
    const fromStr = `#${String(blockInfo.fromHand).padStart(3, '0')}`;
    const toStr = `#${String(blockInfo.toHand).padStart(3, '0')}`;
    lines.push(`📋 HISTORIAL DE MANOS (${fromStr} a ${toStr})`);
  } else {
    lines.push('📋 HISTORIAL DE MANOS');
  }

  return lines;
};

export const exportUtils = {
  calculateSessionStats,
  interpretPreflopHand,
  formatSingleHandForWhatsApp,

  formatSessionAsJson(session: SessionConfig, hands: RecordedHand[]): string {
    const exportData = {
      app: 'RecTheHand',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      session,
      hands
    };
    return JSON.stringify(exportData, null, 2);
  },

  formatSessionAsCsv(session: SessionConfig, hands: RecordedHand[]): string {
    const headers = [
      'Mano',
      'Fecha',
      'PosicionHero',
      'CartasHero',
      'AccionPreflop',
      'CartasFlop',
      'AccionFlop',
      'Ciegas',
      'StackInicial',
      'Notas'
    ];

    const rows = hands.map((h) => {
      const heroCardsStr = h.heroCards
        ? h.heroCards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' ')
        : 'N/A';

      const preflopActionStr = h.preflopActions
        .map((a) => `${a.position}:${a.actionType}${a.amount ? `(${a.amount})` : ''}`)
        .join(' > ');

      const flopCardsStr = h.flopCards
        ? h.flopCards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' ')
        : '';

      const flopActionStr = h.flopActions
        ? h.flopActions.map((a) => `${a.position}:${a.actionType}${a.amount ? `(${a.amount})` : ''}`).join(' > ')
        : '';

      const dateStr = new Date(h.createdAt).toISOString();
      const blindsStr = `${session.blinds.sb}/${session.blinds.bb}`;

      return [
        h.handNumber,
        `"${dateStr}"`,
        h.heroPosition,
        `"${heroCardsStr}"`,
        `"${preflopActionStr}"`,
        `"${flopCardsStr}"`,
        `"${flopActionStr}"`,
        `"${blindsStr}"`,
        session.initialStack,
        `"${(h.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  formatSessionAsPlainText(session: SessionConfig, hands: RecordedHand[]): string {
    const stats = calculateSessionStats(hands);
    const lines = buildSessionHeaderLines(session, stats);

    lines.push('');

    if (hands.length === 0) {
      lines.push('Sin manos registradas en esta sesión.');
    } else {
      const formattedHands = hands.map((hand) => formatSingleHandForWhatsApp(hand, session));
      lines.push(formattedHands.join('\n\n'));
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('Generado con RecTheHand');

    return lines.join('\n');
  },

  /**
   * Divide sesiones extensas en bloques numerados sin truncar ninguna mano,
   * garantizando que cada bloque respete los límites de longitud de URL de WhatsApp.
   */
  formatSessionWhatsAppBlocks(
    session: SessionConfig,
    hands: RecordedHand[],
    maxHandsPerBlock: number = WHATSAPP_MAX_HANDS_PER_BLOCK
  ): string[] {
    if (hands.length <= maxHandsPerBlock) {
      return [this.formatSessionAsPlainText(session, hands)];
    }

    const stats = calculateSessionStats(hands);
    const totalBlocks = Math.ceil(hands.length / maxHandsPerBlock);
    const blocks: string[] = [];

    for (let b = 0; b < totalBlocks; b++) {
      const chunk = hands.slice(b * maxHandsPerBlock, (b + 1) * maxHandsPerBlock);
      const fromHand = chunk[0]?.handNumber || b * maxHandsPerBlock + 1;
      const toHand = chunk[chunk.length - 1]?.handNumber || b * maxHandsPerBlock + chunk.length;

      const lines = buildSessionHeaderLines(session, stats, {
        index: b + 1,
        total: totalBlocks,
        fromHand,
        toHand
      });

      lines.push('');
      lines.push(chunk.map((hand) => formatSingleHandForWhatsApp(hand, session)).join('\n\n'));
      lines.push('');
      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push('Generado con RecTheHand');

      blocks.push(lines.join('\n'));
    }

    return blocks;
  },

  buildWhatsAppUrlFromText(message: string, customPhoneNumber?: string): string {
    const envPhone =
      typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WHATSAPP_NUMBER
        ? String((import.meta as any).env.VITE_WHATSAPP_NUMBER)
        : '';
    const rawNumber = customPhoneNumber || envPhone;
    const sanitizedNumber = rawNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);

    if (sanitizedNumber) {
      return `https://api.whatsapp.com/send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedMessage}`;
  },

  generateWhatsAppUrl(
    session: SessionConfig,
    hands: RecordedHand[],
    customPhoneNumber?: string
  ): string {
    const blocks = this.formatSessionWhatsAppBlocks(session, hands);
    return this.buildWhatsAppUrlFromText(blocks[0], customPhoneNumber);
  },

  async copyTextToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback manual si falla el permiso de Clipboard API
      }
    }

    if (typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }

    return false;
  },

  openWhatsAppUrl(url: string): OpenWhatsAppResult {
    if (typeof window === 'undefined') {
      return { success: false, method: 'failed', error: 'No browser window environment' };
    }

    try {
      const userAgent = navigator.userAgent || '';
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        ('ontouchstart' in window && window.innerWidth <= 1024);

      if (isMobile) {
        window.location.href = url;
        return { success: true, method: 'location' };
      }

      const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

      if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === 'undefined') {
        window.location.href = url;
        return { success: true, method: 'location' };
      }

      return { success: true, method: 'window' };
    } catch (error) {
      try {
        window.location.href = url;
        return { success: true, method: 'location' };
      } catch (fallbackError) {
        return { success: false, method: 'failed', error: String(fallbackError) };
      }
    }
  },

  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
