import { ParsedMember, ShiftType, SpecializationType } from './types';

/**
 * Normalizes Habbo nicks for stable lookup and comparison.
 * Keeps characters trimmed and lowercase.
 */
export function normalizeNick(nick: string): string {
  return nick.trim().toLowerCase();
}

/**
 * Returns an alphanumeric key for fuzzy comparison across Habbo symbols (e.g. "-:Lisboa" -> "lisboa", "carlosobama10." -> "carlosobama10").
 */
export function getAlphanumericKey(nick: string): string {
  return nick.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generates a stable internal member id from a normalized nick or random seed if needed.
 * Uses alphanumeric key so punctuation variations (e.g. Lisboa vs -:Lisboa) always map to the same id.
 */
export function generateMemberId(nick: string): string {
  const clean = getAlphanumericKey(nick);
  return clean ? `m_${clean}` : `m_${Date.now()}`;
}

const KNOWN_ROLES = [
  'Comandante Supremo',
  'Comandante-Geral',
  'Comandante Geral',
  'Subcomandante-Geral',
  'Subcomandante Geral',
  'Superintendente-Geral',
  'Superintendente Geral',
  'Inspetor-Geral',
  'Inspetor Geral',
  'Coordenador-Geral',
  'Coordenador Geral',
  'Diretor-Geral',
  'Diretor Geral',
  'Conselheiro-Geral',
  'Conselheiro Geral',
  'Supervisor-Geral',
  'Supervisor Geral',
  'Corregedor-Geral',
  'Corregedor Geral',
  'Acionista Majoritário',
  'Acionista-Majoritário',
  'Acionista',
  'General',
  'Marechal',
  'Chanceler',
  'Presidente',
  'Vice-Presidente',
  'VIP',
  'Superintendente-Geral',
  'Superintendente Geral',
  'Superintendente',
  'Coordenador-Geral',
  'Coordenador Geral',
  'Coordenador',
  'Inspetor-Geral',
  'Inspetor Geral',
  'Inspetor',
  'Supervisor-Geral',
  'Supervisor Geral',
  'Supervisor',
  'Analista-Chefe',
  'Analista Chefe',
  'Analista',
  'Assistente-Chefe',
  'Assistente Chefe',
  'Assistente',
  'Secretário-Chefe',
  'Secretario-Chefe',
  'Secretário Chefe',
  'Secretario Chefe',
  'Secretário',
  'Secretario',
  'Assessor',
  'Trainee',
  'Ministro',
  'Conselheiro',
  'Diretor',
  'Coronel',
  'Tenente-Coronel',
  'Major',
  'Capitão',
  'Primeiro-Tenente',
  'Segundo-Tenente',
  'Tenente',
  'Aspirante-a-Oficial',
  'Subtenente',
  'Primeiro-Sargento',
  'Segundo-Sargento',
  'Sargento',
  'Cabo',
  'Soldado',
  'Recruta',
  'Corregedor',
  'Coordenador',
  'Supervisor',
];

/**
 * Main parser for RCC shift lists.
 * Handles headings like:
 * - Especialização Avançada
 * - Especialização Intermediária
 * - Portadores de Especialização Intermediária em licença/reserva
 * - Membros em licença/reserva
 * 
 * Line format examples:
 * 1. Chanceler Klests [D71] 29 Ago 2026 [TRE.2/Ins.ECE] [Manhã/Noite]
 * 2. Vice-Presidente J.Albecy [Pgs] 15 Set 2026 [Cap.INS/A.DC/P.CFO/A.AF/M.CEM] [Noite] [ADV: 1] [Promoção permitida: 30 Set 2026]
 * 3. Superintendente -:Lisboa [DIR] 04 Ago 2026 [Min.INS/Cons.CFO] [Manhã]
 * 4. Coordenador JadeEstrela [Bif] 19 Ago 2026 [Fisc.SUP/Av.CFO/Grad.ROND] [Manhã] [27 Ago 2026 a 26 Set 2026]
 */
export function parseRCCList(rawText: string): ParsedMember[] {
  const lines = rawText.split(/\r?\n/);
  const members: ParsedMember[] = [];

  let currentSpecialization: SpecializationType = 'Especialização Intermediária';
  let sectionIsLeave = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check section header changes
    const lower = rawLine.toLowerCase();

    if (lower.includes('licença') || lower.includes('reserva')) {
      sectionIsLeave = true;
      if (lower.includes('avançada')) {
        currentSpecialization = 'Especialização Avançada';
      } else if (lower.includes('intermediária') || lower.includes('intermediaria')) {
        currentSpecialization = 'Especialização Intermediária';
      }
      continue;
    }

    if (lower.includes('especialização avançada') || lower.includes('especializacao avancada')) {
      currentSpecialization = 'Especialização Avançada';
      sectionIsLeave = false;
      continue;
    }

    if (lower.includes('especialização intermediária') || lower.includes('especializacao intermediaria')) {
      currentSpecialization = 'Especialização Intermediária';
      sectionIsLeave = false;
      continue;
    }

    // Ignore headers or dividers like "---" or "***"
    if (/^[=\-_*#]{3,}$/.test(rawLine)) continue;

    // If it's a numbered line (e.g. "1. ..." or "1 - ...") or starts with a known role
    const parsed = parseMemberLine(rawLine, currentSpecialization, sectionIsLeave);
    if (parsed) {
      members.push(parsed);
    }
  }

  return members;
}

function parseMemberLine(
  rawLine: string, 
  currentSpecialization: SpecializationType, 
  sectionIsLeave: boolean
): ParsedMember | null {
  // Try extracting number at start, e.g. "1. " or "1) " or "1 - "
  let workingLine = rawLine;
  let itemNumber: number | undefined;

  const numberMatch = workingLine.match(/^(\d+)[\.\)\-]\s*/);
  if (numberMatch) {
    itemNumber = parseInt(numberMatch[1], 10);
    workingLine = workingLine.substring(numberMatch[0].length).trim();
  }

  // Extract all bracketed tokens: [Token1] [Token2] ...
  const bracketRegex = /\[(.*?)\]/g;
  const bracketMatches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(workingLine)) !== null) {
    bracketMatches.push(match[1].trim());
  }

  // Text outside bracket tokens
  const nonBracketText = workingLine.replace(bracketRegex, ' ').replace(/\s+/g, ' ').trim();

  // If there are no brackets and no recognized role, skip line as non-member line
  if (bracketMatches.length === 0 && !KNOWN_ROLES.some(r => nonBracketText.toLowerCase().startsWith(r.toLowerCase()))) {
    return null;
  }

  // Parse nonBracketText to find Role, Nick, and Last Promotion Date
  // Example nonBracketText: "Chanceler Klests 29 Ago 2026" or "Vice-Presidente J.Albecy 15 Set 2026"
  let role = '';
  let nick = '';
  let lastPromotionDate = '';
  let remainder = '';

  // Match known role from start (sorted by length descending so longer titles like Vice-Presidente match before Presidente)
  const sortedRoles = [...KNOWN_ROLES].sort((a, b) => b.length - a.length);
  for (const knownRole of sortedRoles) {
    const escapedRole = knownRole.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const roleRegex = new RegExp(`^${escapedRole}(?:\\s+|$)`, 'i');
    const roleMatch = nonBracketText.match(roleRegex);
    if (roleMatch) {
      role = knownRole;
      remainder = nonBracketText.substring(roleMatch[0].length).trim();
      break;
    }
  }

  if (!role) {
    // If not in known roles list, split first word as role or guess role
    const parts = nonBracketText.split(/\s+/);
    if (parts.length >= 2) {
      role = parts[0];
      remainder = parts.slice(1).join(' ');
    } else {
      return null;
    }
  }

  // In remainder, look for date pattern like "29 Ago 2026", "04/08/2026", "15 Set. 2026", "15 Set 2026"
  const dateRegex = /(\d{1,2}\s+(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)[a-z]*\.?\s+\d{2,4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
  const dateMatch = remainder.match(dateRegex);

  if (dateMatch && dateMatch.index !== undefined) {
    lastPromotionDate = dateMatch[0].trim();
    // Nick is everything before the date
    nick = remainder.substring(0, dateMatch.index).trim();
  } else {
    // If no date found in text, the remainder is the nick
    nick = remainder.trim();
  }

  // If nick is still empty, fall back
  if (!nick && remainder) {
    nick = remainder;
  }

  // Clean nick of only whitespace and trailing/leading commas without stripping valid Habbo punctuation (e.g. -:Lisboa, carlosobama10., =Nick=, .Nick.)
  nick = nick.trim().replace(/^[,]+|[,]+$/g, '').trim();

  if (!nick) {
    return null;
  }

  // Now inspect the bracket tokens:
  // Examples:
  // [D71] -> tag
  // [TRE.2/Ins.ECE] -> tasks
  // [Manhã/Noite] -> shifts
  // [ADV: 1] -> adv
  // [Promoção permitida: 30 Set 2026] -> allowedPromotionDate
  // [27 Ago 2026 a 26 Set 2026] -> leave period
  let tag: string | undefined;
  const tasks: string[] = [];
  const shifts: ShiftType[] = [];
  let adv: number | undefined;
  let allowedPromotionDate: string | undefined;
  let isOnLeave = sectionIsLeave;
  let leaveReason: string | undefined;
  let leaveStartDate: string | undefined;
  let leaveEndDate: string | undefined;

  for (let idx = 0; idx < bracketMatches.length; idx++) {
    const token = bracketMatches[idx];
    const tokenLower = token.toLowerCase();

    // 1. Check if token is shift: e.g. "Manhã", "Manhã/Noite", "Tarde", "Noite/Madrugada"
    if (isShiftToken(token)) {
      const extractedShifts = parseShifts(token);
      shifts.push(...extractedShifts);
      continue;
    }

    // 2. Check if token is ADV: e.g. "ADV: 1", "ADV: 2", "ADV 1"
    const advMatch = token.match(/adv\s*[:=]?\s*(\d+)/i);
    if (advMatch) {
      adv = parseInt(advMatch[1], 10);
      continue;
    }

    // 3. Check if token is Promoção permitida: e.g. "Promoção permitida: 30 Set 2026"
    if (tokenLower.includes('promoção permitida') || tokenLower.includes('promocao permitida')) {
      const promoPart = token.replace(/promo[çc][ãa]o\s+permitida\s*[:=]?\s*/i, '').trim();
      allowedPromotionDate = promoPart;
      continue;
    }

    // 4. Check if token is leave date range: e.g. "27 Ago 2026 a 26 Set 2026" or "Licença: 10 Ago a 10 Set"
    const leaveRangeMatch = token.match(/(.*?)\s+a\s+(.*)/i);
    if (leaveRangeMatch && (tokenLower.includes('jan') || tokenLower.includes('fev') || tokenLower.includes('mar') || tokenLower.includes('abr') || tokenLower.includes('mai') || tokenLower.includes('jun') || tokenLower.includes('jul') || tokenLower.includes('ago') || tokenLower.includes('set') || tokenLower.includes('out') || tokenLower.includes('nov') || tokenLower.includes('dez') || token.includes('/'))) {
      isOnLeave = true;
      leaveStartDate = leaveRangeMatch[1].trim();
      leaveEndDate = leaveRangeMatch[2].trim();
      continue;
    }

    if (tokenLower.includes('licença') || tokenLower.includes('reserva')) {
      isOnLeave = true;
      leaveReason = token;
      continue;
    }

    // 5. If it's the first bracket and short (<= 6 chars) and not a task slash list, likely a Tag (e.g. D71, DIR, Bif, Pgs)
    if (idx === 0 && token.length <= 6 && !token.includes('/') && !token.includes('.')) {
      tag = token;
      continue;
    }

    // 6. Otherwise, if it has slash or dots or capital letters (e.g. TRE.2/Ins.ECE, Cap.INS/A.DC/P.CFO/A.AF/M.CEM), it's tasks
    if (token.includes('/') || token.includes('.') || token.length > 2) {
      // Split by slash if slash exists
      if (token.includes('/')) {
        const subTasks = token.split('/').map(t => t.trim()).filter(Boolean);
        tasks.push(...subTasks);
      } else {
        tasks.push(token);
      }
      continue;
    }

    // Fallback if tag wasn't set
    if (!tag && token.length <= 6) {
      tag = token;
    } else {
      tasks.push(token);
    }
  }

  // Remove duplicate shifts
  const uniqueShifts = Array.from(new Set(shifts));

  return {
    rawLine,
    itemNumber,
    role,
    nick,
    tag,
    lastPromotionDate: lastPromotionDate || undefined,
    tasks,
    shifts: uniqueShifts,
    adv,
    allowedPromotionDate,
    specialization: currentSpecialization,
    isOnLeave,
    leaveReason,
    leaveStartDate,
    leaveEndDate,
  };
}

function isShiftToken(token: string): boolean {
  const lower = token.toLowerCase();
  const shiftKeywords = ['manhã', 'manha', 'tarde', 'noite', 'madrugada'];
  return shiftKeywords.some(k => lower.includes(k));
}

function parseShifts(token: string): ShiftType[] {
  const parts = token.split(/[\/,]/);
  const result: ShiftType[] = [];

  for (const p of parts) {
    const clean = p.trim().toLowerCase();
    if (clean.includes('manhã') || clean.includes('manha')) result.push('Manhã');
    else if (clean.includes('tarde')) result.push('Tarde');
    else if (clean.includes('noite')) result.push('Noite');
    else if (clean.includes('madrugada')) result.push('Madrugada');
  }

  return result;
}
