'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { getImportSnapshots, getAppSettings, deleteImportSnapshot, deleteTodayImport } from '@/lib/firestoreService';
import { ImportSnapshot, AppSettings } from '@/lib/types';
import { History, Calendar, FileText, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoPage() {
  const [snapshots, setSnapshots] = useState<ImportSnapshot[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetSnapshot, setTargetSnapshot] = useState<ImportSnapshot | null>(null);
  const [deleteMembersAlso, setDeleteMembersAlso] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [snaps, setts] = await Promise.all([
        getImportSnapshots(),
        getAppSettings(),
      ]);
      setSnapshots(snaps);
      setSettings(setts);
    } catch (err) {
      console.error('Error loading history snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyRaw = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDeleteModal = (snap: ImportSnapshot) => {
    setTargetSnapshot(snap);
    setDeleteMembersAlso(true);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetSnapshot) return;
    setDeletingId(targetSnapshot.id);
    try {
      const { deletedMembersCount } = await deleteImportSnapshot(targetSnapshot.id, deleteMembersAlso);
      setStatusMessage({
        type: 'success',
        text: `Sincronização excluída com sucesso! ${deletedMembersCount > 0 ? `(${deletedMembersCount} militares associados removidos)` : ''}`
      });
      setDeleteModalOpen(false);
      setTargetSnapshot(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting snapshot:', err);
      setStatusMessage({ type: 'error', text: 'Erro ao excluir sincronização.' });
    } finally {
      setDeletingId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySnapshot = snapshots.find(s => s.importedAt && s.importedAt.startsWith(todayStr));

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Auditoria Permanente</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Histórico de Sincronizações
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Registro de cada listagem importada, com o texto original integral, auditoria de modificações e alterações confirmadas. O texto original nunca é descartado.
          </p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border mb-6 text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs underline hover:opacity-80">Fechar</button>
          </div>
        )}

        {/* Today's active sync banner */}
        {todaySnapshot && (
          <div className="bg-[#18181B]/80 border border-[#27272A] rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
                  <span>Sincronização do Dia Realizada</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">HOJE</span>
                </div>
                <div className="text-xs text-[#A1A1AA]">
                  {todaySnapshot.parsedCount} militares processados às {format(new Date(todaySnapshot.importedAt), "HH:mm", { locale: ptBR })} por {todaySnapshot.importedBy}.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openDeleteModal(todaySnapshot)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar Sincronização de Hoje</span>
              </button>
            </div>
          </div>
        )}

        {/* Snapshots list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-32 bg-[#111113] rounded-xl border border-[#27272A] animate-pulse" />
            ))}
          </div>
        ) : snapshots.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-12 text-center text-xs text-[#A1A1AA]">
            <History className="w-12 h-12 text-[#3F3F46] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">Nenhum snapshot registrado</h3>
            <p className="max-w-sm mx-auto">Assim que você colar a primeira listagem e confirmar, os snapshots de auditoria serão listados aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {snapshots.map((snap) => {
              const isExpanded = expandedId === snap.id;
              const isToday = snap.importedAt && snap.importedAt.startsWith(todayStr);
              const dateFormatted = snap.importedAt 
                ? format(new Date(snap.importedAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
                : 'Data não informada';

              return (
                <div 
                  key={snap.id}
                  className="bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-[#FAFAFA]">
                          Sincronização Diária
                        </span>
                        {isToday && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                            HOJE
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {snap.parsedCount} militares
                        </span>
                      </div>
                      <div className="text-xs text-[#A1A1AA] flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
                          {dateFormatted}
                        </span>
                        <span>•</span>
                        <span>Responsável: <strong className="text-white">{snap.importedBy}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopyRaw(snap.rawText, snap.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-medium rounded-lg border border-[#27272A] transition-colors"
                        title="Copiar texto original"
                      >
                        {copiedId === snap.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === snap.id ? 'Copiado!' : 'Copiar Original'}</span>
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-medium rounded-lg border border-[#27272A] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Ocultar Texto' : 'Ver Texto Original'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => openDeleteModal(snap)}
                        disabled={deletingId === snap.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#18181B] hover:bg-red-950/40 text-[#71717A] hover:text-red-400 text-xs font-medium rounded-lg border border-[#27272A] hover:border-red-800/40 transition-colors"
                        title="Excluir sincronização"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded view showing original text */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#27272A] animate-in fade-in duration-150">
                      <div className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider mb-2">
                        Texto Bruto Preservado no Snapshot
                      </div>
                      <pre className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-xs font-mono text-[#D4D4D8] overflow-x-auto whitespace-pre-wrap max-h-96">
                        {snap.rawText}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && targetSnapshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111113] border border-[#27272A] rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-[#FAFAFA]">Excluir Sincronização</h3>
              </div>

              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                Você está excluindo a sincronização de{' '}
                <strong className="text-white">
                  {targetSnapshot.importedAt 
                    ? format(new Date(targetSnapshot.importedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : 'data selecionada'}
                </strong>{' '}
                ({targetSnapshot.parsedCount} militares).
              </p>

              <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3 mb-5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMembersAlso}
                    onChange={(e) => setDeleteMembersAlso(e.target.checked)}
                    className="mt-0.5 rounded border-[#3F3F46] text-red-500 focus:ring-0 bg-[#09090B]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#FAFAFA]">Remover militares associados</span>
                    <p className="text-[#A1A1AA] mt-0.5">
                      Apaga os registros de militares cadastrados nesta data ou com erros de formatação anterior (ex: prefixo &quot;Geral&quot; no nick), deixando a base limpa para nova importação.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setTargetSnapshot(null);
                  }}
                  className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-medium text-[#FAFAFA] rounded-lg border border-[#27272A] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingId !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
