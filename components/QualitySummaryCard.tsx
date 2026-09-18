'use client';

import React from 'react';
import { QualityPeriodFollowUp, OBLIGATORY_CRITERIA } from '@/lib/types';
import { Award, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface QualitySummaryCardProps {
  followUp: QualityPeriodFollowUp | null;
  onOpenFollowUp: () => void;
}

export function QualitySummaryCard({
  followUp,
  onOpenFollowUp,
}: QualitySummaryCardProps) {
  // Counts of criteria status
  const criteriaStatus = followUp?.criteriaStatus || {};
  let positiveCount = 0;
  let attentionCount = 0;
  let negativeCount = 0;

  OBLIGATORY_CRITERIA.forEach(c => {
    const st = criteriaStatus[c.id];
    if (st === 'positivo') positiveCount++;
    else if (st === 'atencao') attentionCount++;
    else if (st === 'negativo') negativeCount++;
  });

  const latestEvidence = followUp?.evidences && followUp.evidences.length > 0
    ? followUp.evidences[0]
    : null;

  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 relative overflow-hidden">
      {/* Background subtle badge accent */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
              Acompanhamento de Qualidade
            </h3>
            <span className="text-[11px] text-[#A1A1AA]">
              Período: <strong className="text-white font-medium">{followUp?.periodLabel || 'Vigente'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onOpenFollowUp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-emerald-600 text-xs font-semibold text-white border border-[#27272A] hover:border-emerald-500 rounded-lg transition-colors"
        >
          <span>Acessar Acompanhamento</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {/* Nota Provisória */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
            Nota Provisória Atual
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {followUp?.currentScore !== undefined ? followUp.currentScore.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-[#71717A]">/ 10,0</span>
          </div>
        </div>

        {/* Critérios Obrigatórios Status */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
            Critérios Obrigatórios (6)
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold" title="Positivos">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{positiveCount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold" title="Atenção">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{attentionCount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold" title="Negativos">
              <XCircle className="w-3.5 h-3.5" />
              <span>{negativeCount}</span>
            </div>
          </div>
        </div>

        {/* Última Evidência Registrada */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
          <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1 flex items-center justify-between">
            <span>Última Evidência</span>
            {latestEvidence && (
              <span className="text-[#71717A] font-normal">{latestEvidence.date}</span>
            )}
          </span>
          {latestEvidence ? (
            <p className="text-xs text-[#D4D4D8] line-clamp-2 italic">
              &quot;{latestEvidence.description}&quot;
            </p>
          ) : (
            <p className="text-xs text-[#71717A] italic">
              Nenhuma evidência registrada neste período.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
