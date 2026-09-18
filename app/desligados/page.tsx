'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { getAllMembers, getAppSettings } from '@/lib/firestoreService';
import { Member, AppSettings } from '@/lib/types';
import { 
  UserX, 
  Search, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Tag, 
  AlertTriangle,
  History
} from 'lucide-react';

export default function DesligadosPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

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
        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1">
            <UserX className="w-3.5 h-3.5" />
            <span>Arquivo de Desligados</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Militares Desligados
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Registro de membros que anteriormente pertenciam à RCC mas desapareceram completamente das listagens oficiais subsequentes. O histórico individual permanece preservado.
          </p>
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
              <p className="text-[#71717A]">Quando um membro sumir completamente de uma listagem confirmada, ele será preservado aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1E1E22]">
              {filteredDismissed.map((member) => {
                const details = member.dismissalDetails || {};
                const lastRole = details.lastRole || member.role;
                const lastShifts = details.lastShifts || member.shifts;
                const lastTasks = details.lastTasks || member.tasks;

                return (
                  <Link
                    key={member.id}
                    href={`/militares/${member.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-[#151518] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">
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
                    </div>

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

                    <div className="flex items-center gap-2 text-xs text-[#71717A] group-hover:text-white">
                      <span>Ver dossiê</span>
                      <ChevronRight className="w-4 h-4" />
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
