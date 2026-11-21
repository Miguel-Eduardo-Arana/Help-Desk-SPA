import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import type { DashboardStats, Ticket, TicketStatus } from '../types/helpdesk';
import { TicketPriorityText, TicketStatusIndicator } from './StatusText';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  onCreateTicket: () => void;
  onSelectTicket: (ticketId: number) => void;
  onViewAllTickets: () => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  error,
  onCreateTicket,
  onSelectTicket,
  onViewAllTickets,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<'Todos' | TicketStatus>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecent = useMemo(() => {
    if (!stats) return [];
    return stats.recentTickets.filter((t: Ticket) => {
      const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.ticket_code.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.reporter_name.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [stats, statusFilter, searchQuery]);

  if (loading && !stats) {
    return (
      <div className="space-y-8" aria-busy="true">
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50/60 rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-red-900">
            No se pudieron cargar las estadísticas de soporte
          </h2>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0B2A5B] rounded-lg hover:bg-[#1D63ED] transition-colors shrink-0"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const kpiCards = [
    {
      label: 'Casos reportados',
      value: String(stats.totalTickets),
      subtext: 'Total histórico en SQLite',
      accent: 'text-[#0B2A5B]',
    },
    {
      label: 'Casos resueltos',
      value: String(stats.resolvedTickets),
      subtext: `${stats.resolutionRate}% tasa de cierre`,
      accent: 'text-[#059669]',
    },
    {
      label: 'Casos abiertos o pendientes',
      value: String(stats.openTickets),
      subtext: `${stats.escalatedTickets} escalados a humano`,
      accent: 'text-[#1D63ED]',
    },
    {
      label: 'Tiempo promedio de atención',
      value: `${stats.avgAttentionMinutes} min`,
      subtext: 'Primera respuesta AgentDesk',
      accent: 'text-[#0B2A5B]',
    },
    {
      label: 'Tiempo promedio de resolución',
      value: `${stats.avgResolutionMinutes} min`,
      subtext:
        stats.avgRating !== null
          ? `Satisfacción: ${stats.avgRating} / 5 (${stats.ratedCount} eval.)`
          : 'Sin evaluaciones aún',
      accent: 'text-[#059669]',
    },
  ];

  const maxCatTotal = Math.max(1, ...stats.byCategory.map((c) => c.total));
  const maxDeptTotal = Math.max(1, ...stats.byDepartment.map((d) => d.total));

  return (
    <div className="space-y-10">
      {/* Page Hero / Summary Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 max-w-3xl">
          <img
            src="/assets/aistudio/logo_helpdesk_spa_peq_f26b7f94.png"
            alt="Emblema Helpdesk SPA"
            className="h-24 w-auto sm:h-28 object-contain rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#059669]">
              Mesa de Ayuda TI · Base de Conocimientos AgentDesk · SQLite Local
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B2A5B] [text-wrap:balance]">
              Panel de Estadísticas de Soporte Técnico
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Supervise los tiempos de respuesta y resolución de incidencias de usuarios y equipos,
              con diagnóstico asistido y escalamiento directo a soporte humano.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCreateTicket}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1D63ED]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Crear caso o reportar falla</span>
          </button>
        </div>
      </section>

      {/* 5 Core KPI Strip */}
      <section aria-label="Indicadores clave de soporte">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center gap-2.5"
            >
              <span className="text-xs font-medium text-slate-600">{kpi.label}</span>
              <span
                className={`font-display text-3xl font-bold tracking-tight tabular-nums ${kpi.accent}`}
              >
                {kpi.value}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">{kpi.subtext}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Analytical Breakdowns: Category & Department + Satisfaction */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-slate-200 rounded-xl p-6 bg-white shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
                Distribución por Categoría ITIL
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Casos reportados frente a casos resueltos por área técnica
              </p>
            </div>
          </div>

          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Aún no hay casos clasificados por categoría.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.byCategory.map((item) => {
                const widthPct = Math.round((item.total / maxCatTotal) * 100);
                const resolvedPct = Math.round((item.resolved / Math.max(1, item.total)) * 100);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#0B2A5B]">{item.category}</span>
                      <span className="text-slate-600 font-mono tabular-nums">
                        {item.resolved}/{item.total} resueltos ({resolvedPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D63ED] rounded-full transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 border border-slate-200 rounded-xl p-6 bg-slate-50/60 shadow-md flex flex-col justify-between gap-6">
          <div>
            <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
              Demanda por Unidad Organizativa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Departamentos con mayor volumen de solicitudes
            </p>

            <div className="mt-5 space-y-3.5">
              {stats.byDepartment.slice(0, 5).map((dept) => {
                const pct = Math.round((dept.total / maxDeptTotal) * 100);
                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate pr-4">
                        {dept.department}
                      </span>
                      <span className="font-mono tabular-nums text-[#0B2A5B] font-semibold">
                        {dept.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#059669] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Calificación promedio (CSAT)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Escala de 1 (sin solución) a 5 (resuelto)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
              <span className="font-display text-2xl font-bold text-[#0B2A5B] tabular-nums">
                {stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 5.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tickets Table */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B2A5B]">
              Solicitudes y Casos Recientes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seleccione cualquier ticket para revisar la solución de AgentDesk, escalar o calificar el cierre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ID, usuario o asunto..."
                aria-label="Buscar casos recientes"
                className="pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1D63ED] w-64"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['Todos', 'En Atención', 'Escalado a Humano', 'Resuelto'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === tab
                        ? 'bg-white text-[#0B2A5B] shadow-xs'
                        : 'text-slate-600 hover:text-[#0B2A5B]'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Ticket</th>
                  <th className="py-3 px-4">Asunto y Categoría</th>
                  <th className="py-3 px-4 whitespace-nowrap">Usuario / Unidad</th>
                  <th className="py-3 px-4 whitespace-nowrap">Prioridad</th>
                  <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Fecha de reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <p className="text-sm text-slate-600">
                        No hay tickets que coincidan con el filtro seleccionado.
                      </p>
                      <button
                        type="button"
                        onClick={onCreateTicket}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D63ED] hover:underline"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Reportar nuevo caso</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRecent.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1D63ED] whitespace-nowrap tabular-nums">
                        <span className="inline-flex items-center gap-1 group-hover:underline">
                          {ticket.ticket_code}
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-medium text-[#0B2A5B] truncate">
                          {ticket.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {ticket.category} · {ticket.subcategory} · {ticket.ticket_type}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{ticket.reporter_name}</div>
                        <div className="text-xs text-slate-500">{ticket.department}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TicketPriorityText priority={ticket.priority} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TicketStatusIndicator status={ticket.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 text-right whitespace-nowrap tabular-nums">
                        {ticket.created_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Mostrando {filteredRecent.length} registros recientes</span>
            <button
              type="button"
              onClick={onViewAllTickets}
              className="font-semibold text-[#1D63ED] hover:text-[#0B2A5B] transition-colors"
            >
              Ver historial completo de tickets →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
