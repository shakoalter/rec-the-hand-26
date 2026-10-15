import { SessionConfig, RecordedHand } from '../types/session';

export const exportUtils = {
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
