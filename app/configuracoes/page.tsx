'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { getAppSettings, updateAppSettings } from '@/lib/firestoreService';
import { AppSettings, ShiftType } from '@/lib/types';
import { Settings, Save, CheckCircle2, Shield, Clock, User, Award } from 'lucide-react';

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

          {/* Critérios de Avaliação (Futuro / Estrutura Dinâmica) */}
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-[#FAFAFA]">Critérios de Avaliação Dinâmicos</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] mb-4">
              A estrutura está preparada no Firestore para comportar qualquer categoria de avaliação de qualidade sem engessar o código.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {['Desempenho Geral', 'Liderança', 'Comunicação', 'Iniciativa', 'Presença & Pontualidade', 'Desenvolvimento de Subalternos'].map((crit) => (
                <div key={crit} className="p-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-[#D4D4D8] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{crit}</span>
                </div>
              ))}
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
