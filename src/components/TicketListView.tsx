import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import {
  CATEGORIES,
  ORGANIZATIONAL_UNITS,
  type Ticket,
  type TicketStatus,
} from '../types/helpdesk';
import { TicketPriorityText, TicketStatusIndicator } from './StatusText';

interface TicketListViewProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  onSelectTicket,
  onCreateTicket,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<'Todos' | TicketStatus>('Todos');
  const [category, setCategory] = useState('Todas');
  const [department, setDepartment] = useState('Todos');
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== 'Todos') params.set('status', status);
      if (category !== 'Todas') params.set('category', category);
      if (department !== 'Todos') params.set('department', department);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando tickets');
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTickets();
    }, 120);
    return () => clearTimeout(t);
  }, [status, category, department, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
            Registro General de Tickets
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Historial completo de incidentes y requerimientos persistidos en SQLite local.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTicket}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nuevo Ticket</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['Todos', 'Abierto', 'En Atención', 'Escalado a Humano', 'Resuelto'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  status === st
                    ? 'bg-white text-[#0B2A5B] shadow-xs'
                    : 'text-slate-600 hover:text-[#0B2A5B]'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar código, asunto o usuario..."
              aria-label="Buscar tickets"
              className="pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED] w-60"
            />
          </div>

          <select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por unidad organizativa"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
          >
            <option value="Todos">Todos los departamentos</option>
            {ORGANIZATIONAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Tickets Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">Código</th>
                <th className="py-3 px-4">Asunto / Clasificación</th>
                <th className="py-3 px-4 whitespace-nowrap">Reportado por</th>
                <th className="py-3 px-4 whitespace-nowrap">Prioridad</th>
                <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                <th className="py-3 px-4 whitespace-nowrap text-center">Calificación</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-5 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                    No se encontraron casos registrados con los filtros actuales.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1D63ED] whitespace-nowrap tabular-nums">
                      <span className="inline-flex items-center gap-1 group-hover:underline">
                        {t.ticket_code}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-medium text-[#0B2A5B] truncate">{t.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {t.category} · {t.subcategory} · {t.ticket_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{t.reporter_name}</div>
                      <div className="text-xs text-slate-500">{t.department}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <TicketPriorityText priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <TicketStatusIndicator status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {t.rating ? `${t.rating} / 5 ★` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap tabular-nums">
                      {t.created_at}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
