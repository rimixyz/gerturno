'use client';

import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  memberNick: string;
  memberRole: string;
  onClose: () => void;
  onSave: (note: {
    type: 'DIARIA' | 'GERAL';
    content: string;
    date?: string;
  }) => Promise<void>;
}

export function NoteModal({
  isOpen,
  memberNick,
  memberRole,
  onClose,
  onSave,
}: NoteModalProps) {
  const [type, setType] = useState<'DIARIA' | 'GERAL'>('DIARIA');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        type,
        content: content.trim(),
        date: type === 'DIARIA' ? date : undefined,
      });
      setContent('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A]">
          <div>
            <h3 className="font-semibold text-base text-[#FAFAFA]">Nova Anotação</h3>
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
          {/* Note Type */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
              Tipo de Anotação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('DIARIA')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  type === 'DIARIA'
                    ? 'bg-[#1E1E22] text-[#FAFAFA] border-[#3F3F46]'
                    : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A]'
                }`}
              >
                Anotação Diária
              </button>
              <button
                type="button"
                onClick={() => setType('GERAL')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  type === 'GERAL'
                    ? 'bg-[#1E1E22] text-[#FAFAFA] border-[#3F3F46]'
                    : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A]'
                }`}
              >
                Anotação Geral
              </button>
            </div>
          </div>

          {/* Date Picker if Diaria */}
          {type === 'DIARIA' && (
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Data do Registro
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* Note content */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Conteúdo da Observação
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'DIARIA'
                  ? 'Ex: Demonstrou iniciativa durante o turno e auxiliou outros membros.'
                  : 'Ex: Possui boa comunicação, mas ainda precisa demonstrar mais liderança.'
              }
              className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50 resize-none"
            />
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
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Anotação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
