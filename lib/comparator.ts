import { Member, ParsedMember, DetectedChange, ShiftType, MemberStatus } from './types';
import { normalizeNick, generateMemberId, getAlphanumericKey } from './parser';

/**
 * Calculates a member's qualification status based on the selected shift.
 * - ATIVO: Especialização Intermediária, has selected shift, not on leave
 * - INDISPONIVEL: Especialização Intermediária, has selected shift, but on leave/reserva
 * - NAO_QUALIFICADO: Not Intermediária OR does not match selected shift
 * - DESLIGADO: Disappeared from import completely
 */
export function calculateMemberStatus(
  member: {
    specialization: string;
    shifts: ShiftType[];
    isOnLeave: boolean;
    isDismissed?: boolean;
  },
  selectedShift: ShiftType
): MemberStatus {
  if (member.isDismissed) {
    return 'DESLIGADO';
  }

  const matchesShift = member.shifts.includes(selectedShift);
  const isIntermediaria = member.specialization === 'Especialização Intermediária';

  if (!isIntermediaria || !matchesShift) {
    return 'NAO_QUALIFICADO';
  }

  if (member.isOnLeave) {
    return 'INDISPONIVEL';
  }

  return 'ATIVO';
}

/**
 * Compares incoming parsed members against existing saved members in Firestore.
 * Detects:
 * - New members
 * - Possible dismissals (members previously in database not found anywhere in the new import)
 * - Promotions / Role changes
 * - Shift changes
 * - Added / Removed tasks
 * - Leave start / Leave end
 * - Specialization changes
 * - ADV changes
 * - Allowed promotion date changes
 */
export function compareImportWithExisting(
  parsedList: ParsedMember[],
  existingMembers: Member[]
): DetectedChange[] {
  const changes: DetectedChange[] = [];

  // Map existing members by normalized nick and by alphanumeric key
  const existingMap = new Map<string, Member>();
  const existingAlphaMap = new Map<string, Member>();
  for (const m of existingMembers) {
    existingMap.set(m.normalizedNick, m);
    const alpha = getAlphanumericKey(m.nick);
    if (alpha) {
      existingAlphaMap.set(alpha, m);
    }
  }

  // Map parsed members by normalized nick and by alphanumeric key
  const parsedMap = new Map<string, ParsedMember>();
  const parsedAlphaMap = new Map<string, ParsedMember>();
  for (const p of parsedList) {
    parsedMap.set(normalizeNick(p.nick), p);
    const alpha = getAlphanumericKey(p.nick);
    if (alpha) {
      parsedAlphaMap.set(alpha, p);
    }
  }

  // 1. Check each incoming parsed member
  for (const parsed of parsedList) {
    const norm = normalizeNick(parsed.nick);
    const alpha = getAlphanumericKey(parsed.nick);
    const existing = existingMap.get(norm) || (alpha ? existingAlphaMap.get(alpha) : undefined);

    if (!existing) {
      // New member entering the system
      changes.push({
        memberNick: parsed.nick,
        type: 'new_member',
        title: 'Novo militar detectado',
        description: `Ingresso de ${parsed.role} ${parsed.nick} no sistema (${parsed.specialization}, Turnos: [${parsed.shifts.join('/')}])`,
        after: parsed,
      });
      continue;
    }

    // If was dismissed previously and now reappeared
    if (existing.isDismissed) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'reactivated',
        title: 'Retorno após desligamento',
        description: `${parsed.nick} reapareceu na listagem oficial como ${parsed.role}.`,
        before: existing,
        after: parsed,
      });
    }

    // Role change / Promotion
    if (existing.role.trim().toLowerCase() !== parsed.role.trim().toLowerCase()) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'role_change',
        title: 'Mudança de Cargo / Promoção',
        description: `${existing.role} → ${parsed.role}`,
        before: existing.role,
        after: parsed.role,
      });
    }

    // Shifts change
    const oldShifts = [...(existing.shifts || [])].sort().join(', ');
    const newShifts = [...(parsed.shifts || [])].sort().join(', ');
    if (oldShifts !== newShifts) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'shift_change',
        title: 'Mudança de Turno',
        description: `Turno alterado de [${oldShifts || 'Nenhum'}] para [${newShifts || 'Nenhum'}]`,
        before: existing.shifts,
        after: parsed.shifts,
      });
    }

    // Tasks added / removed
    const oldTasks = new Set((existing.tasks || []).map(t => t.trim()));
    const newTasks = new Set((parsed.tasks || []).map(t => t.trim()));

    const addedTasks = (parsed.tasks || []).filter(t => !oldTasks.has(t.trim()));
    const removedTasks = (existing.tasks || []).filter(t => !newTasks.has(t.trim()));

    if (addedTasks.length > 0) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'task_added',
        title: 'Nova(s) Tarefa(s) adicionada(s)',
        description: `Adicionado: ${addedTasks.join(', ')}`,
        after: addedTasks,
      });
    }

    if (removedTasks.length > 0) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'task_removed',
        title: 'Tarefa(s) removida(s)',
        description: `Removido: ${removedTasks.join(', ')}`,
        before: removedTasks,
      });
    }

    // Leave status
    if (!existing.isOnLeave && parsed.isOnLeave) {
      const period = parsed.leaveStartDate && parsed.leaveEndDate 
        ? ` (${parsed.leaveStartDate} a ${parsed.leaveEndDate})` 
        : '';
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'leave_started',
        title: 'Início de Licença / Reserva',
        description: `${parsed.nick} entrou em licença/reserva${period}.`,
        after: { start: parsed.leaveStartDate, end: parsed.leaveEndDate },
      });
    } else if (existing.isOnLeave && !parsed.isOnLeave) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'leave_ended',
        title: 'Retorno de Licença / Reserva',
        description: `${parsed.nick} retornou ao serviço ativo no turno.`,
      });
    }

    // Specialization change
    if (existing.specialization !== parsed.specialization) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'specialization_change',
        title: 'Mudança de Especialização',
        description: `${existing.specialization} → ${parsed.specialization}`,
        before: existing.specialization,
        after: parsed.specialization,
      });
    }

    // ADV change
    if ((existing.adv || 0) !== (parsed.adv || 0)) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'adv_change',
        title: 'Alteração de Advertência (ADV)',
        description: `ADV: ${existing.adv ?? 0} → ${parsed.adv ?? 0}`,
        before: existing.adv,
        after: parsed.adv,
      });
    }

    // Allowed promotion date change
    if ((existing.allowedPromotionDate || '') !== (parsed.allowedPromotionDate || '')) {
      changes.push({
        memberNick: parsed.nick,
        memberId: existing.id,
        type: 'allowed_promotion_change',
        title: 'Data de Promoção Permitida alterada',
        description: `Promoção permitida: ${existing.allowedPromotionDate || 'Sem restrição'} → ${parsed.allowedPromotionDate || 'Sem restrição'}`,
        before: existing.allowedPromotionDate,
        after: parsed.allowedPromotionDate,
      });
    }
  }

  // 2. Check for missing members (Possible dismissal)
  // ONLY if they were active/previously known and do NOT appear ANYWHERE in the new parsed import
  for (const existing of existingMembers) {
    if (existing.isDismissed) continue; // already marked dismissed

    const norm = existing.normalizedNick;
    const alpha = getAlphanumericKey(existing.nick);
    const inParsed = parsedMap.has(norm) || (alpha ? parsedAlphaMap.has(alpha) : false);

    if (!inParsed) {
      changes.push({
        memberNick: existing.nick,
        memberId: existing.id,
        type: 'possible_dismissal',
        title: 'Possível Desligamento detectado',
        description: `${existing.role} ${existing.nick} não consta em nenhuma seção da listagem importada.`,
        before: existing,
      });
    }
  }

  return changes;
}
