'use client';

import React from 'react';
import { calculateMofo } from '@/lib/mofoCalculator';
import { Clock, CheckCircle2, AlertCircle, Sparkles, Crown } from 'lucide-react';

interface MofoBadgeProps {
  role: string;
  lastPromotionDate?: string | null;
  compact?: boolean;
}

export function MofoBadge({ role, lastPromotionDate, compact = false }: MofoBadgeProps) {
  const mofo = calculateMofo(role, lastPromotionDate);

  if (mofo.isMaxRole) {
    if (compact) {
      return (
        <span 
          title={`Chanceler: Cargo Máximo da Hierarquia Executiva (${mofo.daysInRole} dias no cargo - sem promoção)`}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded"
        >
          <Crown className="w-2.5 h-2.5 text-purple-400" />
          <span>{mofo.hasPromotionDate ? `${mofo.daysInRole}d (Máximo)` : 'Máximo'}</span>
        </span>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg">
        <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>
          <strong>Chanceler</strong> • Máximo {mofo.hasPromotionDate ? `(${mofo.daysInRole} ${mofo.daysInRole === 1 ? 'dia' : 'dias'})` : ''}
        </span>
      </div>
    );
  }

  if (!mofo.hasPromotionDate) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#71717A] bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded">
          <Clock className="w-2.5 h-2.5 text-[#52525B]" />
          <span>Sem data</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-[#52525B]" />
        <span>Data não informada</span>
      </span>
    );
  }

  // Compact badge: used in lists and dense views
  if (compact) {
    if (mofo.isEligibleForPromotion) {
      return (
        <span 
          title={`Tempo no cargo: ${mofo.daysInRole} dias | Necessário: ${mofo.requiredDays} dias para ${mofo.nextRole || 'promoção'}`}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded"
        >
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
          <span>{mofo.daysInRole}d (Apto)</span>
        </span>
      );
    }

    if (mofo.requiredDays !== null) {
      return (
        <span 
          title={`Tempo no cargo: ${mofo.daysInRole} de ${mofo.requiredDays} dias para ${mofo.nextRole || 'promoção'}`}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded"
        >
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span>{mofo.daysInRole}/{mofo.requiredDays}d (-{mofo.daysRemaining}d)</span>
        </span>
      );
    }

    return (
      <span 
        title={`Tempo no cargo: ${mofo.daysInRole} dias`}
        className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded"
      >
        <Clock className="w-2.5 h-2.5 text-cyan-400" />
        <span>{mofo.daysInRole}d</span>
      </span>
    );
  }

  // Full / standard badge
  if (mofo.isEligibleForPromotion) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          <strong>{mofo.daysInRole} {mofo.daysInRole === 1 ? 'dia' : 'dias'} de mofo</strong> • Apto p/ {mofo.nextRole || 'Promoção'}
        </span>
      </div>
    );
  }

  if (mofo.requiredDays !== null) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>{mofo.daysInRole} de {mofo.requiredDays} {mofo.requiredDays === 1 ? 'dia' : 'dias'}</strong> • Falta {mofo.daysRemaining} {mofo.daysRemaining === 1 ? 'dia' : 'dias'}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-lg">
      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span>{mofo.daysInRole} {mofo.daysInRole === 1 ? 'dia' : 'dias'} de mofo</span>
    </div>
  );
}
