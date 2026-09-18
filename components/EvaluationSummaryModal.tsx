'use client';

import React, { useState } from 'react';
import { 
  Member, 
  QualityPeriodFollowUp, 
  OBLIGATORY_CRITERIA, 
  COMPLEMENTARY_CRITERIA 
} from '@/lib/types';
import { X, Copy, Check, FileText } from 'lucide-react';

interface EvaluationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  followUp: QualityPeriodFollowUp;
}

export function EvaluationSummaryModal({
  isOpen,
  onClose,
  member,
  followUp,
}: EvaluationSummaryModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const criteriaStatusText: Record<string, string> = {
    positivo: 'POSITIVO',
    atencao: 'ATENÇÃO',
    negativo: 'NEGATIVO',
    nao_observado: 'NÃO OBSERVADO',
    nao_aplicavel: 'NÃO APLICÁVEL',
    nao_avaliado: 'NÃO AVALIADO',
  };

  // Build formatted report string
  const lines: string[] = [];
  lines.push(`=====================================================`);
  lines.push(`     RELATÓRIO DE AVALIAÇÃO DE QUALIDADE - POLÍCIA RCC`);
  lines.push(`=====================================================`);
  lines.push(``);
  lines.push(`MILITAR: ${member.nick} ${member.tag ? `[${member.tag}]` : ''}`);
  lines.push(`CARGO: ${member.role}`);
  lines.push(`ESPECIALIZAÇÃO: ${member.specialization}`);
  lines.push(`PERÍODO AVALIATIVO: ${followUp.periodLabel} (${followUp.periodId})`);
  lines.push(`NOTA PROVISÓRIA ATUAL: ${followUp.currentScore !== undefined ? followUp.currentScore.toFixed(1) : 'Não atribuída'} / 10.0`);
  lines.push(``);
  lines.push(`-----------------------------------------------------`);
  lines.push(`CRITÉRIOS OBRIGATÓRIOS:`);
  lines.push(`-----------------------------------------------------`);

  OBLIGATORY_CRITERIA.forEach((c, idx) => {
    const st = followUp.criteriaStatus?.[c.id] || 'nao_avaliado';
    lines.push(`${idx + 1}. ${c.name}: [${criteriaStatusText[st] || st}]`);
  });

  const activeComplementary = COMPLEMENTARY_CRITERIA.filter(c => {
    const st = followUp.criteriaStatus?.[c.id];
    return st && st !== 'nao_observado' && st !== 'nao_avaliado';
  });

  if (activeComplementary.length > 0) {
    lines.push(``);
    lines.push(`-----------------------------------------------------`);
    lines.push(`CRITÉRIOS COMPLEMENTARES OBSERVADOS:`);
    lines.push(`-----------------------------------------------------`);
    activeComplementary.forEach(c => {
      const st = followUp.criteriaStatus?.[c.id] || 'nao_observado';
      lines.push(`• ${c.name}: [${criteriaStatusText[st] || st}]`);
    });
  }

  lines.push(``);
  lines.push(`-----------------------------------------------------`);
  lines.push(`PRINCIPAIS EVIDÊNCIAS REGISTRADAS (${followUp.evidences?.length || 0}):`);
  lines.push(`-----------------------------------------------------`);

  if (!followUp.evidences || followUp.evidences.length === 0) {
    lines.push(`(Nenhuma evidência registrada no período)`);
  } else {
    // Group by positive vs neutral/negative
    const positives = followUp.evidences.filter(e => e.type === 'Positivo');
    const attentions = followUp.evidences.filter(e => e.type === 'Neutro');
    const negatives = followUp.evidences.filter(e => e.type === 'Negativo');

    if (positives.length > 0) {
      lines.push(`[PONTOS POSITIVOS]`);
      positives.forEach(e => {
        lines.push(`+ [${e.date}] ${e.criterionName}: "${e.description}" (Por: ${e.author})`);
      });
      lines.push(``);
    }

    if (attentions.length > 0) {
      lines.push(`[PONTOS DE ATENÇÃO / NEUTROS]`);
      attentions.forEach(e => {
        lines.push(`! [${e.date}] ${e.criterionName}: "${e.description}" (Por: ${e.author})`);
      });
      lines.push(``);
    }

    if (negatives.length > 0) {
      lines.push(`[PONTOS NEGATIVOS]`);
      negatives.forEach(e => {
        lines.push(`- [${e.date}] ${e.criterionName}: "${e.description}" (Por: ${e.author})`);
      });
      lines.push(``);
    }
  }

  lines.push(`-----------------------------------------------------`);
  lines.push(`HISTÓRICO DE AJUSTES DA NOTA PROVISÓRIA:`);
  lines.push(`-----------------------------------------------------`);

  if (!followUp.scoreHistory || followUp.scoreHistory.length === 0) {
    lines.push(`(Sem alterações registradas na nota)`);
  } else {
    followUp.scoreHistory.forEach(h => {
      const prev = h.previousScore !== undefined ? h.previousScore.toFixed(1) : '—';
      lines.push(`• [${h.date}] ${prev} → ${h.newScore.toFixed(1)} (Por: ${h.author})${h.reason ? ` - Motivo: "${h.reason}"` : ''}`);
    });
  }

  lines.push(``);
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  lines.push(`=====================================================`);

  const fullReportText = lines.join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111113] border border-[#27272A] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-[#27272A] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Resumo para Avaliação Formal</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Consolidação de critérios, nota e evidências pronta para copiar e colar na avaliação formal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-lg hover:bg-[#1E1E22] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 text-xs">
          <pre className="bg-[#09090B] border border-[#27272A] rounded-lg p-4 font-mono text-[11px] text-[#E4E4E7] whitespace-pre-wrap leading-relaxed select-all">
            {fullReportText}
          </pre>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-[#27272A] bg-[#141417] shrink-0">
          <span className="text-[11px] text-[#71717A]">
            Você pode copiar o texto formatado para o fórum ou formulário da Diretoria.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
