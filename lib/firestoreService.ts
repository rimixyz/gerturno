import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Member, 
  TimelineEvent, 
  AttendanceRecord, 
  NoteRecord, 
  EvaluationRecord, 
  AppSettings, 
  ImportSnapshot, 
  DetectedChange,
  ParsedMember,
  ShiftType,
  QualityPeriodFollowUp,
  QualityCriterionStatus,
  EvidenceType,
  QualityEvidence,
  ScoreChangeRecord,
  OBLIGATORY_CRITERIA,
  COMPLEMENTARY_CRITERIA
} from './types';
import { normalizeNick, generateMemberId, getAlphanumericKey } from './parser';
import { calculateMemberStatus } from './comparator';
import { sanitizeForFirestore } from './sanitize';

const SETTINGS_DOC_ID = 'app_settings';

// Default App Settings
export const DEFAULT_SETTINGS: AppSettings = {
  selectedShift: 'Manhã',
  adminDisplayName: 'Oficial de Turno',
  defaultSchedule: '08:00 — 12:00',
  evaluationCriteria: [
    { id: 'desempenho', name: 'Desempenho Geral', category: 'desempenho', maxScore: 5 },
    { id: 'lideranca', name: 'Liderança', category: 'lideranca', maxScore: 5 },
    { id: 'comunicacao', name: 'Comunicação', category: 'comunicacao', maxScore: 5 },
    { id: 'iniciativa', name: 'Iniciativa', category: 'iniciativa', maxScore: 5 },
    { id: 'presenca', name: 'Pontualidade e Presença', category: 'presenca', maxScore: 5 },
    { id: 'desenvolvimento', name: 'Desenvolvimento de Subalternos', category: 'desenvolvimento', maxScore: 5 },
  ],
};

/**
 * Fetch application settings from Firestore
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as AppSettings) };
    }
  } catch (err) {
    console.warn('Could not load settings from Firestore, falling back to defaults:', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save application settings to Firestore
 */
export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await setDoc(docRef, sanitizeForFirestore(settings), { merge: true });
}

/**
 * Fetch all members
 */
export async function getAllMembers(): Promise<Member[]> {
  try {
    const col = collection(db, 'members');
    const snapshot = await getDocs(col);
    const members: Member[] = [];
    snapshot.forEach(d => {
      members.push({ id: d.id, ...(d.data() as Omit<Member, 'id'>) });
    });
    return members;
  } catch (err) {
    console.error('Error fetching members:', err);
    return [];
  }
}

/**
 * Fetch single member by ID
 */
export async function getMemberById(memberId: string): Promise<Member | null> {
  try {
    const docRef = doc(db, 'members', memberId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Member, 'id'>) };
    }
  } catch (err) {
    console.error('Error fetching member:', err);
  }
  return null;
}

/**
 * Update member fields (e.g. customSchedule)
 */
export async function updateMember(memberId: string, data: Partial<Member>): Promise<void> {
  const docRef = doc(db, 'members', memberId);
  await updateDoc(docRef, sanitizeForFirestore({
    ...data,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Permanently delete a member from Firestore
 */
export async function deleteMember(memberId: string): Promise<void> {
  const docRef = doc(db, 'members', memberId);
  await deleteDoc(docRef);
}

/**
 * Fetch member timeline events (ordered descending)
 */
export async function getMemberTimeline(memberId: string): Promise<TimelineEvent[]> {
  try {
    const col = collection(db, 'members', memberId, 'timeline');
    const q = query(col, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    const list: TimelineEvent[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<TimelineEvent, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching timeline:', err);
    return [];
  }
}

/**
 * Add an event to a member's timeline
 */
export async function addTimelineEvent(memberId: string, event: Omit<TimelineEvent, 'id'>): Promise<string> {
  const col = collection(db, 'members', memberId, 'timeline');
  const res = await addDoc(col, sanitizeForFirestore(event));
  return res.id;
}

/**
 * Fetch today's or date-specific attendance for all members
 */
export async function getAttendanceByDate(dateStr: string): Promise<Record<string, AttendanceRecord>> {
  // We can query each member's attendance subcollection document with ID = dateStr
  const members = await getAllMembers();
  const map: Record<string, AttendanceRecord> = {};

  await Promise.all(
    members.map(async (m) => {
      try {
        const attRef = doc(db, 'members', m.id, 'attendance', dateStr);
        const snap = await getDoc(attRef);
        if (snap.exists()) {
          map[m.id] = { id: snap.id, ...(snap.data() as Omit<AttendanceRecord, 'id'>) };
        }
      } catch (e) {
        // ignore individual missing doc
      }
    })
  );

  return map;
}

/**
 * Fetch member attendance history
 */
export async function getMemberAttendanceHistory(memberId: string): Promise<AttendanceRecord[]> {
  try {
    const col = collection(db, 'members', memberId, 'attendance');
    const q = query(col, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const list: AttendanceRecord[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching member attendance:', err);
    return [];
  }
}

/**
 * Save or update member attendance for a date
 */
export async function saveAttendance(
  memberId: string, 
  dateStr: string, 
  data: Partial<AttendanceRecord>
): Promise<void> {
  const docRef = doc(db, 'members', memberId, 'attendance', dateStr);
  const now = new Date().toISOString();
  await setDoc(docRef, sanitizeForFirestore({
    memberId,
    date: dateStr,
    status: data.status || 'Não registrado',
    checkIn: data.checkIn || '',
    checkOut: data.checkOut || '',
    observation: data.observation || '',
    author: data.author || 'Oficial',
    updatedAt: now,
  }), { merge: true });
}

/**
 * Notes CRUD
 */
export async function getMemberNotes(memberId: string): Promise<NoteRecord[]> {
  try {
    const col = collection(db, 'members', memberId, 'notes');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: NoteRecord[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<NoteRecord, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching notes:', err);
    return [];
  }
}

export async function addMemberNote(
  memberId: string, 
  note: Omit<NoteRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const col = collection(db, 'members', memberId, 'notes');
  const now = new Date().toISOString();
  const res = await addDoc(col, sanitizeForFirestore({
    ...note,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

/**
 * Evaluations CRUD
 */
export async function getMemberEvaluations(memberId: string): Promise<EvaluationRecord[]> {
  try {
    const col = collection(db, 'members', memberId, 'evaluations');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: EvaluationRecord[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<EvaluationRecord, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching evaluations:', err);
    return [];
  }
}

export async function addMemberEvaluation(
  memberId: string,
  evalData: Omit<EvaluationRecord, 'id' | 'createdAt'>
): Promise<string> {
  const col = collection(db, 'members', memberId, 'evaluations');
  const now = new Date().toISOString();
  const res = await addDoc(col, sanitizeForFirestore({
    ...evalData,
    createdAt: now,
  }));
  return res.id;
}

/**
 * Helper to compute default period identifier and label (e.g. "2026-09", "Setembro de 2026")
 */
export function getDefaultPeriod(date = new Date()): { periodId: string; periodLabel: string } {
  const year = date.getFullYear();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const periodId = `${year}-${month}`;
  const periodLabel = `${monthNames[date.getMonth()]} de ${year}`;
  return { periodId, periodLabel };
}

/**
 * Fetch Quality Follow-up for a member in a specific period
 */
export async function getMemberQualityFollowUp(
  memberId: string, 
  periodId?: string
): Promise<QualityPeriodFollowUp | null> {
  try {
    const current = getDefaultPeriod();
    const targetPeriodId = periodId || current.periodId;
    const docRef = doc(db, 'members', memberId, 'quality', targetPeriodId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...(snap.data() as Omit<QualityPeriodFollowUp, 'id'>) };
  } catch (err) {
    console.error('Error fetching quality follow-up:', err);
    return null;
  }
}

/**
 * Fetch or Initialize Quality Follow-up for a member in a period
 */
export async function getOrInitMemberQualityFollowUp(
  memberId: string,
  periodId?: string,
  periodLabel?: string
): Promise<QualityPeriodFollowUp> {
  const current = getDefaultPeriod();
  const targetPeriodId = periodId || current.periodId;
  const targetPeriodLabel = periodLabel || current.periodLabel;

  const existing = await getMemberQualityFollowUp(memberId, targetPeriodId);
  if (existing) {
    return existing;
  }

  // Initialize with defaults
  const initialCriteriaStatus: Record<string, QualityCriterionStatus> = {};
  OBLIGATORY_CRITERIA.forEach(c => {
    initialCriteriaStatus[c.id] = 'nao_avaliado';
  });
  COMPLEMENTARY_CRITERIA.forEach(c => {
    initialCriteriaStatus[c.id] = 'nao_observado';
  });

  const nowIso = new Date().toISOString();
  const newFollowUp: QualityPeriodFollowUp = {
    id: targetPeriodId,
    memberId,
    periodId: targetPeriodId,
    periodLabel: targetPeriodLabel,
    scoreHistory: [],
    criteriaStatus: initialCriteriaStatus,
    evidences: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docRef = doc(db, 'members', memberId, 'quality', targetPeriodId);
  await setDoc(docRef, sanitizeForFirestore(newFollowUp));
  return newFollowUp;
}

/**
 * Get all available quality periods for a member
 */
export async function getAllQualityPeriodsForMember(memberId: string): Promise<QualityPeriodFollowUp[]> {
  try {
    const col = collection(db, 'members', memberId, 'quality');
    const snap = await getDocs(col);
    const list: QualityPeriodFollowUp[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<QualityPeriodFollowUp, 'id'>) });
    });
    list.sort((a, b) => b.periodId.localeCompare(a.periodId));
    return list;
  } catch (err) {
    console.error('Error fetching quality periods:', err);
    return [];
  }
}

/**
 * Update single criterion status
 */
export async function updateCriterionStatus(
  memberId: string,
  periodId: string,
  criterionId: string,
  status: QualityCriterionStatus
): Promise<void> {
  const docRef = doc(db, 'members', memberId, 'quality', periodId);
  const nowIso = new Date().toISOString();
  await updateDoc(docRef, sanitizeForFirestore({
    [`criteriaStatus.${criterionId}`]: status,
    updatedAt: nowIso,
  }));
}

/**
 * Add an evidence for a criterion in this period.
 * ALSO adds a corresponding timeline event to the member!
 */
export async function addQualityEvidence(
  memberId: string,
  periodId: string,
  evidence: {
    criterionId: string;
    criterionName: string;
    date: string;
    type: EvidenceType;
    description: string;
    author: string;
  }
): Promise<QualityEvidence> {
  const followUp = await getOrInitMemberQualityFollowUp(memberId, periodId);
  const nowIso = new Date().toISOString();
  const newEvidence: QualityEvidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    criterionId: evidence.criterionId,
    criterionName: evidence.criterionName,
    date: evidence.date,
    type: evidence.type,
    description: evidence.description,
    author: evidence.author,
    createdAt: nowIso,
  };

  const updatedEvidences = [newEvidence, ...(followUp.evidences || [])];
  const docRef = doc(db, 'members', memberId, 'quality', periodId);
  await updateDoc(docRef, sanitizeForFirestore({
    evidences: updatedEvidences,
    updatedAt: nowIso,
  }));

  // Also add to member timeline
  await addTimelineEvent(memberId, {
    memberId,
    date: evidence.date,
    timestamp: nowIso,
    title: `Evidência de Qualidade (${evidence.type}): ${evidence.criterionName}`,
    description: `"${evidence.description}"`,
    type: 'quality_evidence',
    author: evidence.author,
  });

  return newEvidence;
}

/**
 * Update Provisional Score for the member in this period.
 * Maintains history and logs score change into member timeline.
 */
export async function updateProvisionalScore(
  memberId: string,
  periodId: string,
  newScore: number,
  author: string,
  reason?: string
): Promise<ScoreChangeRecord> {
  const followUp = await getOrInitMemberQualityFollowUp(memberId, periodId);
  const now = new Date();
  const nowIso = now.toISOString();
  const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][now.getMonth()];
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')} ${monthShort} ${now.getFullYear()}`;
  const prevScore = followUp.currentScore;

  const record: ScoreChangeRecord = {
    id: `score_${Date.now()}`,
    previousScore: prevScore,
    newScore,
    date: dateFormatted,
    timestamp: nowIso,
    author,
    reason: reason || undefined,
  };

  const updatedHistory = [...(followUp.scoreHistory || []), record];
  const docRef = doc(db, 'members', memberId, 'quality', periodId);
  await updateDoc(docRef, sanitizeForFirestore({
    currentScore: newScore,
    scoreHistory: updatedHistory,
    updatedAt: nowIso,
  }));

  // Add to timeline
  await addTimelineEvent(memberId, {
    memberId,
    date: dateFormatted,
    timestamp: nowIso,
    title: `Nota Provisória Alterada: ${prevScore !== undefined ? prevScore.toFixed(1) : '—'} → ${newScore.toFixed(1)}`,
    description: reason ? `Motivo: ${reason}` : 'Ajuste de nota provisória no acompanhamento de qualidade.',
    type: 'quality_score_change',
    author,
  });

  return record;
}


/**
 * Commit Confirmed Import
 * Applies detected changes, updates existing members, creates new members,
 * marks dismissals, adds timeline records, and saves the snapshot.
 */
export async function commitImportSnapshot(params: {
  rawText: string;
  parsedList: ParsedMember[];
  detectedChanges: DetectedChange[];
  confirmedChanges: DetectedChange[];
  author: string;
  selectedShift: ShiftType;
  replaceToday?: boolean;
}): Promise<string> {
  const { rawText, parsedList, detectedChanges, confirmedChanges, author, selectedShift, replaceToday } = params;
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];

  // If replacing today's synchronization, remove previous snapshots of today and clean malformed members
  if (replaceToday) {
    try {
      const snapCol = collection(db, 'imports');
      const q = query(snapCol, orderBy('importedAt', 'desc'));
      const snaps = await getDocs(q);
      for (const d of snaps.docs) {
        const data = d.data();
        if (data.importedAt && typeof data.importedAt === 'string' && data.importedAt.startsWith(todayStr)) {
          await deleteDoc(d.ref);
        }
      }
      // Also clean up any lingering members that have malformed "Geral " nick prefix
      await cleanupMalformedGeralMembers();
    } catch (cleanErr) {
      console.warn('Warning during replaceToday cleanup:', cleanErr);
    }
  }

  // 1. Fetch current members
  const existingMembers = await getAllMembers();
  const existingMap = new Map<string, Member>();
  const existingAlphaMap = new Map<string, Member>();
  for (const m of existingMembers) {
    existingMap.set(m.normalizedNick, m);
    const alpha = getAlphanumericKey(m.nick);
    if (alpha) {
      const prev = existingAlphaMap.get(alpha);
      // Prefer active profile if duplicates exist
      if (!prev || (prev.isDismissed && !m.isDismissed)) {
        existingAlphaMap.set(alpha, m);
      }
    }
  }

  const parsedMap = new Map<string, ParsedMember>();
  const parsedAlphaMap = new Map<string, ParsedMember>();
  for (const p of parsedList) {
    parsedMap.set(normalizeNick(p.nick), p);
    const alpha = getAlphanumericKey(p.nick);
    if (alpha) {
      parsedAlphaMap.set(alpha, p);
    }
  }

  // 2. Process all parsed members
  for (const parsed of parsedList) {
    const norm = normalizeNick(parsed.nick);
    const alpha = getAlphanumericKey(parsed.nick);
    const existing = existingMap.get(norm) || (alpha ? existingAlphaMap.get(alpha) : undefined);
    const memberId = existing ? existing.id : generateMemberId(parsed.nick);

    const calculatedStatus = calculateMemberStatus(
      {
        specialization: parsed.specialization,
        shifts: parsed.shifts,
        isOnLeave: parsed.isOnLeave,
        isDismissed: false,
      },
      selectedShift
    );

    const memberDocRef = doc(db, 'members', memberId);

    const rawMemberData = {
      id: memberId,
      nick: parsed.nick,
      normalizedNick: norm,
      role: parsed.role,
      tag: parsed.tag || existing?.tag || null,
      lastPromotionDate: parsed.lastPromotionDate || existing?.lastPromotionDate || null,
      tasks: parsed.tasks || [],
      shifts: parsed.shifts || [],
      adv: parsed.adv !== undefined ? parsed.adv : (existing?.adv !== undefined ? existing.adv : null),
      allowedPromotionDate: parsed.allowedPromotionDate || existing?.allowedPromotionDate || null,
      specialization: parsed.specialization,
      isOnLeave: parsed.isOnLeave,
      leaveReason: parsed.leaveReason || (parsed.isOnLeave ? 'Licença/Reserva' : null),
      leaveStartDate: parsed.leaveStartDate || null,
      leaveEndDate: parsed.leaveEndDate || null,
      status: calculatedStatus,
      customSchedule: existing?.customSchedule || null,
      isDismissed: false,
      dismissedAt: null,
      dismissalDetails: null,
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
    };

    await setDoc(memberDocRef, sanitizeForFirestore(rawMemberData), { merge: true });

    // If new member, create initial timeline entry
    if (!existing) {
      await addTimelineEvent(memberId, {
        memberId,
        date: todayStr,
        timestamp: nowIso,
        title: 'Ingresso no Sistema',
        description: `Militar ${parsed.role} ${parsed.nick} adicionado na sincronização diária.`,
        type: 'system_entry',
        author,
      });
    }
  }

  // 3. Process confirmed changes for existing members to write timeline entries
  for (const change of confirmedChanges) {
    const norm = normalizeNick(change.memberNick);
    const alpha = getAlphanumericKey(change.memberNick);
    const existing = existingMap.get(norm) || (alpha ? existingAlphaMap.get(alpha) : undefined);
    const memberId = change.memberId || existing?.id || generateMemberId(change.memberNick);

    if (!memberId) continue;

    if (change.type === 'possible_dismissal') {
      // Double check: if the member actually is in the incoming list (exact or fuzzy), DO NOT dismiss!
      if (parsedMap.has(norm) || (alpha && parsedAlphaMap.has(alpha))) {
        continue;
      }

      // Confirmed dismissal
      if (existing) {
        const memberDocRef = doc(db, 'members', existing.id);
        await updateDoc(memberDocRef, sanitizeForFirestore({
          status: 'DESLIGADO',
          isDismissed: true,
          dismissedAt: nowIso,
          dismissalDetails: {
            lastRole: existing.role || null,
            lastShifts: existing.shifts || [],
            lastTasks: existing.tasks || [],
            lastPromotionDate: existing.lastPromotionDate || null,
          },
          updatedAt: nowIso,
        }));

        await addTimelineEvent(existing.id, {
          memberId: existing.id,
          date: todayStr,
          timestamp: nowIso,
          title: 'Desligamento Detectado',
          description: `${existing.role} ${existing.nick} não consta na listagem oficial e foi marcado como desligado.`,
          type: 'dismissal',
          author,
        });
      }
      continue;
    }

    if (change.type === 'new_member') {
      // already handled above
      continue;
    }

    // Map other change types to timeline events
    let timelineType: TimelineEvent['type'] = 'manual_note';
    if (change.type === 'role_change') timelineType = 'promotion';
    else if (change.type === 'shift_change') timelineType = 'shift_change';
    else if (change.type === 'task_added') timelineType = 'task_added';
    else if (change.type === 'task_removed') timelineType = 'task_removed';
    else if (change.type === 'leave_started') timelineType = 'leave_started';
    else if (change.type === 'leave_ended') timelineType = 'leave_ended';
    else if (change.type === 'specialization_change') timelineType = 'specialization_change';
    else if (change.type === 'adv_change') timelineType = 'adv_change';
    else if (change.type === 'allowed_promotion_change') timelineType = 'allowed_promotion_change';
    else if (change.type === 'reactivated') timelineType = 'return_from_dismissal';

    await addTimelineEvent(memberId, {
      memberId,
      date: todayStr,
      timestamp: nowIso,
      title: change.title,
      description: change.description,
      type: timelineType,
      author,
    });
  }

  // 4. Clean up any ghost duplicates created by previous imports
  try {
    await cleanupDuplicateMembers();
  } catch (cleanErr) {
    console.warn('Warning during cleanupDuplicateMembers in commitImportSnapshot:', cleanErr);
  }

  // 5. Create Snapshot record
  const snapshotCol = collection(db, 'imports');
  const snapshotDoc = await addDoc(snapshotCol, sanitizeForFirestore({
    rawText,
    importedAt: nowIso,
    importedBy: author,
    parsedCount: parsedList.length,
    detectedChanges,
    confirmedChangesCount: confirmedChanges.length,
  }));

  return snapshotDoc.id;
}

/**
 * Fetch past import snapshots
 */
export async function getImportSnapshots(): Promise<ImportSnapshot[]> {
  try {
    const col = collection(db, 'imports');
    const q = query(col, orderBy('importedAt', 'desc'));
    const snap = await getDocs(q);
    const list: ImportSnapshot[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as Omit<ImportSnapshot, 'id'>) });
    });
    return list;
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return [];
  }
}

/**
 * Get the latest import snapshot from today (if any)
 */
export async function getTodayImportSnapshot(): Promise<ImportSnapshot | null> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const snapshots = await getImportSnapshots();
    return snapshots.find(s => s.importedAt && s.importedAt.startsWith(todayStr)) || null;
  } catch (err) {
    console.error('Error getting today snapshot:', err);
    return null;
  }
}

/**
 * Permanently delete an import snapshot, optionally removing members created on that date
 */
export async function deleteImportSnapshot(
  snapshotId: string, 
  deleteAssociatedMembers: boolean = false
): Promise<{ deletedMembersCount: number }> {
  let deletedMembersCount = 0;
  try {
    // 1. Fetch snapshot details
    const snapDocRef = doc(db, 'imports', snapshotId);
    const snapDoc = await getDoc(snapDocRef);
    const snapData = snapDoc.data();

    // 2. Delete the snapshot document
    await deleteDoc(snapDocRef);

    // 3. If requested, delete members created around that snapshot date or created with malformed nicks
    if (deleteAssociatedMembers && snapData?.importedAt) {
      const snapDate = (snapData.importedAt as string).split('T')[0];
      const members = await getAllMembers();
      for (const m of members) {
        const isCreatedOnDate = m.createdAt && m.createdAt.startsWith(snapDate);
        const isMalformed = m.nick.toLowerCase().startsWith('geral ') || m.role === 'Geral';
        if (isCreatedOnDate || isMalformed) {
          await deleteDoc(doc(db, 'members', m.id));
          deletedMembersCount++;
        }
      }
    }
  } catch (err) {
    console.error('Error deleting import snapshot:', err);
    throw err;
  }
  return { deletedMembersCount };
}

/**
 * Delete today's synchronization and wipe any members created or corrupted today
 */
export async function deleteTodayImport(): Promise<{ deletedMembersCount: number }> {
  const todaySnap = await getTodayImportSnapshot();
  if (todaySnap) {
    return await deleteImportSnapshot(todaySnap.id, true);
  } else {
    // Even if no snapshot doc was found, clean up any malformed Geral members or members created today
    const deletedMembersCount = await cleanupMalformedGeralMembers();
    return { deletedMembersCount };
  }
}

/**
 * Specifically cleans up members whose nickname has the 'Geral ' prefix due to previous role parser ambiguity
 */
export async function cleanupMalformedGeralMembers(): Promise<number> {
  let count = 0;
  try {
    const members = await getAllMembers();
    for (const m of members) {
      const isMalformed = 
        m.nick.toLowerCase().startsWith('geral ') || 
        m.normalizedNick.toLowerCase().startsWith('geral_') ||
        m.role.toLowerCase() === 'geral' ||
        m.nick.toLowerCase().startsWith('majoritário ') ||
        m.role.toLowerCase() === 'acionista';

      if (isMalformed) {
        await deleteDoc(doc(db, 'members', m.id));
        count++;
      }
    }
  } catch (err) {
    console.error('Error cleaning up malformed members:', err);
  }
  return count;
}

/**
 * Automatically detects and cleans up duplicate/ghost member documents
 * (e.g. m_lisboa marked as dismissed when m___lisboa is active, or punctuation variations).
 */
export async function cleanupDuplicateMembers(): Promise<number> {
  let cleanedCount = 0;
  try {
    const allMembers = await getAllMembers();
    const groups = new Map<string, Member[]>();

    for (const m of allMembers) {
      const alpha = getAlphanumericKey(m.nick);
      if (!alpha) continue;
      if (!groups.has(alpha)) {
        groups.set(alpha, []);
      }
      groups.get(alpha)!.push(m);
    }

    for (const [, list] of groups.entries()) {
      if (list.length <= 1) continue;

      // We have duplicates!
      const active = list.filter(m => !m.isDismissed && m.status !== 'DESLIGADO');
      const dismissed = list.filter(m => m.isDismissed || m.status === 'DESLIGADO');

      if (active.length > 0 && dismissed.length > 0) {
        // The dismissed ones are ghost records caused by past imports or nick formatting changes!
        for (const ghost of dismissed) {
          await deleteDoc(doc(db, 'members', ghost.id));
          cleanedCount++;
        }
      } else if (active.length > 1) {
        // Both are active, keep the newest updated one and delete the other
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        const [, ...removeList] = list;
        for (const rem of removeList) {
          await deleteDoc(doc(db, 'members', rem.id));
          cleanedCount++;
        }
      } else if (dismissed.length > 1) {
        // Both are dismissed, keep one and delete duplicates
        const [, ...removeList] = dismissed;
        for (const rem of removeList) {
          await deleteDoc(doc(db, 'members', rem.id));
          cleanedCount++;
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning duplicate members:', err);
  }
  return cleanedCount;
}

/**
 * Reactivate a dismissed member
 */
export async function reactivateMember(memberId: string): Promise<void> {
  const memberDocRef = doc(db, 'members', memberId);
  const nowIso = new Date().toISOString();
  await updateDoc(memberDocRef, sanitizeForFirestore({
    isDismissed: false,
    dismissedAt: null,
    dismissalDetails: null,
    status: 'ATIVO',
    updatedAt: nowIso,
  }));
}

/**
 * Wipe all dismissed members from the database
 */
export async function clearAllDismissedMembers(): Promise<number> {
  let count = 0;
  try {
    const allMembers = await getAllMembers();
    for (const m of allMembers) {
      if (m.isDismissed || m.status === 'DESLIGADO') {
        await deleteDoc(doc(db, 'members', m.id));
        count++;
      }
    }
  } catch (err) {
    console.error('Error clearing dismissed members:', err);
    throw err;
  }
  return count;
}

