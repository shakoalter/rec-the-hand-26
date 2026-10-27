import React, { useState } from 'react';
import { X, FileSpreadsheet, FileCode, MessageCircle, Copy, Check } from 'lucide-react';
import { SessionConfig, RecordedHand } from '../../types/session';
import { exportUtils, WHATSAPP_MAX_HANDS_PER_BLOCK } from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionConfig;
  hands: RecordedHand[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  session,
  hands
}) => {
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const blocks = exportUtils.formatSessionWhatsAppBlocks(session, hands, WHATSAPP_MAX_HANDS_PER_BLOCK);
  const isMultiBlock = blocks.length > 1;

  const handleExportWhatsApp = (blockIndex = 0) => {
    triggerHaptic();
    const fullText = exportUtils.formatSessionAsPlainText(session, hands);
    exportUtils.copyTextToClipboard(fullText).catch(() => {});
    const targetBlock = blocks[blockIndex] || blocks[0];
    const whatsappUrl = exportUtils.buildWhatsAppUrlFromText(targetBlock);
    exportUtils.openWhatsAppUrl(whatsappUrl);
    if (!isMultiBlock) {
      onClose();
    }
  };

  const handleCopyFullHistory = async () => {
    triggerHaptic();
    const fullText = exportUtils.formatSessionAsPlainText(session, hands);
    const ok = await exportUtils.copyTextToClipboard(fullText);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  const handleExportCsv = () => {
    triggerHaptic();
    const csvContent = exportUtils.formatSessionAsCsv(session, hands);
    const filename = `recthehand_sesion_${new Date().toISOString().slice(0, 10)}.csv`;
    exportUtils.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    onClose();
  };

  const handleExportJson = () => {
    triggerHaptic();
    const jsonContent = exportUtils.formatSessionAsJson(session, hands);
    const filename = `recthehand_sesion_${new Date().toISOString().slice(0, 10)}.json`;
    exportUtils.downloadFile(jsonContent, filename, 'application/json');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-sm bg-[#0E1724] border border-[#223348] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom duration-200 max-h-[88dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Exportar Sesión</h3>
            <p className="text-xs text-slate-400">
              {hands.length} manos listas para descargar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#182638] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleExportWhatsApp(0)}
              className="w-full p-4 rounded-2xl bg-[#142132] hover:bg-[#1C2C40] border border-emerald-500/40 flex items-center justify-between gap-3.5 text-left active:scale-98 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-poker-emerald group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">
                    {isMultiBlock ? `Enviar por WhatsApp (Parte 1/${blocks.length})` : 'Enviar por WhatsApp'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Resumen compacto optimizado para análisis
                  </span>
                </div>
              </div>
            </button>

            {isMultiBlock && (
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {blocks.slice(1).map((_, idx) => {
                  const partNumber = idx + 2;
                  return (
                    <button
                      key={partNumber}
                      type="button"
                      onClick={() => handleExportWhatsApp(idx + 1)}
                      className="py-2 px-3 rounded-xl bg-[#111C2B] hover:bg-[#18273B] border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Parte {partNumber}/{blocks.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyFullHistory}
              className="w-full py-2 px-3 rounded-xl bg-[#101926] hover:bg-[#162234] border border-slate-700/70 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-poker-emerald" />
                  <span className="text-poker-emerald">Historial copiado al portapapeles</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar texto para WhatsApp / ChatGPT</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full p-4 rounded-2xl bg-[#142132] hover:bg-[#1C2C40] border border-[#233347] flex items-center gap-3.5 text-left active:scale-98 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-poker-emerald group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Formato CSV</span>
              <span className="text-xs text-slate-400">Ideal para Excel, Google Sheets y análisis</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full p-4 rounded-2xl bg-[#142132] hover:bg-[#1C2C40] border border-[#233347] flex items-center gap-3.5 text-left active:scale-98 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">Formato JSON</span>
              <span className="text-xs text-slate-400">Copia de seguridad completa con metadatos</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
