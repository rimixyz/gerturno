'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getAllMembers, 
  getAppSettings, 
  getAttendanceByDate, 
  saveAttendance 
} from '@/lib/firestoreService';
import { Member, AppSettings, AttendanceRecord, AttendanceStatus, ShiftType } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { MemberCard } from '@/components/MemberCard';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  FileUp, 
  RefreshCw,
  Search,
  Calendar,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ativos' | 'indisponiveis'>('ativos');

  const [mounted, setMounted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = React.useCallback(async () => {
    try {
      const [appSettings, allMembers, todayAttendance] = await Promise.all([
        getAppSettings(),
        getAllMembers(),
        getAttendanceByDate(todayStr),
      ]);
      setSettings(appSettings);
      setMembers(allMembers);
      setAttendanceMap(todayAttendance);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr]);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;
    loadData();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const selectedShift: ShiftType = settings?.selectedShift || 'Manhã';

  // Filter members according to business rules:
  // Foco: Especialização Intermediária
  // ATIVOS: Intermediária, matches shift, not on leave, not dismissed
  const shiftMembers = members.filter((m) => {
    if (m.isDismissed) return false;
    const matches = m.shifts && m.shifts.includes(selectedShift);
    const isIntermediaria = m.specialization === 'Especialização Intermediária';
    return isIntermediaria && matches;
  });

  const activeInShift = shiftMembers.filter((m) => !m.isOnLeave);
  const unavailableInShift = shiftMembers.filter((m) => m.isOnLeave);

  // Indicators count
  let presentCount = 0;
  let absentCount = 0;
  let unrecordedCount = 0;

  activeInShift.forEach((m) => {
    const record = attendanceMap[m.id];
    const status = record?.status || 'Não registrado';
    if (status === 'Presente') presentCount++;
    else if (status === 'Ausente') absentCount++;
    else unrecordedCount++;
  });

  const handleQuickAttendance = async (memberId: string, status: AttendanceStatus) => {
    // optimistic UI update
    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: {
        id: todayStr,
        memberId,
        date: todayStr,
        status,
        updatedAt: new Date().toISOString(),
      },
    }));

    await saveAttendance(memberId, todayStr, { status });
  };

  // Filter list by search term
  const displayedMembers = (activeTab === 'ativos' ? activeInShift : unavailableInShift).filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.nick.toLowerCase().includes(term) ||
      m.role.toLowerCase().includes(term) ||
      (m.tag && m.tag.toLowerCase().includes(term)) ||
      m.tasks.some((t) => t.toLowerCase().includes(term))
    );
  });

  const getGreeting = () => {
    if (!mounted) return 'Painel de Turno';
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia.';
    if (hour >= 12 && hour < 18) return 'Boa tarde.';
    return 'Boa noite.';
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={selectedShift} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Top bar greeting and header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel Operacional da RCC</span>
            </div>
            <h1 
              className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]"
              suppressHydrationWarning
            >
              {getGreeting()}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#A1A1AA]">
              <span className="flex items-center gap-1.5" suppressHydrationWarning>
                <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
                {mounted ? format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
              </span>
              <span className="text-[#3F3F46]">•</span>
              <span>
                Turno ativo: <strong className="text-white font-semibold">{selectedShift.toUpperCase()}</strong>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-[#111113] hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <Link
              href="/importar"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
            >
              <FileUp className="w-4 h-4" />
              <span>Importar Listagem</span>
            </Link>
          </div>
        </div>

        {/* Indicators Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-6">
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs font-medium mb-1">
              <span>Ativos no Turno</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-[#FAFAFA] tracking-tight">
              {loading ? '-' : activeInShift.length}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Espec. Intermediária</div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs font-medium mb-1">
              <span>Presentes Hoje</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {loading ? '-' : presentCount}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Registrados</div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs font-medium mb-1">
              <span>Ausentes</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {loading ? '-' : absentCount}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Faltas confirmadas</div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs font-medium mb-1">
              <span>Não Registrados</span>
              <HelpCircle className="w-4 h-4 text-[#71717A]" />
            </div>
            <div className="text-2xl font-bold text-[#A1A1AA] tracking-tight">
              {loading ? '-' : unrecordedCount}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Aguardando chamada</div>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs font-medium mb-1">
              <span>Indisponíveis</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {loading ? '-' : unavailableInShift.length}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Licença / Reserva</div>
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Tab Switcher: Ativos vs Indisponiveis */}
          <div className="flex bg-[#111113] p-1 rounded-lg border border-[#27272A]">
            <button
              onClick={() => setActiveTab('ativos')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                activeTab === 'ativos'
                  ? 'bg-[#1E1E22] text-[#FAFAFA] border border-[#27272A] shadow-xs'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Integrantes Ativos ({activeInShift.length})
            </button>
            <button
              onClick={() => setActiveTab('indisponiveis')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                activeTab === 'indisponiveis'
                  ? 'bg-[#1E1E22] text-[#FAFAFA] border border-[#27272A] shadow-xs'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Indisponíveis / Licença ({unavailableInShift.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nick, cargo, tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111113] border border-[#27272A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-hidden focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Member cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 bg-[#111113]/50 border border-[#27272A] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-[#3F3F46] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">
              Nenhum militar encontrado
            </h3>
            <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto mb-6">
              {searchTerm
                ? 'Nenhum militar corresponde aos termos da busca.'
                : members.length === 0
                ? 'Nenhum militar foi importado ainda. Cole a listagem diária da RCC para sincronizar o turno.'
                : `Não há militares ativos da Especialização Intermediária para o turno da ${selectedShift}.`}
            </p>
            {members.length === 0 && (
              <Link
                href="/importar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all"
              >
                <FileUp className="w-4 h-4" />
                <span>Importar Primeira Listagem</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                attendance={attendanceMap[member.id]}
                onQuickAttendance={(status) => handleQuickAttendance(member.id, status)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
