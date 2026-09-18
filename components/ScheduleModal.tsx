'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  memberNick: string;
  memberRole: string;
  initialSchedule?: string;
  onClose: () => void;
  onSave: (schedule: string) => Promise<void>;
}

export function ScheduleModal({
  isOpen,
  memberNick,
  memberRole,
  initialSchedule = '',
  onClose,
  onSave,
}: ScheduleModalProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(schedule.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPresets = ['08:00 — 12:00', '10:00 — 12:00', '14:00 — 18:00', '18:00 — 22:00', '20:00 — 00:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A]">
          <div>
            <h3 className="font-semibold text-base text-[#FAFAFA]">Horário Habitual</h3>
            <p className="text-xs text-[#A1A1AA]">{memberRole} {memberNick}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#FAFAFA] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Horário do Militar
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Ex: 10:00 — 12:00"
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
            />
            <p className="text-[11px] text-[#71717A] mt-1">
              Esse horário é manual e independe do turno cadastrado na listagem.
            </p>
          </div>

          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-semibold block mb-1.5">
              Sugestões rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSchedule(p)}
                  className="text-[11px] font-mono px-2 py-1 bg-[#1E1E22] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded border border-[#27272A] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Horário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
