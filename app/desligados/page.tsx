'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { 
  getAllMembers, 
  getAppSettings, 
  deleteMember, 
  reactivateMember, 
  cleanupDuplicateMembers, 
  clearAllDismissedMembers 
} from '@/lib/firestoreService';
import { Member, AppSettings } from '@/lib/types';
import { 
  UserX, 
  Search, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Tag, 
  AlertTriangle,
  History,
  RotateCcw,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DesligadosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [mems, setts] = await Promise.all([
        getAllMembers(),
        getAppSettings(),
      ]);
      // Filter only dismissed members
      setMembers(mems.filter(m => m.isDismissed || m.status === 'DESLIGADO'));
      setSettings(setts);
    } catch (err) {
      console.error('Error loading dismissed members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReactivate = async (e: React.MouseEvent, memberId: string, nick: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Deseja reativar o militar ${nick} e retorná-lo para a lista de militares ativos?`)) {
      return;
    }

    setActionLoading(memberId);
    try {
      await reactivateMember(memberId);
      setFeedback({ type: 'success', text: `Militar ${nick} reativado com sucesso!` });
      await loadData();
    } catch (err) {
      console.error('Error reactivating member:', err);
      setFeedback({ type: 'error', text: 'Erro ao reativar militar.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteMember = async (e: React.MouseEvent, memberId: string, nick: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o registro de ${nick}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setActionLoading(memberId);
    try {
      await deleteMember(memberId);
      setFeedback({ type: 'success', text: `Registro de ${nick} excluído com sucesso.` });
      await loadData();
    } catch (err) {
      console.error('Error deleting member:', err);
      setFeedback({ type: 'error', text: 'Erro ao excluir militar.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCleanDuplicates = async () => {
    if (!confirm('Deseja verificar e remover registros duplicados/fantasmas (militares que aparecem como desligados mas continuam ativos com pontuação diferente no nick)?')) {
      return;
    }
    setActionLoading('clean_duplicates');
    try {
      const count = await cleanupDuplicateMembers();
      setFeedback({
        type: 'success',
        text: count > 0 ? `${count} registros duplicados/fantasmas foram removidos!` : 'Nenhum registro duplicado ou fantasma encontrado.'
      });
      await loadData();
    } catch (err) {
      console.error('Error cleaning duplicates:', err);
      setFeedback({ type: 'error', text: 'Erro ao limpar duplicados.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleClearAllDismissed = async () => {
    if (!confirm('ATENÇÃO: Deseja apagar TODOS os militares da lista de desligados? Essa ação limpará todos os registros de membros desligados.')) {
      return;
    }
    setActionLoading('clear_all');
    try {
      const count = await clearAllDismissedMembers();
      setFeedback({
        type: 'success',
        text: `${count} militares desligados foram removidos do sistema.`
      });
      await loadData();
    } catch (err) {
      console.error('Error clearing dismissed members:', err);
      setFeedback({ type: 'error', text: 'Erro ao limpar lista de desligados.' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredDismissed = members.filter(m => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      m.nick.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term) ||
      (m.dismissalDetails?.lastRole && m.dismissalDetails.lastRole.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Feedback Alert */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1">
              <UserX className="w-3.5 h-3.5" />
              <span>Arquivo de Desligados</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
              Militares Desligados
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-2xl">
              Registro de membros que anteriormente pertenciam à RCC mas desapareceram das listagens oficiais. Você pode reativá-los ou excluí-los a qualquer momento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCleanDuplicates}
              disabled={actionLoading !== null}
              className="px-3 py-2 bg-[#1A1A1E] hover:bg-[#242428] border border-[#27272A] text-xs font-medium text-[#FAFAFA] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Remove membros que constam como desligados mas já possuem perfil ativo atualizado"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{actionLoading === 'clean_duplicates' ? 'Verificando...' : 'Limpar Fantasmas/Duplicados'}</span>
            </button>

            {members.length > 0 && (
              <button
                onClick={handleClearAllDismissed}
                disabled={actionLoading !== null}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading === 'clear_all' ? 'Apagando...' : 'Apagar Todos'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md relative">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nick do desligado..."
            className="w-full bg-[#111113] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-rose-500/50"
          />
        </div>

        {/* Dismissed list */}
        <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-14 bg-[#18181B] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredDismissed.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A1A1AA]">
              <UserX className="w-10 h-10 text-[#3F3F46] mx-auto mb-3" />
              <p className="font-semibold text-white mb-1">Nenhum militar desligado registrado</p>
              <p className="text-[#71717A]">Quando um membro sumir de uma listagem confirmada, ele será preservado aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E22]">
              {filteredDismissed.map((member) => {
                const details = member.dismissalDetails || {};
                const lastRole = details.lastRole || member.role;
                const lastShifts = details.lastShifts || member.shifts;
                const isItemLoading = actionLoading === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-[#151518] transition-colors"
                  >
                    <Link
                      href={`/militares/${member.id}`}
                      className="flex items-center gap-3 group flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                        OFF
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#FAFAFA] group-hover:text-rose-400 transition-colors">
                            {member.nick}
                          </span>
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            Desligado
                          </span>
                        </div>
                        <div className="text-xs text-[#A1A1AA] mt-0.5">
                          Último cargo conhecido: <strong className="text-white">{lastRole}</strong>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1AA]">
                      {lastShifts && lastShifts.length > 0 && (
                        <div>
                          <span className="text-[#71717A] text-[11px] block">Último Turno:</span>
                          <span className="font-medium text-[#FAFAFA]">{lastShifts.join('/')}</span>
                        </div>
                      )}

                      {member.dismissedAt && (
                        <div>
                          <span className="text-[#71717A] text-[11px] block">Data do Desligamento:</span>
                          <span className="font-medium text-[#FAFAFA]">{new Date(member.dismissedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleReactivate(e, member.id, member.nick)}
                        disabled={isItemLoading}
                        className="px-2.5 py-1.5 bg-[#1E1E22] hover:bg-[#27272A] border border-[#2E2E33] rounded-lg text-xs font-medium text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="Reativar militar para a listagem de membros ativos"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reativar</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteMember(e, member.id, member.nick)}
                        disabled={isItemLoading}
                        className="p-1.5 bg-[#1E1E22] hover:bg-rose-500/20 border border-[#2E2E33] hover:border-rose-500/40 rounded-lg text-xs font-medium text-[#71717A] hover:text-rose-400 transition-colors disabled:opacity-50"
                        title="Excluir militar permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/militares/${member.id}`}
                        className="p-1.5 text-[#71717A] hover:text-white transition-colors"
                        title="Ver dossiê do militar"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
