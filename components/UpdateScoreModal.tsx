'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Award } from 'lucide-react';

interface UpdateScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
  authorDefault?: string;
  onSubmit: (newScore: number, author: string, reason?: string) => Promise<void>;
}

export function UpdateScoreModal({
  isOpen,
  onClose,
  currentScore,
  authorDefault = 'Diretoria de Turno',
  onSubmit,
}: UpdateScoreModalProps) {
  const [score, setScore] = useState<string>(
    currentScore !== undefined ? currentScore.toFixed(1) : '8.0'
  );
  const [author, setAuthor] = useState(authorDefault);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentScore !== undefined) {
      setScore(currentScore.toFixed(1));
    }
  }, [currentScore]);

  if (!isOpen) return null;

  const handleScoreChange = (val: number) => {
    const clamped = Math.max(0, Math.min(10, val));
    setScore(clamped.toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(score);
    if (isNaN(num) || num < 0 || num > 10) return;

    setSaving(true);
    try {
      await onSubmit(num, author.trim() || 'Diretoria de Turno', reason.trim() || undefined);
      setReason('');
      onClose();
    } catch (err) {
      console.error('Error updating provisional score:', err);
    } finally {
      setSaving(false);
    }
  };

  const parsedNum = parseFloat(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Ajustar Nota Provisória</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Definida manualmente pelo diretor para calibrar o desempenho no período.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#1E1E22] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Comparison badge */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3 flex items-center justify-between">
            <div className="text-center flex-1 border-r border-[#27272A]">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] block">Nota Anterior</span>
              <span className="text-lg font-bold text-white font-mono">
                {currentScore !== undefined ? currentScore.toFixed(1) : '—'}
              </span>
            </div>
            <div className="px-3 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-center flex-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Nova Nota</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {!isNaN(parsedNum) ? parsedNum.toFixed(1) : '—'}
              </span>
            </div>
          </div>

          {/* Score input & quick presets */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Valor da Nota (0,0 a 10,0)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-base font-bold text-[#FAFAFA] text-center focus:outline-hidden focus:border-emerald-500/50 font-mono"
            />

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {[6.0, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleScoreChange(val)}
                  className={`py-1 rounded text-[11px] font-mono border transition-colors ${
                    parseFloat(score) === val
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:bg-[#202024]'
                  }`}
                >
                  {val.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo da alteração */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Motivo / Justificativa da Alteração (Opcional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ex: "Melhora significativa no contato com os subalternos durante a semana."'
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-3 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50 resize-y"
            />
          </div>

          {/* Autor */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Avaliador / Autor
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Diretoria de Turno"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || isNaN(parsedNum)}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Gravando...' : 'Confirmar Nova Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
