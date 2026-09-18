'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  UserX, 
  FileUp, 
  Settings, 
  Shield, 
  LogOut, 
  LogIn,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ShiftType } from '@/lib/types';

interface SidebarProps {
  currentShift?: ShiftType;
}

export function Sidebar({ currentShift = 'Manhã' }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, signInQuickAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
      badge: currentShift,
    },
    {
      name: 'Militares',
      href: '/militares',
      icon: Users,
      active: pathname.startsWith('/militares') && !pathname.includes('/desligados'),
    },
    {
      name: 'Histórico',
      href: '/historico',
      icon: History,
      active: pathname === '/historico',
    },
    {
      name: 'Desligados',
      href: '/desligados',
      icon: UserX,
      active: pathname === '/desligados',
    },
    {
      name: 'Importar listagem',
      href: '/importar',
      icon: FileUp,
      active: pathname === '/importar',
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      active: pathname === '/configuracoes',
    },
  ];

  const shiftColors: Record<ShiftType, string> = {
    Manhã: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Tarde: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Noite: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Madrugada: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between bg-[#111113] border-r border-[#27272A] p-4 text-[#A1A1AA]">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-[#27272A]">
          <div className="w-9 h-9 rounded-lg bg-[#27272A] flex items-center justify-center text-[#FAFAFA] border border-[#3F3F46]/50">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#FAFAFA] tracking-wide flex items-center gap-1.5">
              POLÍCIA RCC
            </div>
            <div className="text-[11px] text-[#71717A] tracking-wider uppercase font-medium">
              Gestão de Turno
            </div>
          </div>
        </div>

        {/* Current Active Shift Indicator */}
        <div className="mx-2 mb-6 p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#71717A]" />
            <span className="text-xs text-[#71717A]">Turno Ativo:</span>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${shiftColors[currentShift] || 'text-[#FAFAFA]'}`}>
            {currentShift.toUpperCase()}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  item.active
                    ? 'bg-[#1E1E22] text-[#FAFAFA] border border-[#27272A]'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.active ? 'text-emerald-400' : 'text-[#71717A]'}`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Auth Footer */}
      <div className="pt-4 border-t border-[#27272A] px-1">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-medium text-[#FAFAFA] truncate">
                {user.email || 'Oficial Admin'}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Autenticado
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Encerrar Sessão"
              className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1E1E22] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => signInQuickAdmin()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-medium transition-colors border border-[#3F3F46]/50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acessar Painel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111113] border-b border-[#27272A] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm text-[#FAFAFA]">POLÍCIA RCC</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ml-1 ${shiftColors[currentShift]}`}>
            {currentShift}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#18181B] rounded border border-[#27272A]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full relative z-50">
            {navContent}
          </div>
          <div 
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
