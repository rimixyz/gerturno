'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Member, 
  QualityPeriodFollowUp, 
  QualityCriterionStatus, 
  EvidenceType,
  QualityEvidence,
  ScoreChangeRecord,
  OBLIGATORY_CRITERIA, 
  COMPLEMENTARY_CRITERIA,
  TimelineEvent,
  AttendanceRecord,
  NoteRecord
} from '@/lib/types';
import { 
  getOrInitMemberQualityFollowUp, 
  getAllQualityPeriodsForMember, 
  updateCriterionStatus, 
  addQualityEvidence, 
  updateProvisionalScore,
  getDefaultPeriod 
} from '@/lib/firestoreService';
import { AddEvidenceModal } from '@/components/AddEvidenceModal';
import { UpdateScoreModal } from '@/components/UpdateScoreModal';
import { EvaluationSummaryModal } from '@/components/EvaluationSummaryModal';
import { 
  Award, 
  Calendar, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  FileText, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  UserCheck,
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';

interface QualityFollowUpViewProps {
  member: Member;
  currentAdminName: string;
  timeline: TimelineEvent[];
  attendanceList: AttendanceRecord[];
  notes: NoteRecord[];
  onRefreshParent?: () => void;
}

export function QualityFollowUpView({
  member,
  currentAdminName,
  timeline,
  attendanceList,
  notes,
  onRefreshParent,
}: QualityFollowUpViewProps) {
  const [loading, setLoading] = useState(true);
  const [followUp, setFollowUp] = useState<QualityPeriodFollowUp | null>(null);
  const [allPeriods, setAllPeriods] = useState<QualityPeriodFollowUp[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modals
  const [addEvidenceOpen, setAddEvidenceOpen] = useState(false);
  const [selectedCriterionForEvidence, setSelectedCriterionForEvidence] = useState<string | undefined>(undefined);
  const [updateScoreOpen, setUpdateScoreOpen] = useState(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState(false);

  // Expanded sections
  const [showComplementary, setShowComplementary] = useState(false);
  const [showScoreHistory, setShowScoreHistory] = useState(false);
  const [showSystemSignals, setShowSystemSignals] = useState(true);

  // New period creation prompt
  const [creatingNewPeriod, setCreatingNewPeriod] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadFollowUpData = useCallback(async (periodIdToLoad?: string) => {
    setLoading(true);
    try {
      const pid = periodIdToLoad || selectedPeriodId;
      const [currentFollowUp, periods] = await Promise.all([
        getOrInitMemberQualityFollowUp(member.id, pid),
        getAllQualityPeriodsForMember(member.id),
      ]);
      setFollowUp(currentFollowUp);
      setAllPeriods(periods);
      setSelectedPeriodId(currentFollowUp.periodId);
    } catch (err) {
      console.error('Error loading quality follow-up:', err);
    } finally {
      setLoading(false);
    }
  }, [member.id, selectedPeriodId]);

  useEffect(() => {
    loadFollowUpData();
  }, [loadFollowUpData]);

  const handlePeriodChange = async (newPid: string) => {
    setSelectedPeriodId(newPid);
    await loadFollowUpData(newPid);
  };

  const handleCreateNewPeriod = async () => {
    if (!newPeriodMonth) return;
    const [y, m] = newPeriodMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    const label = `${monthNames[monthIndex]} de ${y}`;

    await getOrInitMemberQualityFollowUp(member.id, newPeriodMonth, label);
    setCreatingNewPeriod(false);
    setSelectedPeriodId(newPeriodMonth);
    await loadFollowUpData(newPeriodMonth);
    onRefreshParent?.();
  };

  const handleCriterionStatusChange = async (criterionId: string, status: QualityCriterionStatus) => {
    if (!followUp) return;
    // Optimistic update
    setFollowUp(prev => {
      if (!prev) return null;
      return {
        ...prev,
        criteriaStatus: {
          ...prev.criteriaStatus,
          [criterionId]: status,
        },
      };
    });

    try {
      await updateCriterionStatus(member.id, followUp.periodId, criterionId, status);
      onRefreshParent?.();
    } catch (err) {
      console.error('Error updating criterion status:', err);
      // reload
      loadFollowUpData();
    }
  };

  const handleAddEvidenceSubmit = async (evidence: {
    criterionId: string;
    criterionName: string;
    date: string;
    type: EvidenceType;
    description: string;
    author: string;
  }) => {
    if (!followUp) return;
    await addQualityEvidence(member.id, followUp.periodId, evidence);
    await loadFollowUpData(followUp.periodId);
    onRefreshParent?.();
  };

  const handleUpdateScoreSubmit = async (newScore: number, author: string, reason?: string) => {
    if (!followUp) return;
    await updateProvisionalScore(member.id, followUp.periodId, newScore, author, reason);
    await loadFollowUpData(followUp.periodId);
    onRefreshParent?.();
  };

  const statusConfig: Record<
    QualityCriterionStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    positivo: {
      label: 'Positivo',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
    atencao: {
      label: 'Atenção',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
    },
    negativo: {
      label: 'Negativo',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: XCircle,
    },
    nao_avaliado: {
      label: 'Não avaliado',
      bg: 'bg-[#18181B]',
      text: 'text-[#A1A1AA]',
      border: 'border-[#27272A]',
      icon: HelpCircle,
    },
    nao_observado: {
      label: 'Não observado',
      bg: 'bg-[#18181B]',
      text: 'text-[#71717A]',
      border: 'border-[#27272A]',
      icon: Clock,
    },
    nao_aplicavel: {
      label: 'Não aplicável',
      bg: 'bg-[#18181B]',
      text: 'text-[#71717A]',
      border: 'border-[#27272A]',
      icon: HelpCircle,
    },
  };

  // Pre-calculate system signals
  const attendancesThisMonth = attendanceList.filter(a => {
    if (!followUp) return true;
    return a.date.startsWith(followUp.periodId);
  });
  const presences = attendancesThisMonth.filter(a => a.status === 'Presente').length;
  const absences = attendancesThisMonth.filter(a => a.status === 'Ausente').length;
  const notesCount = notes.length;

  if (loading && !followUp) {
    return (
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-[#A1A1AA]">Carregando acompanhamento de qualidade...</span>
      </div>
    );
  }

  if (!followUp) return null;

  return (
    <div className="space-y-6">
      {/* HEADER: Period selector, badges & Actions */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <Award className="w-4 h-4" />
            <span>Acompanhamento Contínuo de Desempenho</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Qualidade & Avaliação — {followUp.periodLabel}</span>
            <span className="text-xs font-mono font-normal text-[#A1A1AA] bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
              {followUp.periodId}
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Registro contínuo para portadores da Especialização Intermediária. Serve de base para a avaliação formal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedPeriodId}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              {allPeriods.map(p => (
                <option key={p.periodId} value={p.periodId} className="bg-[#18181B] text-white">
                  {p.periodLabel}
                </option>
              ))}
              {!allPeriods.some(p => p.periodId === selectedPeriodId) && (
                <option value={selectedPeriodId} className="bg-[#18181B] text-white">
                  {followUp.periodLabel}
                </option>
              )}
            </select>
          </div>

          {/* New Period Toggle */}
          <button
            onClick={() => setCreatingNewPeriod(prev => !prev)}
            className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            + Outro Período
          </button>

          {/* Gerar Resumo Formal */}
          <button
            onClick={() => setSummaryReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gerar Resumo Formal</span>
          </button>
        </div>
      </div>

      {/* New Period Input Form */}
      {creatingNewPeriod && (
        <div className="bg-[#141417] border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-white">Criar ou Abrir Período:</span>
            <input
              type="month"
              value={newPeriodMonth}
              onChange={(e) => setNewPeriodMonth(e.target.value)}
              className="bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreatingNewPeriod(false)}
              className="px-3 py-1 text-xs text-[#A1A1AA] hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateNewPeriod}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* PROVISIONAL SCORE CARD */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Nota Provisória do Período
            </span>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Não calculada automaticamente: mantida e ajustada manualmente pela Diretoria durante o acompanhamento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUpdateScoreOpen(true)}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ajustar Nota</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#09090B] border border-[#27272A] rounded-xl p-4">
          {/* Big Score Display */}
          <div className="text-center md:text-left md:border-r border-[#27272A] md:pr-4">
            <span className="text-[10px] uppercase text-[#71717A] font-bold block mb-1">
              Nota Atual
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-4xl font-bold font-mono text-emerald-400">
                {followUp.currentScore !== undefined ? followUp.currentScore.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-[#71717A] font-mono">/ 10,0</span>
            </div>
            <span className="text-[11px] text-[#A1A1AA] block mt-1">
              {followUp.currentScore !== undefined
                ? followUp.currentScore >= 9.0 ? 'Desempenho Excelente'
                : followUp.currentScore >= 8.0 ? 'Bom Desempenho'
                : followUp.currentScore >= 7.0 ? 'Regular / Em Evolução'
                : 'Requer Atenção Imediata'
                : 'Nenhuma nota definida para este período'}
            </span>
          </div>

          {/* Progress Bar Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span>Escala Avaliativa</span>
              <span className="font-mono text-white">
                {followUp.currentScore !== undefined ? `${Math.round(followUp.currentScore * 10)}%` : '0%'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#18181B] rounded-full overflow-hidden border border-[#27272A]">
              <div
                className="h-full bg-linear-to-r from-amber-500 via-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (followUp.currentScore || 0) * 10))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#71717A] font-mono">
              <span>0.0</span>
              <span>5.0</span>
              <span>7.0</span>
              <span>10.0</span>
            </div>
          </div>

          {/* History summary / toggle */}
          <div className="text-center md:text-right">
            <button
              onClick={() => setShowScoreHistory(prev => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white bg-[#18181B] border border-[#27272A] px-3 py-2 rounded-lg transition-colors"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Histórico de Notas ({followUp.scoreHistory?.length || 0})</span>
              {showScoreHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded score change history */}
        {showScoreHistory && (
          <div className="mt-3 p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs animate-in slide-in-from-top-2">
            <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Histórico Detalhado de Ajustes da Nota</span>
            </div>
            {!followUp.scoreHistory || followUp.scoreHistory.length === 0 ? (
              <p className="text-[#71717A] italic text-[11px]">Nenhum ajuste registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {followUp.scoreHistory.map(record => (
                  <div key={record.id} className="p-2.5 bg-[#141417] border border-[#27272A] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold">
                        {record.previousScore !== undefined ? record.previousScore.toFixed(1) : '—'} → {record.newScore.toFixed(1)}
                      </span>
                      {record.reason && (
                        <span className="text-[#D4D4D8] italic">&quot;{record.reason}&quot;</span>
                      )}
                    </div>
                    <div className="text-[#71717A] flex items-center gap-2 text-[10px]">
                      <span>Por: <strong className="text-[#A1A1AA]">{record.author}</strong></span>
                      <span>•</span>
                      <span>{record.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CRITÉRIOS OBRIGATÓRIOS (6) */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Critérios Obrigatórios (Especialização Intermediária)</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Todos os 6 critérios são exigidos para todos os portadores da especialização.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCriterionForEvidence(undefined);
              setAddEvidenceOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#18181B] hover:bg-emerald-600 text-white border border-[#27272A] hover:border-emerald-500 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Evidência</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OBLIGATORY_CRITERIA.map(criterion => {
            const currentStatus: QualityCriterionStatus = followUp.criteriaStatus?.[criterion.id] || 'nao_avaliado';
            const config = statusConfig[currentStatus];
            const StatusIcon = config.icon;

            // Evidences for this criterion
            const criterionEvidences = (followUp.evidences || []).filter(e => e.criterionId === criterion.id);

            return (
              <div
                key={criterion.id}
                className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col justify-between hover:border-[#3F3F46] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-semibold text-xs text-white">
                      {criterion.name}
                    </h4>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-3">
                    {criterion.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#27272A]/70 flex items-center justify-between gap-2 text-xs">
                  {/* Status selector buttons */}
                  <div className="flex items-center gap-1">
                    {(['positivo', 'atencao', 'negativo'] as QualityCriterionStatus[]).map(st => {
                      const cfg = statusConfig[st];
                      const active = currentStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleCriterionStatusChange(criterion.id, st)}
                          className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                            active
                              ? `${cfg.bg} ${cfg.text} ${cfg.border} font-bold shadow-xs`
                              : 'bg-[#141417] text-[#71717A] border-[#27272A] hover:text-white hover:border-[#3F3F46]'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add evidence for this criterion */}
                  <button
                    onClick={() => {
                      setSelectedCriterionForEvidence(criterion.id);
                      setAddEvidenceOpen(true);
                    }}
                    title="Adicionar evidência para este critério"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <span>+ Evidência</span>
                    {criterionEvidences.length > 0 && (
                      <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] px-1 rounded">
                        {criterionEvidences.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CRITÉRIOS COMPLEMENTARES (OPCIONAIS) */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Critérios Complementares (Observações Adicionais)</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Utilizados para enriquecer a avaliação de membros em destaque ou com funções de liderança.
            </p>
          </div>

          <button
            onClick={() => setShowComplementary(prev => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
          >
            <span>{showComplementary ? 'Ocultar' : 'Exibir Critérios'}</span>
            {showComplementary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showComplementary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#27272A] animate-in slide-in-from-top-2">
            {COMPLEMENTARY_CRITERIA.map(criterion => {
              const currentStatus: QualityCriterionStatus = followUp.criteriaStatus?.[criterion.id] || 'nao_observado';
              const config = statusConfig[currentStatus];
              const StatusIcon = config.icon;

              return (
                <div
                  key={criterion.id}
                  className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-xs text-white">
                        {criterion.name}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-3">
                      {criterion.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#27272A]/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['positivo', 'atencao', 'negativo', 'nao_observado'] as QualityCriterionStatus[]).map(st => {
                        const cfg = statusConfig[st];
                        const active = currentStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleCriterionStatusChange(criterion.id, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                              active
                                ? `${cfg.bg} ${cfg.text} ${cfg.border} font-bold`
                                : 'bg-[#141417] text-[#71717A] border-[#27272A] hover:text-white'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCriterionForEvidence(criterion.id);
                        setAddEvidenceOpen(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      + Evidência
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOG DE EVIDÊNCIAS E FATOS REGISTRADOS */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Registro de Evidências e Fatos Observados ({followUp.evidences?.length || 0})</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Histórico qualitativo detalhado com ocorrências positivas, de atenção ou negativas.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCriterionForEvidence(undefined);
              setAddEvidenceOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Nova Evidência</span>
          </button>
        </div>

        {!followUp.evidences || followUp.evidences.length === 0 ? (
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-8 text-center">
            <FileText className="w-8 h-8 text-[#3F3F46] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-white">Nenhuma evidência registrada neste período</h4>
            <p className="text-[11px] text-[#71717A] mt-1 max-w-sm mx-auto">
              Utilize o botão acima para registrar observações da rotina, atuação em base ou conduta deste militar.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {followUp.evidences.map((ev: QualityEvidence) => {
              const isPositive = ev.type === 'Positivo';
              const isAttention = ev.type === 'Neutro';
              const isNegative = ev.type === 'Negativo';

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isPositive
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : isAttention
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isAttention
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {isPositive && <CheckCircle2 className="w-3 h-3" />}
                        {isAttention && <AlertTriangle className="w-3 h-3" />}
                        {isNegative && <XCircle className="w-3 h-3" />}
                        <span>{ev.type}</span>
                      </span>

                      <span className="font-semibold text-xs text-white">
                        {ev.criterionName}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#71717A] flex items-center gap-1.5 font-mono shrink-0">
                      <Calendar className="w-3 h-3 text-[#A1A1AA]" />
                      <span>{ev.date}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#E4E4E7] leading-relaxed mb-2 bg-[#09090B]/60 p-2.5 rounded-lg border border-[#27272A]/50">
                    &quot;{ev.description}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                    <span>Registrado por: <strong className="text-[#A1A1AA]">{ev.author}</strong></span>
                    <span>Salvo no histórico do militar</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INTEGRAÇÃO COM OUTRAS ÁREAS DO SISTEMA */}
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Sinais do Sistema no Período ({followUp.periodLabel})
            </h3>
          </div>
          <button
            onClick={() => setShowSystemSignals(prev => !prev)}
            className="text-xs text-[#A1A1AA] hover:text-white"
          >
            {showSystemSignals ? 'Ocultar' : 'Exibir'}
          </button>
        </div>

        {showSystemSignals && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            {/* Presença em Base */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">
                Frequência / Presença
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">{presences}</span>
                <span className="text-[11px] text-emerald-400">presenças</span>
                <span className="text-[11px] text-[#71717A]">/ {absences} ausências</span>
              </div>
              <span className="text-[10px] text-[#71717A] block mt-1">
                Baseado nos registros de frequência do mês.
              </span>
            </div>

            {/* Anotações registradas */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">
                Anotações do Militar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">{notesCount}</span>
                <span className="text-[11px] text-[#A1A1AA]">registradas</span>
              </div>
              <span className="text-[10px] text-[#71717A] block mt-1">
                Anotações diárias e gerais vinculadas à ficha.
              </span>
            </div>

            {/* Eventos da Timeline */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block mb-1">
                Eventos no Histórico
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">{timeline.length}</span>
                <span className="text-[11px] text-[#A1A1AA]">eventos</span>
              </div>
              <span className="text-[10px] text-[#71717A] block mt-1">
                Ajustes de cargos, advertências e promoções.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddEvidenceModal
        isOpen={addEvidenceOpen}
        onClose={() => setAddEvidenceOpen(false)}
        defaultCriterionId={selectedCriterionForEvidence}
        authorDefault={currentAdminName}
        onSubmit={handleAddEvidenceSubmit}
      />

      <UpdateScoreModal
        isOpen={updateScoreOpen}
        onClose={() => setUpdateScoreOpen(false)}
        currentScore={followUp.currentScore}
        authorDefault={currentAdminName}
        onSubmit={handleUpdateScoreSubmit}
      />

      <EvaluationSummaryModal
        isOpen={summaryReportOpen}
        onClose={() => setSummaryReportOpen(false)}
        member={member}
        followUp={followUp}
      />
    </div>
  );
}
