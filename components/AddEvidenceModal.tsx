'use client';

import React, { useState, useEffect } from 'react';
import { QualityCriterionStatus, EvidenceType, OBLIGATORY_CRITERIA, COMPLEMENTARY_CRITERIA } from '@/lib/types';
import { X, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (evidence: {
    criterionId: string;
    criterionName: string;
    date: string;
    type: EvidenceType;
    description: string;
    author: string;
  }) => Promise<void>;
  defaultCriterionId?: string;
  authorDefault?: string;
}

export function AddEvidenceModal({
  isOpen,
  onClose,
  onSubmit,
  defaultCriterionId,
  authorDefault = 'Diretoria de Turno',
}: AddEvidenceModalProps) {
  const allCriteria = [...OBLIGATORY_CRITERIA, ...COMPLEMENTARY_CRITERIA];

  const [criterionId, setCriterionId] = useState(defaultCriterionId || allCriteria[0].id);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<EvidenceType>('Positivo');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(authorDefault);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (defaultCriterionId) {
      setCriterionId(defaultCriterionId);
    }
  }, [defaultCriterionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const criterion = allCriteria.find(c => c.id === criterionId) || allCriteria[0];

    // Format date to local readable format e.g. "19/09/2026"
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    setSaving(true);
    try {
      await onSubmit({
        criterionId: criterion.id,
        criterionName: criterion.name,
        date: formattedDate,
        type,
        description: description.trim(),
        author: author.trim() || 'Diretoria de Turno',
      });
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Error submitting evidence:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <div>
            <h2 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Registrar Evidência / Observação</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Registra uma atuação qualitativa contínua sem sobrescrever anotações anteriores.
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
          {/* Critério */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Critério Relacionado
            </label>
            <select
              value={criterionId}
              onChange={(e) => setCriterionId(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
            >
              <optgroup label="Critérios Obrigatórios">
                {OBLIGATORY_CRITERIA.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Critérios Complementares">
                {COMPLEMENTARY_CRITERIA.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data */}
            <div>
              <label className="block font-medium text-[#FAFAFA] mb-1.5">
                Data da Ocorrência
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
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
                placeholder="Ex: Diretor de Turno"
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Tipo de Evidência */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Classificação do Registro
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('Positivo')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  type === 'Positivo'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:bg-[#202024]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Positivo</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Neutro')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  type === 'Neutro'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:bg-[#202024]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Neutro / Atenção</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Negativo')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  type === 'Negativo'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:bg-[#202024]'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Negativo</span>
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-medium text-[#FAFAFA] mb-1.5">
              Descrição da Evidência / Fato Observado
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Ex: "Durante o turno do dia 19, chamou dois subalternos para conversar sobre dificuldades na carreira e acompanhou posteriormente a evolução de um deles."'
              required
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-3 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50 resize-y"
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
              disabled={saving || !description.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Salvar Evidência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
