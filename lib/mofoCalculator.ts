/**
 * Executive Hierarchy Promotion Rules & "Mofo" (Time in Rank) Calculator
 * 
 * Regras fornecidas:
 * Trainee - Assessor: 00 dias de serviços prestados;
 * Assessor - Secretário: 01 dia de serviços prestados;
 * Secretário - Secretário-Chefe: 01 dia de serviços prestados;
 * Secretário-Chefe - Assistente: 01 dia de serviços prestados;
 * Assistente - Assistente-Chefe: 01 dia de serviços prestados;
 * Assistente-Chefe - Analista: 02 dias de serviços prestados;
 * Analista - Analista-Chefe: 03 dias de serviços prestados;
 * Analista-Chefe - Supervisor: 05 dias de serviços prestados;
 * Supervisor - Supervisor-Geral: 05 dias de serviços prestados;
 * Supervisor-Geral - Inspetor: 05 dias de serviços prestados;
 * Inspetor - Inspetor-Geral: 07 dias de serviços prestados;
 * Inspetor-Geral - Coordenador: 08 dias de serviços prestados;
 * Coordenador - Coordenador-Geral: 09 dias de serviços prestados;
 * Coordenador-Geral - Superintendente: 11 dias de serviços prestados;
 * Superintendente - Superintendente-Geral: 15 dias de serviços prestados;
 * Superintendente-Geral - VIP: 15 dias de serviços prestados;
 * VIP - Vice-Presidente: 15 dias de serviços prestados;
 * Vice-Presidente - Presidente: 15 dias de serviços prestados;
 * Presidente - Acionista Majoritário: 15 dias de serviços prestados;
 * Acionista Majoritário - Chanceler: 15 dias de serviços prestados.
 */

export interface PromotionRule {
  currentRole: string;
  nextRole: string;
  requiredDays: number;
}

export const EXECUTIVE_PROMOTION_RULES: PromotionRule[] = [
  { currentRole: 'Trainee', nextRole: 'Assessor', requiredDays: 0 },
  { currentRole: 'Assessor', nextRole: 'Secretário', requiredDays: 1 },
  { currentRole: 'Secretário', nextRole: 'Secretário-Chefe', requiredDays: 1 },
  { currentRole: 'Secretário-Chefe', nextRole: 'Assistente', requiredDays: 1 },
  { currentRole: 'Assistente', nextRole: 'Assistente-Chefe', requiredDays: 1 },
  { currentRole: 'Assistente-Chefe', nextRole: 'Analista', requiredDays: 2 },
  { currentRole: 'Analista', nextRole: 'Analista-Chefe', requiredDays: 3 },
  { currentRole: 'Analista-Chefe', nextRole: 'Supervisor', requiredDays: 5 },
  { currentRole: 'Supervisor', nextRole: 'Supervisor-Geral', requiredDays: 5 },
  { currentRole: 'Supervisor-Geral', nextRole: 'Inspetor', requiredDays: 5 },
  { currentRole: 'Inspetor', nextRole: 'Inspetor-Geral', requiredDays: 7 },
  { currentRole: 'Inspetor-Geral', nextRole: 'Coordenador', requiredDays: 8 },
  { currentRole: 'Coordenador', nextRole: 'Coordenador-Geral', requiredDays: 9 },
  { currentRole: 'Coordenador-Geral', nextRole: 'Superintendente', requiredDays: 11 },
  { currentRole: 'Superintendente', nextRole: 'Superintendente-Geral', requiredDays: 15 },
  { currentRole: 'Superintendente-Geral', nextRole: 'VIP', requiredDays: 15 },
  { currentRole: 'VIP', nextRole: 'Vice-Presidente', requiredDays: 15 },
  { currentRole: 'Vice-Presidente', nextRole: 'Presidente', requiredDays: 15 },
  { currentRole: 'Presidente', nextRole: 'Acionista Majoritário', requiredDays: 15 },
  { currentRole: 'Acionista Majoritário', nextRole: 'Chanceler', requiredDays: 15 },
];

/**
 * Normalizes a role string for matching against promotion rules.
 * Handles accents, hyphens, and casing.
 */
export function normalizeRoleName(role: string): string {
  if (!role) return '';
  return role
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[\-_]/g, ' ') // hyphen to space
    .replace(/\s+/g, ' ');
}

/**
 * Finds the promotion rule for a given role name.
 */
export function getPromotionRuleForRole(role: string): PromotionRule | null {
  if (!role) return null;
  const norm = normalizeRoleName(role);

  for (const rule of EXECUTIVE_PROMOTION_RULES) {
    const ruleNorm = normalizeRoleName(rule.currentRole);
    if (norm === ruleNorm) {
      return rule;
    }
  }

  // Partial / alias matching (e.g., "Supervisor Geral" matches "Supervisor-Geral", "Acionista" matches "Acionista Majoritário")
  for (const rule of EXECUTIVE_PROMOTION_RULES) {
    const ruleNorm = normalizeRoleName(rule.currentRole);
    if (norm.startsWith(ruleNorm) || ruleNorm.startsWith(norm)) {
      return rule;
    }
  }

  return null;
}

/**
 * Parses Portuguese textual dates commonly used in RCC lists:
 * e.g. "29 Ago 2026", "29 Ago. 2026", "04/08/2026", "2026-08-29", "29 de Agosto de 2026"
 */
export function parseDateFlexible(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // 1. ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2. Slash/hyphen DD/MM/YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. Textual month format: "29 Ago 2026", "15 Set 2026", "04 Ago. 2026", "29 de Agosto de 2026"
  const monthMap: Record<string, number> = {
    jan: 0, janeiro: 0,
    fev: 1, fevereiro: 1,
    mar: 2, marco: 2, março: 2,
    abr: 3, abril: 3,
    mai: 4, maio: 4,
    jun: 5, junho: 5,
    jul: 6, julho: 6,
    ago: 7, agosto: 7,
    set: 8, setembro: 8,
    out: 9, outubro: 9,
    nov: 10, novembro: 10,
    dez: 11, dezembro: 11,
  };

  const textMatch = clean.match(/^(\d{1,2})(?:\s+de)?\s+([a-zA-ZçÇãÃáÁéÉíÍóÓúÚ]+)\.?\s+(?:de\s+)?(\d{2,4})/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const rawMonth = textMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const monthPrefix = rawMonth.slice(0, 3);
    const month = monthMap[monthPrefix] ?? monthMap[rawMonth];
    let year = parseInt(textMatch[3], 10);
    if (year < 100) year += 2000;

    if (month !== undefined) {
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Fallback direct Date parse
  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export interface MofoCalculationResult {
  hasPromotionDate: boolean;
  daysInRole: number; // quantos dias a pessoa está no cargo
  requiredDays: number | null; // dias necessários para o próximo cargo (conforme regra)
  nextRole: string | null; // próximo cargo na hierarquia (null para cargo máximo)
  isEligibleForPromotion: boolean; // se já atingiu o tempo mínimo (sempre false se for cargo máximo)
  isMaxRole: boolean; // TRUE para Chanceler (cargo máximo da hierarquia executiva)
  daysRemaining: number; // quantos dias faltam para atingir o tempo mínimo (0 se já atingiu ou cargo máximo)
  statusLabel: string; // e.g. "Cargo Máximo", "Apto para Promoção", "Faltam 3 dias"
  badgeColor: 'emerald' | 'amber' | 'blue' | 'zinc' | 'purple';
}

/**
 * Checks if the role is Chanceler (maximum apex role of the hierarchy).
 */
export function isChancellorRole(role: string): boolean {
  if (!role) return false;
  const norm = normalizeRoleName(role);
  return norm === 'chanceler' || norm.startsWith('chanceler');
}

/**
 * Calculates time in rank ("tempo de mofo") and promotion eligibility.
 */
export function calculateMofo(
  role: string,
  lastPromotionDateStr?: string | null,
  now: Date = new Date()
): MofoCalculationResult {
  const parsedDate = parseDateFlexible(lastPromotionDateStr);
  const isMax = isChancellorRole(role);
  const rule = isMax ? null : getPromotionRuleForRole(role);

  // If this is Chanceler (maximum role)
  if (isMax) {
    if (!parsedDate) {
      return {
        hasPromotionDate: false,
        daysInRole: 0,
        requiredDays: null,
        nextRole: null,
        isEligibleForPromotion: false,
        isMaxRole: true,
        daysRemaining: 0,
        statusLabel: 'Máximo',
        badgeColor: 'purple',
      };
    }

    const startOfDayPromo = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    const startOfDayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = startOfDayNow.getTime() - startOfDayPromo.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    return {
      hasPromotionDate: true,
      daysInRole: diffDays,
      requiredDays: null,
      nextRole: null,
      isEligibleForPromotion: false,
      isMaxRole: true,
      daysRemaining: 0,
      statusLabel: `Máximo (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`,
      badgeColor: 'purple',
    };
  }

  if (!parsedDate) {
    return {
      hasPromotionDate: false,
      daysInRole: 0,
      requiredDays: rule ? rule.requiredDays : null,
      nextRole: rule ? rule.nextRole : null,
      isEligibleForPromotion: false,
      isMaxRole: false,
      daysRemaining: rule ? rule.requiredDays : 0,
      statusLabel: 'Data não informada',
      badgeColor: 'zinc',
    };
  }

  // Calculate difference in whole days
  // Reset hours to start of day for clean day counts
  const startOfDayPromo = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const startOfDayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = startOfDayNow.getTime() - startOfDayPromo.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  if (!rule) {
    return {
      hasPromotionDate: true,
      daysInRole: diffDays,
      requiredDays: null,
      nextRole: null,
      isEligibleForPromotion: false,
      isMaxRole: false,
      daysRemaining: 0,
      statusLabel: `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} no cargo`,
      badgeColor: 'blue',
    };
  }

  const required = rule.requiredDays;
  const isEligible = diffDays >= required;
  const daysRemaining = Math.max(0, required - diffDays);

  let statusLabel = '';
  let badgeColor: 'emerald' | 'amber' | 'blue' | 'zinc' | 'purple' = 'zinc';

  if (isEligible) {
    badgeColor = 'emerald';
    if (diffDays === required) {
      statusLabel = `Apto hoje (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`;
    } else {
      const extra = diffDays - required;
      statusLabel = `Apto (+${extra} ${extra === 1 ? 'dia' : 'dias'})`;
    }
  } else {
    badgeColor = 'amber';
    statusLabel = `Falta ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
  }

  return {
    hasPromotionDate: true,
    daysInRole: diffDays,
    requiredDays: required,
    nextRole: rule.nextRole,
    isEligibleForPromotion: isEligible,
    isMaxRole: false,
    daysRemaining,
    statusLabel,
    badgeColor,
  };
}
