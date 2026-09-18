'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { 
  getAllMembers, 
  getAppSettings, 
  getDefaultPeriod,
  getMemberQualityFollowUp
} from '@/lib/firestoreService';
import { 
  Member, 
  AppSettings, 
  QualityPeriodFollowUp, 
  OBLIGATORY_CRITERIA,
  QualityCriterionStatus
} from '@/lib/types';
import { 
  Award, 
  Search, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface MemberWithQuality {
  member: Member;
  quality: QualityPeriodFollowUp | null;
}

export default function QualidadeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [data, setData] = useState<MemberWithQuality[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnlyIntermediaria, setFilterOnlyIntermediaria] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_score' | 'without_score' | 'needs_attention'>('all');

  const { periodLabel } = getDefaultPeriod();

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersList, setts] = await Promise.all([
        getAllMembers(),
        getAppSettings(),
      ]);

      // Only active members (not dismissed)
      const activeMembers = membersList.filter(m => !m.isDismissed && m.status !== 'DESLIGADO');

      // Fetch quality follow up for each member in parallel
      const withQuality = await Promise.all(
        activeMembers.map(async (m) => {
          const q = await getMemberQualityFollowUp(m.id);
          return {
            member: m,
            quality: q,
          };
        })
      );

      setData(withQuality);
      setSettings(setts);
    } catch (err) {
      console.error('Error loading quality dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filtered = data.filter(({ member, quality }) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      member.nick.toLowerCase().includes(term) ||
      (member.tag && member.tag.toLowerCase().includes(term)) ||
      member.role.toLowerCase().includes(term);

    if (!matchSearch) return false;

    // Filter specialization
    if (filterOnlyIntermediaria) {
      const isInter = 
        member.specialization === 'Especialização Intermediária' ||
        member.role.toLowerCase().includes('executivo') ||
        member.role.toLowerCase().includes('diretor') ||
        member.role.toLowerCase().includes('intermediária');
      if (!isInter) return false;
    }

    // Filter score / attention status
    if (filterStatus === 'with_score') {
      return quality?.currentScore !== undefined;
    }
    if (filterStatus === 'without_score') {
      return quality?.currentScore === undefined;
    }
    if (filterStatus === 'needs_attention') {
      const criteria = quality?.criteriaStatus || {};
      return Object.values(criteria).some(st => st === 'atencao' || st === 'negativo');
    }

    return true;
  });

  // Calculate high-level metrics
  const scoredCount = data.filter(d => d.quality?.currentScore !== undefined).length;
  const scoresArray = data
    .map(d => d.quality?.currentScore)
    .filter((s): s is number => s !== undefined);
  const avgScore = scoresArray.length > 0 
    ? scoresArray.reduce((acc, v) => acc + v, 0) / scoresArray.length 
    : undefined;

  const attentionCount = data.filter(({ quality }) => {
    const criteria = quality?.criteriaStatus || {};
    return Object.values(criteria).some(st => st === 'atencao' || st === 'negativo');
  }).length;

  const renderCriterionDot = (status?: QualityCriterionStatus, title?: string) => {
    switch (status) {
      case 'positivo':
        return <span title={`${title}: Positivo`} className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />;
      case 'atencao':
        return <span title={`${title}: Atenção`} className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />;
      case 'negativo':
        return <span title={`${title}: Negativo`} className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />;
      default:
        return <span title={`${title}: Não avaliado`} className="w-2.5 h-2.5 rounded-full border border-[#52525B] inline-block" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
              <Award className="w-4 h-4" />
              <span>Diretoria & Executivos</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FAFAFA]">
              Acompanhamento de Qualidade
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Monitoramento contínuo de critérios, evidências e notas provisórias para a Especialização Intermediária.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#111113] border border-[#27272A] px-3 py-2 rounded-xl text-xs text-[#A1A1AA]">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Período Vigente:</span>
            <strong className="text-white font-medium">{periodLabel}</strong>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
              Militares Monitorados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{filtered.length}</span>
              <span className="text-[11px] text-[#A1A1AA]">na listagem</span>
            </div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
              Com Nota Provisória
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 font-mono">{scoredCount}</span>
              <span className="text-[11px] text-[#A1A1AA]">definidas</span>
            </div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
              Média do Efetivo
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">
                {avgScore !== undefined ? avgScore.toFixed(1) : '—'}
              </span>
              <span className="text-[11px] text-[#A1A1AA]">/ 10,0</span>
            </div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block mb-1">
              Requer Atenção
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 font-mono">{attentionCount}</span>
              <span className="text-[11px] text-amber-400/80">com alertas</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nick, tag ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-hidden focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Toggle Esp. Intermediaria */}
            <label className="flex items-center gap-2 cursor-pointer select-none bg-[#18181B] border border-[#27272A] px-3 py-2 rounded-lg text-[#FAFAFA]">
              <input
                type="checkbox"
                checked={filterOnlyIntermediaria}
                onChange={(e) => setFilterOnlyIntermediaria(e.target.checked)}
                className="rounded border-[#3F3F46] text-emerald-500 focus:ring-0 focus:outline-hidden"
              />
              <span>Apenas Esp. Intermediária</span>
            </label>

            {/* Filter pills */}
            <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-[#27272A] text-white'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('with_score')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'with_score'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Com Nota
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('without_score')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'without_score'
                    ? 'bg-[#27272A] text-white font-bold'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Sem Nota
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('needs_attention')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'needs_attention'
                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Com Alertas
              </button>
            </div>
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-[#A1A1AA]">Carregando acompanhamentos de qualidade...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-12 text-center">
            <Users className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">Nenhum membro encontrado</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Ajuste os filtros ou a busca para visualizar os membros do efetivo.
            </p>
          </div>
        ) : (
          <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#27272A] bg-[#141417] text-[#71717A] text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Militar / Cargo</th>
                    <th className="py-3 px-4">Especialização</th>
                    <th className="py-3 px-4 text-center">Critérios Obrigatórios (6)</th>
                    <th className="py-3 px-4 text-center">Nota Provisória</th>
                    <th className="py-3 px-4 text-center">Evidências</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {filtered.map(({ member, quality }) => {
                    const criteria = quality?.criteriaStatus || {};
                    const score = quality?.currentScore;
                    const evidencesCount = quality?.evidences?.length || 0;

                    return (
                      <tr key={member.id} className="hover:bg-[#18181B]/60 transition-colors">
                        {/* Member */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#1E1E22] border border-[#27272A] flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                              {member.nick.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{member.nick}</span>
                                {member.tag && (
                                  <span className="text-[10px] font-mono text-[#A1A1AA] bg-[#18181B] px-1.5 py-0.2 rounded border border-[#27272A]">
                                    [{member.tag}]
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#A1A1AA]">{member.role}</span>
                            </div>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${
                            member.specialization === 'Especialização Intermediária'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-medium'
                              : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
                          }`}>
                            {member.specialization}
                          </span>
                        </td>

                        {/* Criteria dots */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {OBLIGATORY_CRITERIA.map(c => (
                              <React.Fragment key={c.id}>
                                {renderCriterionDot(criteria[c.id], c.name)}
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="text-[9px] text-[#71717A] mt-1 font-mono">
                            {Object.values(criteria).filter(s => s === 'positivo').length} positivos
                          </div>
                        </td>

                        {/* Provisional Score */}
                        <td className="py-3.5 px-4 text-center">
                          {score !== undefined ? (
                            <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {score.toFixed(1)} / 10
                            </span>
                          ) : (
                            <span className="text-[#52525B] text-xs font-mono italic">
                              Não atribuída
                            </span>
                          )}
                        </td>

                        {/* Evidences count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-xs text-[#FAFAFA] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded">
                            {evidencesCount}
                          </span>
                        </td>

                        {/* Action link */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/militares/${member.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-emerald-600 text-white hover:text-white border border-[#27272A] hover:border-emerald-500 rounded-lg text-xs font-medium transition-all"
                          >
                            <span>Acompanhar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
