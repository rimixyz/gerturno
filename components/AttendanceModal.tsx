'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { AttendanceStatus } from '@/lib/types';

interface AttendanceModalProps {
  isOpen: boolean;
  memberNick: string;
  memberRole: string;
  initialStatus?: AttendanceStatus;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialObservation?: string;
  onClose: () => void;
  onSave: (data: {
    status: AttendanceStatus;
    checkIn: string;
    checkOut: string;
    observation: string;
  }) => Promise<void>;
}

export function AttendanceModal({
  isOpen,
  memberNick,
  memberRole,
  initialStatus = 'Presente',
  initialCheckIn = '',
  initialCheckOut = '',
  initialObservation = '',
  onClose,
  onSave,
}: AttendanceModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [observation, setObservation] = useState(initialObservation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        status,
        checkIn,
        checkOut,
        observation,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setNowCheckIn = () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCheckIn(time);
  };

  const setNowCheckOut = () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCheckOut(time);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A]">
          <div>
            <h3 className="font-semibold text-base text-[#FAFAFA]">Registrar Presença</h3>
            <p className="text-xs text-[#A1A1AA]">{memberRole} {memberNick}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#FAFAFA] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
              Status de Presença
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Presente', 'Ausente', 'Justificado', 'Não registrado'] as AttendanceStatus[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                    status === s
                      ? s === 'Presente'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : s === 'Ausente'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : s === 'Justificado'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-[#27272A] text-[#FAFAFA] border-[#3F3F46]'
                      : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Time Check-in and Check-out */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Entrada</label>
                <button
                  type="button"
                  onClick={setNowCheckIn}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Agora
                </button>
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Saída</label>
                <button
                  type="button"
                  onClick={setNowCheckOut}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Agora
                </button>
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Observation */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Observação (Opcional)
            </label>
            <textarea
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Entrou alguns minutos após o início do turno..."
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Footer buttons */}
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
              {isSubmitting ? 'Salvando...' : 'Salvar Presença'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
