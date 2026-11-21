import React from 'react';
import { Plus } from 'lucide-react';

export type ActiveView =
  | 'tickets'
  | 'dashboard'
  | 'kb'
  | 'guide'
  | 'about'
  | 'create'
  | 'detail';

interface TopNavProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeView, onNavigate }) => {
  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'tickets', label: 'Tickets' },
    { id: 'dashboard', label: 'Panel de Control' },
    { id: 'kb', label: 'Base de Conocimientos' },
    { id: 'guide', label: 'Guía Académica' },
    { id: 'about', label: 'Acerca de...' },
  ];

  const isNavActive = (id: ActiveView) => {
    if (id === 'tickets' && activeView === 'detail') return true;
    return activeView === id;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-6 h-20 flex items-center justify-between gap-6">
        {/* Zone 1 (Left): New Helpdesk SPA logo */}
        <button
          type="button"
          onClick={() => onNavigate('tickets')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D63ED] rounded-md py-1"
          aria-label="Ir al inicio de Helpdesk SPA"
        >
          <img
            src="/assets/aistudio/logo_helpdesk_spa_peq_f26b7f94.png"
            alt="Logo Helpdesk SPA"
            className="h-14 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Zone 2 (Center): 5 ordered single-line navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden lg:flex items-center gap-6"
        >
          {navItems.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D63ED] ${
                  active
                    ? 'text-[#0B2A5B] font-semibold'
                    : 'text-slate-600 hover:text-[#0B2A5B]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D63ED]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3 (Right): Primary CTA + UNETI Logo on the right */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1D63ED]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Reportar Falla</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('about')}
            title="Universidad Nacional Experimental de las Telecomunicaciones e Informática (UNETI)"
            className="hidden sm:flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D63ED] rounded-md p-0.5"
          >
            <img
              src="/assets/aistudio/logo_uneti_734aeb02.png"
              alt="Logo UNETI"
              className="h-11 w-auto object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>

      {/* Compact mobile/tablet navigation row */}
      <nav
        aria-label="Navegación móvil"
        className="flex lg:hidden items-center justify-between gap-4 px-6 pb-3 overflow-x-auto border-t border-slate-100 pt-2"
      >
        <div className="flex items-center gap-5">
          {navItems.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 ${
                  active
                    ? 'text-[#1D63ED] font-semibold underline underline-offset-4'
                    : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <img
          src="/assets/aistudio/logo_uneti_734aeb02.png"
          alt="Logo UNETI"
          className="sm:hidden h-8 w-auto object-contain shrink-0"
          referrerPolicy="no-referrer"
        />
      </nav>
    </header>
  );
};
