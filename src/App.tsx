import { useCallback, useEffect, useState } from 'react';
import { AboutView } from './components/AboutView';
import { AcademicGuideView } from './components/AcademicGuideView';
import { CreateTicketView } from './components/CreateTicketView';
import { DashboardView } from './components/DashboardView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TicketDetailView } from './components/TicketDetailView';
import { TicketListView } from './components/TicketListView';
import { TopNav, type ActiveView } from './components/TopNav';
import type { DashboardStats, TicketDetailResponse } from './types/helpdesk';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('tickets');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<TicketDetailResponse | null>(null);
  const [detailAiError, setDetailAiError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando panel');
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Error de conexión con SQLite');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    if (view === 'dashboard') {
      fetchDashboard();
    }
  };

  const handleOpenTicket = async (ticketId: number) => {
    setLoadingDetail(true);
    setDetailAiError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ticket no encontrado');
      setSelectedDetail(data);
      setActiveView('detail');
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'No se pudo abrir el ticket');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTicketCreated = (
    detail: TicketDetailResponse & { aiError?: string | null }
  ) => {
    setSelectedDetail({
      ticket: detail.ticket,
      messages: detail.messages,
      kbArticle: detail.kbArticle,
      parsedSuggestion: detail.parsedSuggestion,
    });
    setDetailAiError(detail.aiError ?? null);
    setActiveView('detail');
    fetchDashboard();
  };

  const handleDetailUpdated = (updated: TicketDetailResponse) => {
    setSelectedDetail(updated);
    setDetailAiError(null);
    fetchDashboard();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0f172a]">
      <TopNav activeView={activeView} onNavigate={handleNavigate} />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 py-8 sm:py-10">
        {loadingDetail && (
          <div className="py-12 text-center text-sm text-slate-500">
            Cargando ficha del ticket desde SQLite...
          </div>
        )}

        {!loadingDetail && activeView === 'tickets' && (
          <TicketListView
            onSelectTicket={handleOpenTicket}
            onCreateTicket={() => handleNavigate('create')}
          />
        )}

        {!loadingDetail && activeView === 'dashboard' && (
          <DashboardView
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onCreateTicket={() => handleNavigate('create')}
            onSelectTicket={handleOpenTicket}
            onViewAllTickets={() => handleNavigate('tickets')}
            onRefresh={fetchDashboard}
          />
        )}

        {!loadingDetail && activeView === 'create' && (
          <CreateTicketView
            onCancel={() => handleNavigate('tickets')}
            onCreated={handleTicketCreated}
          />
        )}

        {!loadingDetail && activeView === 'detail' && selectedDetail && (
          <TicketDetailView
            detail={selectedDetail}
            initialAiError={detailAiError}
            onBack={() => handleNavigate('tickets')}
            onUpdated={handleDetailUpdated}
          />
        )}

        {!loadingDetail && activeView === 'kb' && <KnowledgeBaseView />}

        {!loadingDetail && activeView === 'guide' && <AcademicGuideView />}

        {!loadingDetail && activeView === 'about' && <AboutView />}
      </main>

      <footer className="border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-[1360px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Soportech Vzla · Helpdesk SPA — Caso de Estudio Académico · UNETI (Inteligencia Artificial)
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('kb')}
              className="hover:text-[#0B2A5B] transition-colors"
            >
              Base de Conocimientos
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('guide')}
              className="hover:text-[#0B2A5B] transition-colors"
            >
              Guía Académica
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('about')}
              className="hover:text-[#0B2A5B] transition-colors"
            >
              Acerca de...
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
