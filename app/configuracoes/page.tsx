'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { getAppSettings, updateAppSettings } from '@/lib/firestoreService';
import { AppSettings, ShiftType, OBLIGATORY_CRITERIA, COMPLEMENTARY_CRITERIA } from '@/lib/types';
import { EXECUTIVE_PROMOTION_RULES } from '@/lib/mofoCalculator';
import { Settings, Save, CheckCircle2, Shield, Clock, User, Award, ShieldAlert, Sparkles, Hourglass, ArrowRight, Crown } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<AppSettings>({
    selectedShift: 'Manhã',
    adminDisplayName: 'Oficial de Turno',
    defaultSchedule: '08:00 — 12:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const s = await getAppSettings();
        setSettings(s);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAppSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const shiftsList: ShiftType[] = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      <Sidebar currentShift={settings.selectedShift} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="pb-6 border-b border-[#27272A] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferências Operacionais</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Configurações do Turno
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Defina qual turno você está gerenciando no momento, seu nome de oficial responsável e critérios operacionais.
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Configurações atualizadas com sucesso no Firestore! O dashboard agora refletirá o turno escolhido.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Turno Gerenciado */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-[#FAFAFA]">Turno Gerenciado no Momento</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] mb-4">
              Selecione qual turno você está supervisionando hoje. O Dashboard principal filtrará automaticamente os membros qualificados para este período.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {shiftsList.map((shift) => (
                <button
                  type="button"
                  key={shift}
                  onClick={() => setSettings({ ...settings, selectedShift: shift })}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    settings.selectedShift === shift
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                  }`}
                >
                  <span className="font-bold text-sm">{shift}</span>
                  <span className="text-[10px] text-[#71717A]">
                    {shift === 'Manhã' && '08h às 12h'}
                    {shift === 'Tarde' && '12h às 18h'}
                    {shift === 'Noite' && '18h às 00h'}
                    {shift === 'Madrugada' && '00h às 06h'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Oficial Responsável & Horários Padrão */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-[#FAFAFA]">Oficial e Horários</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Nome / Cargo do Administrador
                </label>
                <input
                  type="text"
                  value={settings.adminDisplayName}
                  onChange={(e) => setSettings({ ...settings, adminDisplayName: e.target.value })}
                  placeholder="Ex: Superintendente Fulano"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Horário Padrão do Turno
                </label>
                <input
                  type="text"
                  value={settings.defaultSchedule || ''}
                  onChange={(e) => setSettings({ ...settings, defaultSchedule: e.target.value })}
                  placeholder="Ex: 08:00 — 12:00"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-hidden focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Critérios Oficiais de Acompanhamento de Qualidade */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-[#FAFAFA]">Critérios do Sistema de Qualidade</h3>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Critérios oficiais vigentes utilizados na área de Qualidade e Acompanhamento contínuo dos militares da Especialização Intermediária.
              </p>
            </div>

            {/* Obrigatórios */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Critérios Obrigatórios (6) — Exigidos para todos os portadores</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {OBLIGATORY_CRITERIA.map((crit, idx) => (
                  <div key={crit.id} className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-[#FAFAFA]">{idx + 1}. {crit.name}</span>
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed pl-3.5">
                      {crit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Complementares */}
            <div className="pt-4 border-t border-[#27272A]/70">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Critérios Complementares (6) — Observações e destaques adicionais</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {COMPLEMENTARY_CRITERIA.map((crit) => (
                  <div key={crit.id} className="p-3 bg-[#09090B] border border-[#27272A] rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] shrink-0" />
                      <span className="text-xs font-medium text-[#E4E4E7]">{crit.name}</span>
                    </div>
                    <p className="text-[11px] text-[#71717A] leading-relaxed pl-3.5">
                      {crit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela Oficial de Promoção e Mofo (Hierarquia Executiva) */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Hourglass className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-[#FAFAFA]">Tabela Oficial de Mofo & Serviços Prestados</h3>
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  Regras oficiais de tempo de permanência mínimo em cada cargo para promoção na Hierarquia Executiva.
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                20 Transições Catalogadas
              </span>
            </div>

            {/* Layout em Tabela / Cards amplos para os nomes nunca truncarem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {EXECUTIVE_PROMOTION_RULES.map((rule, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-[#09090B] border border-[#27272A] hover:border-[#3F3F46] transition-colors rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-semibold text-[#FAFAFA] whitespace-nowrap">{rule.currentRole}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                    <span className="text-emerald-400 font-medium whitespace-nowrap">{rule.nextRole}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded shrink-0 whitespace-nowrap ${
                    rule.requiredDays === 0 
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {rule.requiredDays < 10 ? `0${rule.requiredDays}` : rule.requiredDays} {rule.requiredDays === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              ))}

              {/* Destaque do Chanceler como Cargo Máximo */}
              <div className="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-lg flex items-center justify-between gap-3 md:col-span-2">
                <div className="flex items-center gap-2.5 text-xs text-purple-200">
                  <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-300">Chanceler</span>
                    <span className="text-purple-300/80 text-[11px] ml-2">
                      — Cargo Máximo da Hierarquia Executiva. Não possui promoção subsequente nem requisito de tempo de serviços para ascensão.
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded shrink-0 bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                  Máximo
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
