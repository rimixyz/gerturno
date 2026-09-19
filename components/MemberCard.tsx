'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Member, 
  AttendanceRecord, 
  AttendanceStatus 
} from '@/lib/types';
import { MofoBadge } from '@/components/MofoBadge';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  Award, 
  ChevronRight, 
  Calendar,
  Tag,
  Shield,
  Hourglass
} from 'lucide-react';

interface MemberCardProps {
  member: Member;
  attendance?: AttendanceRecord;
  onQuickAttendance?: (status: AttendanceStatus) => void;
}

export function MemberCard({ member, attendance, onQuickAttendance }: MemberCardProps) {
  const [loading, setLoading] = useState(false);

  // Status visual mapping
  const currentAttendanceStatus: AttendanceStatus = attendance?.status || 'Não registrado';

  const attendanceStyles: Record<AttendanceStatus, { label: string; badge: string; icon: React.ReactNode }> = {
    Presente: {
      label: 'Presente hoje',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    },
    Ausente: {
      label: 'Ausente',
      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    },
    Justificado: {
      label: 'Justificado',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
    },
    'Não registrado': {
      label: 'Não registrado',
      badge: 'text-[#A1A1AA] bg-[#27272A]/50 border-[#27272A]',
      icon: <HelpCircle className="w-3.5 h-3.5 text-[#71717A]" />,
    },
  };

  const currentStyle = attendanceStyles[currentAttendanceStatus];

  const handleStatusClick = async (e: React.MouseEvent, newStatus: AttendanceStatus) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onQuickAttendance || loading) return;
    setLoading(true);
    try {
      await onQuickAttendance(newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative bg-[#111113] hover:bg-[#151518] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-5 transition-all flex flex-col justify-between">
      {/* Top Header: Nick, Tag, Role */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href={`/militares/${member.id}`}
                className="font-semibold text-base text-[#FAFAFA] group-hover:text-emerald-400 transition-colors tracking-tight truncate max-w-full"
              >
                {member.nick}
              </Link>
              {member.tag && (
                <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#1E1E22] px-1.5 py-0.5 rounded border border-[#27272A]">
                  [{member.tag}]
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-[#A1A1AA] mt-0.5">
              {member.role}
            </div>
          </div>

          {/* Member Status Badge */}
          {member.isOnLeave ? (
            <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
              Licença
            </span>
          ) : member.status === 'ATIVO' ? (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
              Ativo
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#71717A] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded shrink-0">
              {member.status}
            </span>
          )}
        </div>

        {/* Promotion and Schedule Meta */}
        <div className="py-3 border-y border-[#1E1E22] my-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A1A1AA]">
            <div>
              <div className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#71717A]" />
                Última Promoção
              </div>
              <div className="font-medium text-[#E4E4E7] truncate">
                {member.lastPromotionDate || 'Não informada'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#71717A]" />
                Horário Habitual
              </div>
              <div className="font-medium text-[#E4E4E7] truncate">
                {member.customSchedule || member.shifts.join('/') || 'Padrão do turno'}
              </div>
            </div>
          </div>

          {/* Tempo de Mofo / Aptidão para Promoção */}
          <div className="pt-2 border-t border-[#18181B] flex items-center justify-between">
            <span className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-emerald-400/80" />
              Tempo no Cargo
            </span>
            <MofoBadge role={member.role} lastPromotionDate={member.lastPromotionDate} compact={true} />
          </div>
        </div>

        {/* Tasks / Tags */}
        <div className="mb-4">
          <div className="text-[10px] uppercase font-medium text-[#71717A] tracking-wider mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#71717A]" />
            Tarefas & Especializações
          </div>
          {member.tasks && member.tasks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {member.tasks.map((task, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono text-[#D4D4D8] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded"
                >
                  {task}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-[#71717A] italic">Nenhuma tarefa atribuída</span>
          )}
        </div>

        {/* Extra alerts: ADV or Leave Period */}
        {(member.adv || member.leaveEndDate || member.allowedPromotionDate) && (
          <div className="mb-3 space-y-1">
            {member.adv !== undefined && member.adv > 0 && (
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded flex items-center justify-between">
                <span>Advertência ativa:</span>
                <span className="font-bold">ADV {member.adv}</span>
              </div>
            )}
            {member.isOnLeave && member.leaveStartDate && member.leaveEndDate && (
              <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                Período: {member.leaveStartDate} a {member.leaveEndDate}
              </div>
            )}
            {member.allowedPromotionDate && (
              <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                Promoção permitida: {member.allowedPromotionDate}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Quick Attendance & Profile Link */}
      <div className="pt-3 border-t border-[#1E1E22] flex items-center justify-between gap-2">
        {/* Current attendance indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border ${currentStyle.badge}`}>
            {currentStyle.icon}
            <span>{currentStyle.label}</span>
          </span>
        </div>

        {/* Quick actions toggle */}
        <div className="flex items-center gap-1">
          {onQuickAttendance && (
            <div className="flex items-center bg-[#09090B] border border-[#27272A] rounded p-0.5">
              <button
                type="button"
                title="Marcar Presente"
                onClick={(e) => handleStatusClick(e, 'Presente')}
                className={`px-1.5 py-1 text-[11px] font-medium rounded transition-colors ${
                  currentAttendanceStatus === 'Presente'
                    ? 'bg-emerald-500 text-white'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                P
              </button>
              <button
                type="button"
                title="Marcar Ausente"
                onClick={(e) => handleStatusClick(e, 'Ausente')}
                className={`px-1.5 py-1 text-[11px] font-medium rounded transition-colors ${
                  currentAttendanceStatus === 'Ausente'
                    ? 'bg-rose-500 text-white'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                A
              </button>
              <button
                type="button"
                title="Marcar Justificado"
                onClick={(e) => handleStatusClick(e, 'Justificado')}
                className={`px-1.5 py-1 text-[11px] font-medium rounded transition-colors ${
                  currentAttendanceStatus === 'Justificado'
                    ? 'bg-amber-500 text-white'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                J
              </button>
            </div>
          )}

          <Link
            href={`/militares/${member.id}`}
            className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] rounded transition-colors"
            title="Ver Perfil Completo"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
