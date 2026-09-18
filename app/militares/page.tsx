'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { getAllMembers, getAppSettings, deleteMember, cleanupMalformedGeralMembers } from '@/lib/firestoreService';
import { Member, AppSettings, ShiftType, MemberStatus } from '@/lib/types';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Tag, 
  ShieldAlert,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function MilitaresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [shiftFilter, setShiftFilter] = useState<string>('TODOS');
  const [taskFilter, setTaskFilter] = useState<string>('');

  const loadData = async () => {
    try {
      const [mems, setts] = await Promise.all([
        getAllMembers(),
        getAppSettings(),
      ]);
      setMembers(mems);
      setSettings(setts);
    } catch (err) {
      console.error('Error fetching members list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const malformedGeralCount = members.filter(m => 
    m.nick.toLowerCase().startsWith('geral ') || 
    m.normalizedNick.toLowerCase().startsWith('geral_') ||
    m.role.toLowerCase() === 'geral'
  ).length;

  const handleCleanGeral = async () => {
    if (!confirm('Deseja remover os militares que ficaram com o prefixo "Geral" incorreto? Após isso você poderá reimportar a listagem oficial.')) {
      return;
    }
    setCleaning(true);
    try {
      const count = await cleanupMalformedGeralMembers();
      setNotice({
        type: 'success',
        text: `${count} militares incorretos foram removidos com sucesso.`
      });
      await loadData();
    } catch (err) {
      console.error('Error cleaning up members:', err);
      setNotice({ type: 'error', text: 'Erro ao remover militares.' });
    } finally {
      setCleaning(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDeleteMember = async (member: Member, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir permanentemente o militar "${member.nick}"?`)) {
      return;
    }
    try {
      await deleteMember(member.id);
      setNotice({ type: 'success', text: `Militar "${member.nick}" excluído com sucesso.` });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      console.error('Error deleting member:', err);
      setNotice({ type: 'error', text: 'Erro ao excluir militar.' });
    } finally {
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // Distinct roles & tasks for dropdowns
  const availableRoles = Array.from(new Set(members.map(m => m.role))).filter(Boolean);
  const availableTasks = Array.from(new Set(members.flatMap(m => m.tasks || []))).filter(Boolean);

  // Filter application
  const filteredMembers = members.filter((m) => {
    // Search
    if (search) {
      const term = search.toLowerCase();
      const matchesNick = m.nick.toLowerCase().includes(term);
      const matchesRole = m.role.toLowerCase().includes(term);
      const matchesTag = m.tag && m.tag.toLowerCase().includes(term);
      if (!matchesNick && !matchesRole && !matchesTag) return false;
    }

    // Role
    if (roleFilter && m.role !== roleFilter) return false;

    // Shift
    if (shiftFilter !== 'TODOS') {
      if (!m.shifts.includes(shiftFilter as ShiftType)) return false;
    }

    // Task
    if (taskFilter) {
      if (!m.tasks.some(t => t.toLowerCase() === taskFilter.toLowerCase())) return false;
    }

    // Status filter
    if (statusFilter === 'ATIVOS') {
      return !m.isDismissed && !m.isOnLeave && m.status === 'ATIVO';
    }
    if (statusFilter === 'INDISPONIVEIS') {
      return !m.isDismissed && m.isOnLeave;
    }
    if (statusFilter === 'DESLIGADOS') {
      return m.isDismissed || m.status === 'DESLIGADO';
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Efetivo Geral</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Militares Cadastrados
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Acompanhe todos os integrantes registrados, especializações, status e histórico individual de cada policial.
          </p>
        </div>

        {/* Notice Alert */}
        {notice && (
          <div className={`p-4 rounded-xl border text-xs mb-6 flex items-center justify-between gap-3 ${
            notice.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}>
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="underline hover:opacity-80">Fechar</button>
          </div>
        )}

        {/* Malformed "Geral " members warning */}
        {malformedGeralCount > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <span>{malformedGeralCount} militares com prefixo &quot;Geral&quot; detectados</span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Exemplos: <code>Geral MacTrevah</code>, <code>Geral ._Aizen_.</code>, etc. O parser agora reconhece cargos compostos. Você pode limpar estes registros antigos para reimportar perfeitamente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCleanGeral}
              disabled={cleaning}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cleaning ? 'animate-spin' : ''}`} />
              <span>{cleaning ? 'Limpando...' : 'Limpar Militares Incorretos'}</span>
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nick ou tag..."
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
              >
                <option value="TODOS">Status: Todos</option>
                <option value="ATIVOS">Apenas Ativos</option>
                <option value="INDISPONIVEIS">Em Licença / Reserva</option>
                <option value="DESLIGADOS">Desligados</option>
              </select>
            </div>

            {/* Shift Filter */}
            <div>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
              >
                <option value="TODOS">Turno: Todos</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Madrugada">Madrugada</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
              >
                <option value="">Cargo: Todos</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Exibindo <strong>{filteredMembers.length}</strong> militares</span>
            <span className="text-[11px] text-[#71717A]">Clique em uma linha para abrir o dossiê</span>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-12 bg-[#18181B] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A1A1AA]">
              Nenhum militar localizado com os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E22]">
              {filteredMembers.map((member) => {
                return (
                  <Link
                    key={member.id}
                    href={`/militares/${member.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#151518] transition-colors group"
                  >
                    {/* Left: Nick & Role */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1E1E22] border border-[#27272A] flex items-center justify-center text-xs font-semibold text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
                        {member.nick.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#FAFAFA] group-hover:text-emerald-400 transition-colors">
                            {member.nick}
                          </span>
                          {member.tag && (
                            <span className="text-[10px] font-mono text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded">
                              [{member.tag}]
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#A1A1AA] mt-0.5">
                          {member.role} • {member.specialization}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Shifts & Tasks */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {member.shifts.map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-medium text-[#FAFAFA] bg-[#1E1E22] border border-[#27272A] px-2 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {member.tasks && member.tasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          {member.tasks.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono text-[#A1A1AA] bg-[#09090B] border border-[#27272A] px-1.5 py-0.5 rounded"
                            >
                              {t}
                            </span>
                          ))}
                          {member.tasks.length > 3 && (
                            <span className="text-[10px] text-[#71717A]">
                              +{member.tasks.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Status badge & Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {member.isDismissed ? (
                        <span className="text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                          Desligado
                        </span>
                      ) : member.isOnLeave ? (
                        <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Licença
                        </span>
                      ) : member.status === 'ATIVO' ? (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          Ativo no Turno
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#71717A] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded">
                          Não Qualificado
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteMember(member, e)}
                        className="p-1.5 text-[#52525B] hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title={`Excluir ${member.nick}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-[#FAFAFA] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
