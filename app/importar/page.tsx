'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { parseRCCList } from '@/lib/parser';
import { compareImportWithExisting } from '@/lib/comparator';
import { getAllMembers, getAppSettings, commitImportSnapshot, getTodayImportSnapshot, deleteTodayImport, cleanupMalformedGeralMembers } from '@/lib/firestoreService';
import { ParsedMember, DetectedChange, Member, AppSettings, ImportSnapshot } from '@/lib/types';
import { 
  FileUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  UserMinus, 
  Sparkles, 
  RotateCcw, 
  Calendar,
  Clock,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ImportPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [existingMembers, setExistingMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [todaySnapshot, setTodaySnapshot] = useState<ImportSnapshot | null>(null);
  const [malformedMembersCount, setMalformedMembersCount] = useState(0);
  const [replaceToday, setReplaceToday] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cleaningAction, setCleaningAction] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parsing & Review Step State
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  // selected changes indices to apply
  const [selectedChangesIndices, setSelectedChangesIndices] = useState<Set<number>>(new Set());
  const [committing, setCommitting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const loadContext = async () => {
    try {
      const [mems, setts, todaySnap] = await Promise.all([
        getAllMembers(),
        getAppSettings(),
        getTodayImportSnapshot(),
      ]);
      setExistingMembers(mems);
      setSettings(setts);
      setTodaySnapshot(todaySnap);

      const malformed = mems.filter(m => 
        m.nick.toLowerCase().startsWith('geral ') || 
        m.normalizedNick.toLowerCase().startsWith('geral_') ||
        m.role.toLowerCase() === 'geral'
      ).length;
      setMalformedMembersCount(malformed);
    } catch (err) {
      console.error('Error loading data for import:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  const handleCleanGeralMembers = async () => {
    if (!confirm('Deseja remover os militares com prefixo "Geral" incorreto? Após isso você poderá reimportar a listagem com o formato correto.')) {
      return;
    }
    setCleaningAction('geral');
    try {
      const count = await cleanupMalformedGeralMembers();
      setActionNotice({
        type: 'success',
        text: `${count} militares incorretos com prefixo "Geral" foram removidos com sucesso.`
      });
      await loadContext();
    } catch (err) {
      console.error('Error cleaning up members:', err);
      setActionNotice({ type: 'error', text: 'Erro ao remover militares.' });
    } finally {
      setCleaningAction(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleDeleteTodaySync = async () => {
    if (!confirm('Tem certeza que deseja apagar a sincronização de hoje? Isso removerá o snapshot de hoje e os militares importados nesta data para que você possa começar do zero.')) {
      return;
    }
    setCleaningAction('today');
    try {
      const { deletedMembersCount } = await deleteTodayImport();
      setActionNotice({
        type: 'success',
        text: `Sincronização de hoje apagada com sucesso! ${deletedMembersCount > 0 ? `(${deletedMembersCount} registros limpos)` : ''}`
      });
      await loadContext();
    } catch (err) {
      console.error('Error deleting today sync:', err);
      setActionNotice({ type: 'error', text: 'Erro ao apagar sincronização de hoje.' });
    } finally {
      setCleaningAction(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleParseAndReview = () => {
    if (!rawText.trim()) return;

    const parsed = parseRCCList(rawText);
    setParsedMembers(parsed);

    // Compare with current database state
    const changes = compareImportWithExisting(parsed, existingMembers);
    setDetectedChanges(changes);

    // By default, select all changes
    const indices = new Set<number>();
    changes.forEach((_, idx) => indices.add(idx));
    setSelectedChangesIndices(indices);

    setStep('review');
  };

  const toggleChangeSelection = (index: number) => {
    setSelectedChangesIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirmImport = async () => {
    setCommitting(true);
    try {
      const confirmedChanges = detectedChanges.filter((_, idx) => selectedChangesIndices.has(idx));
      
      await commitImportSnapshot({
        rawText,
        parsedList: parsedMembers,
        detectedChanges,
        confirmedChanges,
        author: settings?.adminDisplayName || 'Oficial de Turno',
        selectedShift: settings?.selectedShift || 'Manhã',
        replaceToday,
      });

      setImportSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Error committing import snapshot:', err);
      alert('Erro ao salvar importação. Verifique o console para mais detalhes.');
    } finally {
      setCommitting(false);
    }
  };

  const handleCancelReview = () => {
    setStep('input');
  };

  const handlePasteExample = () => {
    const example = `Especialização Intermediária

1. Chanceler Klests [D71] 29 Ago 2026 [TRE.2/Ins.ECE] [Manhã/Noite]

2. Vice-Presidente J.Albecy [Pgs] 15 Set 2026 [Cap.INS/A.DC/P.CFO/A.AF/M.CEM] [Noite] [ADV: 1] [Promoção permitida: 30 Set 2026]

3. Superintendente -:Lisboa [DIR] 04 Ago 2026 [Min.INS/Cons.CFO] [Manhã]

4. Coordenador JadeEstrela [Bif] 19 Ago 2026 [Fisc.SUP/Av.CFO/Grad.ROND] [Manhã] [27 Ago 2026 a 26 Set 2026]

Portadores de Especialização Intermediária em licença/reserva

5. Inspetor Victor_Silva [Vtr] 10 Ago 2026 [Instr.CFO] [Manhã] [Licença médica] [15 Ago 2026 a 15 Out 2026]`;
    setRawText(example);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <FileUp className="w-3.5 h-3.5" />
            <span>Sincronização Diária da Listagem</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Importar Listagem RCC
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Cole o texto oficial da Polícia RCC. O sistema interpretará os cargos, turnos, tarefas e detectará alterações antes de persistir no banco.
          </p>
        </div>

        {importSuccess ? (
          <div className="bg-[#111113] border border-emerald-500/30 rounded-xl p-10 text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#FAFAFA] mb-2">Importação Concluída com Sucesso!</h2>
            <p className="text-xs text-[#A1A1AA] mb-4">
              O banco de dados foi atualizado, as timelines foram geradas e os membros sincronizados. Redirecionando para o Dashboard...
            </p>
          </div>
        ) : step === 'input' ? (
          /* STEP 1: TEXTAREA INPUT */
          <div className="space-y-4">
            {/* Notice Alert */}
            {actionNotice && (
              <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                actionNotice.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}>
                <span>{actionNotice.text}</span>
                <button onClick={() => setActionNotice(null)} className="underline hover:opacity-80">Fechar</button>
              </div>
            )}

            {/* Today Sync Detected Banner */}
            {todaySnapshot && (
              <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
                      <span>Sincronização de Hoje Já Realizada</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">1 POR DIA</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      {todaySnapshot.parsedCount} militares importados às {format(new Date(todaySnapshot.importedAt), "HH:mm", { locale: ptBR })} por {todaySnapshot.importedBy}.
                      Ao colar uma nova lista, ela <strong>substituirá a sincronização anterior de hoje</strong> automaticamente.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteTodaySync}
                  disabled={cleaningAction !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{cleaningAction === 'today' ? 'Apagando...' : 'Apagar Sincronização de Hoje'}</span>
                </button>
              </div>
            )}

            {/* Malformed "Geral " members warning */}
            {malformedMembersCount > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      <span>Ajuste Necessário: {malformedMembersCount} militares com prefixo &quot;Geral&quot;</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Foram detectados nicks importados anteriormente com a palavra &quot;Geral&quot; presa ao nome (ex: <code>Geral MacTrevah</code>).
                      Agora que o parser foi corrigido para cargos compostos (Inspetor-Geral, Superintendente-Geral, etc.), você pode limpá-los e reimportar.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCleanGeralMembers}
                  disabled={cleaningAction !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cleaningAction === 'geral' ? 'animate-spin' : ''}`} />
                  <span>{cleaningAction === 'geral' ? 'Limpando...' : 'Limpar Militares Incorretos'}</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">
                Listagem diária (Especialização Intermediária, Avançada, Licenças)
              </span>
              <button
                type="button"
                onClick={handlePasteExample}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Colar exemplo de demonstração
              </button>
            </div>

            <textarea
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui a listagem completa copiada do fórum ou documento da RCC..."
              className="w-full bg-[#111113] border border-[#27272A] rounded-xl p-4 text-xs font-mono text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50 resize-y"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-[11px] text-[#71717A] flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Nenhuma alteração é gravada no Firestore antes de sua revisão explícita.</span>
              </div>

              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={handleParseAndReview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
              >
                <span>Revisar Alterações</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: REVIEW DETECTED CHANGES */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Summary card */}
            <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
                <div>
                  <h3 className="font-semibold text-base text-[#FAFAFA]">Prévia das Alterações Detectadas</h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {parsedMembers.length} militares identificados na listagem. {detectedChanges.length} alterações detectadas comparando com o histórico.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all = new Set<number>();
                      detectedChanges.forEach((_, i) => all.add(i));
                      setSelectedChangesIndices(all);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#1E1E22] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded border border-[#27272A]"
                  >
                    Marcar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChangesIndices(new Set())}
                    className="px-2.5 py-1 text-[11px] bg-[#1E1E22] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded border border-[#27272A]"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Badges overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                  <span className="text-[#71717A] block text-[11px]">Novos Membros</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {detectedChanges.filter(c => c.type === 'new_member').length}
                  </span>
                </div>
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                  <span className="text-[#71717A] block text-[11px]">Mudança de Cargo</span>
                  <span className="font-bold text-blue-400 text-base">
                    {detectedChanges.filter(c => c.type === 'role_change').length}
                  </span>
                </div>
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                  <span className="text-[#71717A] block text-[11px]">Tarefas / Licenças</span>
                  <span className="font-bold text-amber-400 text-base">
                    {detectedChanges.filter(c => c.type.includes('task') || c.type.includes('leave')).length}
                  </span>
                </div>
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                  <span className="text-[#71717A] block text-[11px]">Possíveis Desligamentos</span>
                  <span className="font-bold text-rose-400 text-base">
                    {detectedChanges.filter(c => c.type === 'possible_dismissal').length}
                  </span>
                </div>
              </div>
            </div>

            {/* List of changes */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Detalhamento das Alterações
              </h4>

              {detectedChanges.length === 0 ? (
                <div className="bg-[#111113] border border-[#27272A] rounded-xl p-8 text-center text-xs text-[#A1A1AA]">
                  Nenhuma alteração estrutural detectada em relação à última versão. Os dados dos membros permanecerão sincronizados.
                </div>
              ) : (
                detectedChanges.map((change, idx) => {
                  const isChecked = selectedChangesIndices.has(idx);

                  const changeTypeColors: Record<string, { badge: string; border: string }> = {
                    new_member: { badge: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20' },
                    role_change: { badge: 'text-blue-400 bg-blue-500/10', border: 'border-blue-500/20' },
                    shift_change: { badge: 'text-purple-400 bg-purple-500/10', border: 'border-purple-500/20' },
                    task_added: { badge: 'text-cyan-400 bg-cyan-500/10', border: 'border-cyan-500/20' },
                    task_removed: { badge: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/20' },
                    leave_started: { badge: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/20' },
                    leave_ended: { badge: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20' },
                    possible_dismissal: { badge: 'text-rose-400 bg-rose-500/10', border: 'border-rose-500/20' },
                    reactivated: { badge: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20' },
                  };

                  const currentColors = changeTypeColors[change.type] || {
                    badge: 'text-[#A1A1AA] bg-[#27272A]',
                    border: 'border-[#27272A]',
                  };

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChangeSelection(idx)}
                      className={`cursor-pointer bg-[#111113] hover:bg-[#151518] border ${
                        isChecked ? currentColors.border : 'border-[#27272A] opacity-60'
                      } rounded-xl p-4 transition-all flex items-start gap-4`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChangeSelection(idx)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 rounded border-[#27272A] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-[#09090B]"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${currentColors.badge}`}>
                            {change.title}
                          </span>
                          <span className="font-semibold text-xs text-[#FAFAFA]">
                            {change.memberNick}
                          </span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Replace today option card */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#FAFAFA]">
                    Substituir sincronização de hoje
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                    Recomendado (1 por dia)
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] mt-1">
                  Sobrescreve a sincronização anterior da data de hoje, garantindo histórico único diário e limpando militares com nicks antigos ou incorretos.
                </p>
              </div>
              <input
                type="checkbox"
                checked={replaceToday}
                onChange={(e) => setReplaceToday(e.target.checked)}
                className="w-4 h-4 rounded border-[#3F3F46] text-emerald-500 focus:ring-0 bg-[#09090B] cursor-pointer shrink-0"
              />
            </div>

            {/* Confirmation actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#27272A]">
              <button
                type="button"
                onClick={handleCancelReview}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] rounded-lg transition-colors border border-[#27272A]"
              >
                Cancelar e Corrigir Texto
              </button>

              <button
                type="button"
                disabled={committing}
                onClick={handleConfirmImport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {committing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Aplicando ao Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Aplicar Importação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
