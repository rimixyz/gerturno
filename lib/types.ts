export type ShiftType = 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

export type SpecializationType = 'Especialização Avançada' | 'Especialização Intermediária' | 'Outra';

export type MemberStatus = 'ATIVO' | 'INDISPONIVEL' | 'NAO_QUALIFICADO' | 'DESLIGADO';

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado' | 'Não registrado';

export interface Member {
  id: string; // internal stable id (e.g., m_xxxx or normalized)
  nick: string;
  normalizedNick: string;
  role: string; // cargo
  tag?: string; // identificação entre colchetes, e.g. D71, DIR, Bif
  lastPromotionDate?: string; // e.g. "29 Ago 2026"
  tasks: string[]; // tarefas / especializações, e.g. ["TRE.2", "Ins.ECE"]
  shifts: ShiftType[]; // e.g. ["Manhã", "Noite"]
  adv?: number; // ADV number, e.g. 1
  allowedPromotionDate?: string; // Promoção permitida: "30 Set 2026"
  specialization: SpecializationType;
  
  // Licença / Reserva
  isOnLeave: boolean;
  leaveReason?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;

  // Status calculado para o turno ativo ou histórico
  status: MemberStatus;

  // Horário habitual registrado manualmente (e.g. "10:00 — 12:00")
  customSchedule?: string;

  // Metadados de desligamento
  isDismissed?: boolean;
  dismissedAt?: string;
  dismissalDetails?: {
    lastRole?: string;
    lastShifts?: ShiftType[];
    lastTasks?: string[];
    lastPromotionDate?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD or formatted date
  timestamp: string; // ISO
  title: string;
  description: string;
  type: 
    | 'system_entry'
    | 'promotion'
    | 'role_change'
    | 'shift_change'
    | 'task_added'
    | 'task_removed'
    | 'leave_started'
    | 'leave_ended'
    | 'specialization_change'
    | 'adv_change'
    | 'allowed_promotion_change'
    | 'dismissal'
    | 'return_from_dismissal'
    | 'manual_note';
  author?: string;
}

export interface AttendanceRecord {
  id: string; // usually date string YYYY-MM-DD
  memberId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  observation?: string;
  author?: string;
  updatedAt: string;
}

export interface NoteRecord {
  id: string;
  memberId: string;
  type: 'DIARIA' | 'GERAL';
  date?: string; // YYYY-MM-DD for DIARIA
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  criteria: Record<string, number | string | boolean>;
  observation?: string;
  author: string;
  createdAt: string;
}

export interface AppSettings {
  selectedShift: ShiftType;
  adminDisplayName: string;
  defaultSchedule?: string;
  evaluationCriteria?: Array<{
    id: string;
    name: string;
    category: string;
    maxScore?: number;
  }>;
}

export interface ParsedMember {
  rawLine: string;
  itemNumber?: number;
  role: string;
  nick: string;
  tag?: string;
  lastPromotionDate?: string;
  tasks: string[];
  shifts: ShiftType[];
  adv?: number;
  allowedPromotionDate?: string;
  specialization: SpecializationType;
  isOnLeave: boolean;
  leaveReason?: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
}

export interface DetectedChange {
  memberNick: string;
  memberId?: string;
  type: 
    | 'new_member'
    | 'possible_dismissal'
    | 'promotion'
    | 'role_change'
    | 'shift_change'
    | 'task_added'
    | 'task_removed'
    | 'leave_started'
    | 'leave_ended'
    | 'specialization_change'
    | 'adv_change'
    | 'allowed_promotion_change'
    | 'reactivated';
  title: string;
  description: string;
  before?: any;
  after?: any;
}

export interface ImportSnapshot {
  id: string;
  rawText: string;
  importedAt: string;
  importedBy: string;
  parsedCount: number;
  detectedChanges: DetectedChange[];
  confirmedChangesCount: number;
}
