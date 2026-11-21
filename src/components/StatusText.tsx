import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Headset,
} from 'lucide-react';
import type { TicketPriority, TicketStatus } from '../types/helpdesk';

export const TicketStatusIndicator: React.FC<{ status: TicketStatus }> = ({ status }) => {
  switch (status) {
    case 'Resuelto':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Resuelto</span>
        </span>
      );
    case 'Escalado a Humano':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309] whitespace-nowrap">
          <Headset className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Escalado a Humano</span>
        </span>
      );
    case 'En Atención':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D63ED] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>En Atención</span>
        </span>
      );
    case 'Abierto':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Abierto</span>
        </span>
      );
  }
};

export const TicketPriorityText: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const colorMap: Record<TicketPriority, string> = {
    Crítica: 'text-[#DC2626] font-semibold',
    Alta: 'text-[#B45309] font-semibold',
    Media: 'text-[#0B2A5B] font-medium',
    Baja: 'text-slate-600 font-normal',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs whitespace-nowrap ${colorMap[priority]}`}>
      {priority === 'Crítica' && (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>{priority}</span>
    </span>
  );
};
