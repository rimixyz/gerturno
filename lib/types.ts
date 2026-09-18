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
    | 'manual_note'
    | 'quality_evidence'
    | 'quality_score_change';
  author?: string;
}

export type QualityCriterionStatus = 
  | 'nao_avaliado' 
  | 'positivo' 
  | 'atencao' 
  | 'negativo' 
  | 'nao_observado' 
  | 'nao_aplicavel';

export type EvidenceType = 'Positivo' | 'Neutro' | 'Negativo';

export interface QualityEvidence {
  id: string;
  criterionId: string;
  criterionName: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  type: EvidenceType;
  description: string;
  author: string;
  createdAt: string; // ISO
}

export interface ScoreChangeRecord {
  id: string;
  previousScore?: number;
  newScore: number;
  date: string; // formatted date, e.g. "19 Set 2026"
  timestamp: string; // ISO
  author: string;
  reason?: string;
}

export interface QualityPeriodFollowUp {
  id: string; // e.g. "2026-09"
  memberId: string;
  periodId: string; // e.g. "2026-09"
  periodLabel: string; // e.g. "Setembro de 2026"
  currentScore?: number; // 0.0 to 10.0
  scoreHistory: ScoreChangeRecord[];
  criteriaStatus: Record<string, QualityCriterionStatus>;
  evidences: QualityEvidence[];
  createdAt: string;
  updatedAt: string;
}

export const OBLIGATORY_CRITERIA = [
  { id: 'presenca_em_base', name: 'Presença em base', description: 'Atuação ativa e presença física em base durante os turnos.' },
  { id: 'conhecimento_documentos', name: 'Conhecimento dos documentos', description: 'Domínio dos estatutos, cartilhas, diretrizes e regras da RCC.' },
  { id: 'contato_subalternos', name: 'Contato com os subalternos', description: 'Proximidade, diálogo, acolhimento e suporte na carreira dos subalternos.' },
  { id: 'uso_especializacao', name: 'Uso da especialização', description: 'Aplicação prática e correta dos conhecimentos específicos da Especialização.' },
  { id: 'grupos_tarefas', name: 'Grupos de tarefas', description: 'Dedicação, participação ativa e cumprimento de obrigações nos grupos de tarefas.' },
  { id: 'conduta', name: 'Conduta', description: 'Postura ética, respeito hierárquico, disciplina e representação exemplar.' },
] as const;

export const COMPLEMENTARY_CRITERIA = [
  { id: 'visao_administrativa', name: 'Visão administrativa', description: 'Capacidade de planejamento, organização de fluxos e gestão de rotinas.' },
  { id: 'lideranca', name: 'Liderança', description: 'Inspiração de equipe, capacidade de comando justo e incentivo ao time.' },
  { id: 'marketing_pessoal', name: 'Marketing pessoal', description: 'Imagem profissional, comunicação polida e postura exemplar perante a comunidade.' },
  { id: 'senso_critico', name: 'Senso crítico', description: 'Capacidade de análise ponderada, resolução de conflitos e julgamento imparcial.' },
  { id: 'interpretacao_legislativa', name: 'Interpretação legislativa e jurídica', description: 'Compreensão de normas e correta interpretação jurídica de casos práticos.' },
  { id: 'movimentacao_hierarquica', name: 'Movimentação e comunicação hierárquica', description: 'Respeito aos canais hierárquicos e comunicação fluida entre patentes.' },
] as const;

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
