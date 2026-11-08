import { LayoutDashboard, FileText, Sparkles, QrCode, Settings, BarChart3 } from 'lucide-react';
import type { View } from '@/types';

interface SidebarProps {
  current: View;
  onNavigate: (view: View) => void;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'surveys', label: 'Enquestes', icon: FileText },
  { id: 'create-survey', label: 'Crear enquesta', icon: BarChart3 },
  { id: 'publish', label: 'Publicar', icon: QrCode },
  { id: 'copilot', label: 'DammIÀ', icon: Sparkles },
  { id: 'settings', label: 'Configuració', icon: Settings },
];

/**
 * Barra lateral de navegació d'escriptori. Es amaga en impressió.
 *
 * @param props - Vista actual i callback de navegació.
 * @returns Element aside amb el menú.
 */
export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="print:hidden hidden w-64 shrink-0 flex-col bg-damm-600 text-white lg:flex shadow-2xl">
      {/* Cabecera con el logotipo Damm a gran escala */}
      <div className="flex h-28 flex-col justify-center border-b border-white/15 px-6">
        <div className="flex items-center justify-between gap-2">
          <img
            src="/damm-logo.png"
            alt="Damm"
            className="h-14 w-auto max-w-[175px] object-contain brightness-0 invert drop-shadow-md"
          />
          <span className="shrink-0 rounded-full bg-gold-400/25 px-2 py-0.5 text-[10px] font-black tracking-wider text-gold-300 border border-gold-400/40">
            1876
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold tracking-wide text-white/90">
          Escolta Activa · RRHH
        </p>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            current === item.id ||
            (item.id === 'surveys' && current === 'survey-detail');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'bg-white text-damm-700 shadow-md shadow-black/10'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                  active ? 'text-damm-600' : 'text-white/70 group-hover:text-white'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <span className="h-2 w-2 rounded-full bg-gold-400" />}
            </button>
          );
        })}
      </nav>

      {/* Tarjeta inferior Reto Damm */}
      <div className="border-t border-white/15 p-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Reto Damm 2026</span>
            <span className="rounded bg-gold-400 px-1.5 py-0.5 text-[9px] font-black text-ink-900">
              LIVE
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/80">
            Decisions estratègiques en temps real amb garantia total d'anonimat.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Navegació inferior per a mòbil. Es amaga en impressió.
 *
 * @param props - Vista actual i callback de navegació.
 * @returns Element nav amb les primeres cinc opcions del menú.
 */
export function MobileNav({ current, onNavigate }: SidebarProps) {
  return (
    <nav className="print:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/15 bg-damm-600 px-2 py-2 text-white shadow-2xl lg:hidden">
      {navItems.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const active =
          current === item.id ||
          (item.id === 'surveys' && current === 'survey-detail');
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
              active ? 'text-gold-300 font-bold' : 'text-white/70'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'scale-110 text-gold-300' : ''}`} />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
