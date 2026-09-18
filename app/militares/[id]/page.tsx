'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AttendanceModal } from '@/components/AttendanceModal';
import { NoteModal } from '@/components/NoteModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { 
  getMemberById, 
  getMemberTimeline, 
  getMemberAttendanceHistory, 
  getMemberNotes, 
  getAppSettings,
  saveAttendance,
  addMemberNote,
  updateMember,
  addTimelineEvent,
  deleteMember,
  getMemberQualityFollowUp
} from '@/lib/firestoreService';
import { 
  Member, 
  TimelineEvent, 
  AttendanceRecord, 
  NoteRecord, 
  AppSettings,
  AttendanceStatus,
  QualityPeriodFollowUp
} from '@/lib/types';
import { QualitySummaryCard } from '@/components/QualitySummaryCard';
import { QualityFollowUpView } from '@/components/QualityFollowUpView';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award, 
  History, 
  Plus, 
  User, 
  AlertCircle,
  Clock3,
  Edit3,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [qualityFollowUp, setQualityFollowUp] = useState<QualityPeriodFollowUp | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'visao-geral' | 'qualidade' | 'presenca' | 'anotacoes' | 'historico'
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'qualidade' | 'presenca' | 'anotacoes' | 'historico'>('visao-geral');

  // Modals state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!memberId) return;
    try {
      const [m, setts, tl, att, nts, qf] = await Promise.all([
        getMemberById(memberId),
        getAppSettings(),
        getMemberTimeline(memberId),
        getMemberAttendanceHistory(memberId),
        getMemberNotes(memberId),
        getMemberQualityFollowUp(memberId),
      ]);
      setMember(m);
      setSettings(setts);
      setTimeline(tl);
      setAttendanceList(att);
      setNotes(nts);
      setQualityFollowUp(qf);
    } catch (err) {
      console.error('Error fetching member profile:', err);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    let isMounted = true;
    loadData();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8 text-center max-w-md mx-auto my-auto">
          <h2 className="text-xl font-bold text-white mb-2">Militar Não Encontrado</h2>
          <p className="text-xs text-[#A1A1AA] mb-4">O registro solicitado não consta no Firestore.</p>
          <Link href="/militares" className="px-4 py-2 bg-emerald-600 text-white rounded text-xs">
            Voltar para Militares
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveAttendance = async (data: {
    status: AttendanceStatus;
    checkIn: string;
    checkOut: string;
    observation: string;
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    await saveAttendance(member.id, todayStr, {
      ...data,
      author: settings?.adminDisplayName || 'Oficial de Turno',
    });
    loadData();
  };

  const handleSaveNote = async (data: {
    type: 'DIARIA' | 'GERAL';
    content: string;
    date?: string;
  }) => {
    await addMemberNote(member.id, {
      memberId: member.id,
      type: data.type,
      content: data.content,
      date: data.date,
      author: settings?.adminDisplayName || 'Oficial de Turno',
    });
    loadData();
  };

  const handleSaveSchedule = async (schedule: string) => {
    await updateMember(member.id, { customSchedule: schedule });
    setMember((prev) => prev ? { ...prev, customSchedule: schedule } : null);
  };

  const handleDeleteMember = async () => {
    if (!member) return;
    if (confirm(`Tem certeza que deseja excluir o militar "${member.nick}" permanentemente do sistema?`)) {
      try {
        await deleteMember(member.id);
        router.push('/militares');
      } catch (err) {
        console.error('Error deleting member:', err);
        alert('Erro ao excluir militar.');
      }
    }
  };

  const todayRecord = attendanceList.find(a => a.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings?.selectedShift || 'Manhã'} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Top return breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/militares"
            className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para lista de militares</span>
          </Link>

          {/* Action Modals triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-medium text-[#FAFAFA] rounded-lg border border-[#27272A] transition-colors"
            >
              <Clock3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Registrar Presença</span>
            </button>
            <button
              onClick={() => setNoteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-medium text-[#FAFAFA] rounded-lg border border-[#27272A] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nova Anotação</span>
            </button>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-xs font-medium text-[#FAFAFA] rounded-lg border border-[#27272A] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Editar Horário</span>
            </button>
          </div>
        </div>

        {/* Member Profile Header Card */}
        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#1E1E22] border border-[#27272A] flex items-center justify-center text-lg font-bold text-emerald-400 shrink-0">
                {member.nick.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#FAFAFA]">
                    {member.nick}
                  </h1>
                  {member.tag && (
                    <span className="text-xs font-mono text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded">
                      [{member.tag}]
                    </span>
                  )}
                  {member.isDismissed ? (
                    <span className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                      Desligado
                    </span>
                  ) : member.isOnLeave ? (
                    <span className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      Licença / Reserva
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {member.status === 'ATIVO' ? 'Ativo no Turno' : member.status}
                    </span>
                  )}
                </div>

                <div className="text-xs font-medium text-[#A1A1AA] mt-1 flex items-center gap-3">
                  <span className="text-white font-semibold">{member.role}</span>
                  <span>•</span>
                  <span>{member.specialization}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Today's Status indicator */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3 flex items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block">
                    Presença Hoje
                  </span>
                  <span className={`text-xs font-semibold ${
                    todayRecord?.status === 'Presente' ? 'text-emerald-400' :
                    todayRecord?.status === 'Ausente' ? 'text-rose-400' :
                    todayRecord?.status === 'Justificado' ? 'text-amber-400' : 'text-[#A1A1AA]'
                  }`}>
                    {todayRecord?.status || 'Não registrado'}
                  </span>
                </div>
                {todayRecord?.checkIn && (
                  <div className="border-l border-[#27272A] pl-3">
                    <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block">
                      Horário
                    </span>
                    <span className="text-xs font-mono text-white">
                      {todayRecord.checkIn} {todayRecord.checkOut ? `→ ${todayRecord.checkOut}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Delete Member Button */}
              <button
                type="button"
                onClick={handleDeleteMember}
                className="p-3 bg-[#09090B] hover:bg-red-950/40 text-[#71717A] hover:text-red-400 border border-[#27272A] hover:border-red-800/40 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 shrink-0"
                title="Excluir Militar Permanentemente"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px] font-medium">Excluir</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block mb-1">
                Turno Oficial
              </span>
              <span className="font-medium text-[#FAFAFA]">
                {member.shifts.join(', ') || 'Nenhum'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block mb-1">
                Última Promoção
              </span>
              <span className="font-medium text-[#FAFAFA]">
                {member.lastPromotionDate || 'Não informada'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block mb-1">
                Horário Habitual
              </span>
              <span className="font-medium text-[#FAFAFA]">
                {member.customSchedule || 'Padrão do turno'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider block mb-1">
                Promoção Permitida
              </span>
              <span className="font-medium text-emerald-400">
                {member.allowedPromotionDate || 'Disponível'}
              </span>
            </div>
          </div>

          {/* ADV or Leave warnings */}
          {(member.adv !== undefined && member.adv > 0 || member.isOnLeave) && (
            <div className="mt-4 pt-4 border-t border-[#27272A] flex flex-wrap gap-3 text-xs">
              {member.adv !== undefined && member.adv > 0 && (
                <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Possui advertência ativa: <strong>ADV {member.adv}</strong></span>
                </div>
              )}
              {member.isOnLeave && (
                <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Situação: {member.leaveReason || 'Licença'}
                    {member.leaveStartDate && ` (${member.leaveStartDate} a ${member.leaveEndDate})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#27272A] mb-6 overflow-x-auto">
          {[
            { id: 'visao-geral', label: <span>Visão Geral</span> },
            { 
              id: 'qualidade', 
              label: (
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Qualidade</span>
                  {qualityFollowUp?.currentScore !== undefined && (
                    <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {qualityFollowUp.currentScore.toFixed(1)}
                    </span>
                  )}
                </span>
              )
            },
            { id: 'presenca', label: <span>Presença ({attendanceList.length})</span> },
            { id: 'anotacoes', label: <span>Anotações ({notes.length})</span> },
            { id: 'historico', label: <span>Histórico / Timeline ({timeline.length})</span> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-[#FAFAFA]'
                  : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB QUALIDADE / ACOMPANHAMENTO */}
        {activeTab === 'qualidade' && (
          <QualityFollowUpView
            member={member}
            currentAdminName={settings?.adminDisplayName || 'Diretoria de Turno'}
            timeline={timeline}
            attendanceList={attendanceList}
            notes={notes}
            onRefreshParent={loadData}
          />
        )}

        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-6">
            {/* Quick Quality Summary Card */}
            <QualitySummaryCard
              followUp={qualityFollowUp}
              onOpenFollowUp={() => setActiveTab('qualidade')}
            />

            {/* Tasks section */}
            <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
              <h3 className="font-semibold text-sm text-[#FAFAFA] mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Tarefas e Especializações Atribuídas
              </h3>
              {member.tasks && member.tasks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {member.tasks.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-lg font-mono text-xs text-[#E4E4E7]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#71717A] italic">Nenhuma tarefa atribuída nesta listagem.</p>
              )}
            </div>

            {/* Quick summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent notes preview */}
              <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Últimas Anotações
                  </h3>
                  <button onClick={() => setNoteModalOpen(true)} className="text-xs text-emerald-400 hover:underline">
                    Adicionar
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p className="text-xs text-[#71717A] italic">Nenhuma anotação registrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {notes.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg text-xs">
                        <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
                          <span className="font-medium text-emerald-400">{n.type === 'DIARIA' ? 'Anotação Diária' : 'Anotação Geral'}</span>
                          <span>{n.date || new Date(n.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-[#D4D4D8]">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent timeline preview */}
              <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-[#FAFAFA] flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    Últimos Eventos do Militar
                  </h3>
                  <button onClick={() => setActiveTab('historico')} className="text-xs text-emerald-400 hover:underline">
                    Ver todos
                  </button>
                </div>
                {timeline.length === 0 ? (
                  <p className="text-xs text-[#71717A] italic">Nenhum evento registrado no histórico.</p>
                ) : (
                  <div className="space-y-3">
                    {timeline.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="border-l-2 border-emerald-500/40 pl-3 py-0.5 text-xs">
                        <div className="text-[10px] text-[#71717A] uppercase font-semibold">
                          {format(new Date(ev.timestamp), 'dd MMM yyyy', { locale: ptBR })}
                        </div>
                        <div className="font-medium text-white">{ev.title}</div>
                        <div className="text-[#A1A1AA] text-[11px]">{ev.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESENÇA */}
        {activeTab === 'presenca' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA]">
                Histórico permanente de chamadas e horários do militar.
              </span>
              <button
                onClick={() => setAttendanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Chamada</span>
              </button>
            </div>

            <div className="bg-[#111113] border border-[#27272A] rounded-xl overflow-hidden">
              {attendanceList.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#71717A]">
                  Nenhum registro de presença para este militar. Clique em &quot;Registrar Chamada&quot; para apontar presença.
                </div>
              ) : (
                <div className="divide-y divide-[#1E1E22]">
                  {attendanceList.map((rec) => (
                    <div key={rec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-white">
                            {rec.date ? format(new Date(rec.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : rec.date}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                            rec.status === 'Presente' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            rec.status === 'Ausente' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                            rec.status === 'Justificado' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                            'text-[#A1A1AA] bg-[#18181B] border-[#27272A]'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        {rec.observation && (
                          <p className="text-[#A1A1AA] text-xs mt-1 italic">
                            &quot;{rec.observation}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[#A1A1AA]">
                        {rec.checkIn && (
                          <div>
                            <span className="text-[10px] text-[#71717A] block uppercase">Entrada / Saída</span>
                            <span className="font-mono text-white">{rec.checkIn} {rec.checkOut ? `— ${rec.checkOut}` : ''}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-[#71717A] block uppercase">Oficial</span>
                          <span>{rec.author || 'Oficial'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ANOTAÇÕES */}
        {activeTab === 'anotacoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA]">
                Anotações diárias e gerais vinculadas permanentemente ao militar.
              </span>
              <button
                onClick={() => setNoteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Anotação</span>
              </button>
            </div>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="bg-[#111113] border border-[#27272A] rounded-xl p-12 text-center text-xs text-[#71717A]">
                  Nenhuma anotação cadastrada para este militar.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                          n.type === 'DIARIA'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        }`}>
                          {n.type === 'DIARIA' ? 'Anotação Diária' : 'Anotação Geral'}
                        </span>
                        {n.date && (
                          <span className="font-semibold text-white">
                            {format(new Date(n.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#71717A]">
                        Autor: <strong className="text-white">{n.author}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-[#FAFAFA] leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HISTÓRICO / TIMELINE */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            <div className="text-xs text-[#A1A1AA] mb-2">
              Linha do tempo permanente de promoções, cargos, tarefas, turnos e licenças. Eventos nunca são sobrescritos.
            </div>

            <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6">
              {timeline.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#71717A]">
                  Nenhum evento registrado nesta linha do tempo.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#27272A]">
                  {timeline.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#111113]" />
                      <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">
                        {format(new Date(ev.timestamp), 'dd MMM yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        {ev.title}
                      </div>
                      <div className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                        {ev.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        <AttendanceModal
          isOpen={attendanceModalOpen}
          memberNick={member.nick}
          memberRole={member.role}
          initialStatus={todayRecord?.status || 'Presente'}
          initialCheckIn={todayRecord?.checkIn || ''}
          initialCheckOut={todayRecord?.checkOut || ''}
          initialObservation={todayRecord?.observation || ''}
          onClose={() => setAttendanceModalOpen(false)}
          onSave={handleSaveAttendance}
        />

        <NoteModal
          isOpen={noteModalOpen}
          memberNick={member.nick}
          memberRole={member.role}
          onClose={() => setNoteModalOpen(false)}
          onSave={handleSaveNote}
        />

        <ScheduleModal
          isOpen={scheduleModalOpen}
          memberNick={member.nick}
          memberRole={member.role}
          initialSchedule={member.customSchedule || ''}
          onClose={() => setScheduleModalOpen(false)}
          onSave={handleSaveSchedule}
        />
      </main>
    </div>
  );
}
