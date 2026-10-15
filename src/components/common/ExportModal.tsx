import React from 'react';
import { X, FileSpreadsheet, FileCode } from 'lucide-react';
import { SessionConfig, RecordedHand } from '../../types/session';
import { exportUtils } from '../../utils/exportUtils';

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
  if (!isOpen) return null;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0E1724] border border-[#223348] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom duration-200">
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
