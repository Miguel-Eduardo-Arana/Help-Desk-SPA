import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Headset,
  Loader2,
  RefreshCw,
  Send,
  Star,
  User,
} from 'lucide-react';
import {
  RATING_LABELS,
  type TicketDetailResponse,
} from '../types/helpdesk';
import { TicketPriorityText, TicketStatusIndicator } from './StatusText';

interface TicketDetailViewProps {
  detail: TicketDetailResponse;
  initialAiError?: string | null;
  onBack: () => void;
  onUpdated: (updated: TicketDetailResponse) => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  detail,
  initialAiError = null,
  onBack,
  onUpdated,
}) => {
  const { ticket, messages, kbArticle, parsedSuggestion } = detail;

  const [aiError, setAiError] = useState<string | null>(initialAiError);
  const [analyzing, setAnalyzing] = useState(false);

  const [followUp, setFollowUp] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [showEscalateBox, setShowEscalateBox] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [escalating, setEscalating] = useState(false);

  const [showRatingBox, setShowRatingBox] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [resolving, setResolving] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const refreshDetail = async () => {
    const res = await fetch(`/api/tickets/${ticket.id}`);
    if (res.ok) {
      const data = (await res.json()) as TicketDetailResponse;
      onUpdated(data);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error consultando AgentDesk');
      }
      onUpdated(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error consultando AgentDesk');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp.trim()) return;
    setSendingMsg(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: followUp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mensaje');
      setFollowUp('');
      if (data.aiError) {
        setAiError(data.aiError);
      }
      await refreshDetail();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error enviando mensaje');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: escalationNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error escalando el caso');
      setShowEscalateBox(false);
      setEscalationNotes('');
      setActionFeedback('El ticket ha sido escalado a un agente humano de soporte técnico.');
      await refreshDetail();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al escalar');
    } finally {
      setEscalating(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          rating_comment: ratingComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar el ticket');
      setShowRatingBox(false);
      setActionFeedback('Caso cerrado y calificación registrada en SQLite.');
      await refreshDetail();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error cerrando el ticket');
    } finally {
      setResolving(false);
    }
  };

  const activeStarValue = hoveredRating ?? selectedRating;
  const isClosed = ticket.status === 'Resuelto';

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="pb-6 border-b border-slate-200 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0B2A5B]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Volver a Tickets</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="font-mono font-semibold text-[#1D63ED]">
                {ticket.ticket_code}
              </span>
              <span aria-hidden="true">·</span>
              <TicketStatusIndicator status={ticket.status} />
              <span aria-hidden="true">·</span>
              <TicketPriorityText priority={ticket.priority} />
              <span aria-hidden="true">·</span>
              <span>{ticket.ticket_type}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{ticket.created_at}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
              {ticket.subject}
            </h1>

            <p className="text-xs text-slate-600">
              Reportado por <strong className="text-[#0B2A5B]">{ticket.reporter_name}</strong> (
              {ticket.reporter_email}) · Unidad: <strong>{ticket.department}</strong> ·{' '}
              {ticket.category} / {ticket.subcategory}
            </p>
          </div>

          {/* Primary Ticket Actions */}
          {!isClosed && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {ticket.status !== 'Escalado a Humano' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEscalateBox((prev) => !prev);
                    setShowRatingBox(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0B2A5B] bg-white border border-slate-300 hover:border-[#0B2A5B] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Headset className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
                  <span>Escalar a un agente de Soporte (humano)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRatingBox((prev) => !prev);
                  setShowEscalateBox(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Cerrar Caso y Calificar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 border border-emerald-200 bg-emerald-50/70 rounded-xl text-sm text-[#065F46]">
          {actionFeedback}
        </div>
      )}

      {aiError && (
        <div className="p-4 border border-amber-200 bg-amber-50/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-amber-900">
            <strong className="font-semibold">Aviso de AgentDesk: </strong>
            {aiError}
          </div>
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B2A5B] hover:bg-[#1D63ED] rounded-lg shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>Reintentar análisis</span>
          </button>
        </div>
      )}

      {/* Escalate to Human Drawer */}
      {showEscalateBox && !isClosed && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
                Escalar a un Agente de Soporte Humano
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Si la solución automática no resolvió el problema o requiere revisión presencial,
                envíe una nota para el equipo de Soporte Nivel 2.
              </p>
            </div>
          </div>
          <textarea
            rows={2}
            value={escalationNotes}
            onChange={(e) => setEscalationNotes(e.target.value)}
            placeholder="Detalle opcional para el especialista humano (ej. ya reinicié el equipo pero persiste el error de pantalla azul)..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEscalateBox(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0B2A5B]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#B45309] hover:bg-[#92400E] rounded-lg transition-colors"
            >
              {escalating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirmar Escalamiento a Humano</span>
            </button>
          </div>
        </div>
      )}

      {/* 5-Star Resolution Rating Form */}
      {showRatingBox && !isClosed && (
        <form
          onSubmit={handleResolveSubmit}
          className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
              Califique la Solución Propuesta (Escala 1 a 5 Estrellas)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              1 = Sin solución · 3 = Medianamente satisfactoria · 5 = Satisfactorio / Resuelto
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Calificación de solución">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeStarValue;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    aria-label={`${star} estrellas: ${RATING_LABELS[star]}`}
                    className="p-1.5 rounded-lg hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D63ED]"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        filled
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-sm font-semibold text-[#0B2A5B]">
              {activeStarValue} / 5 — {RATING_LABELS[activeStarValue]}
            </span>
          </div>

          <div>
            <label htmlFor="rating-comment" className="block text-xs font-medium text-slate-700 mb-1.5">
              Comentario de cierre (opcional)
            </label>
            <input
              id="rating-comment"
              type="text"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Ej. Los pasos de AgentDesk solucionaron el problema rápidamente."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowRatingBox(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0B2A5B]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={resolving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors"
            >
              {resolving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Cierre del Caso</span>
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Resolution Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: AgentDesk Solution + Conversation Thread */}
        <div className="lg:col-span-8 space-y-6">
          {/* AgentDesk Solution Panel */}
          <section className="border border-slate-200 rounded-xl p-6 bg-white space-y-5">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1D63ED]/10 text-[#1D63ED] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
                    Solución Sugerida por AgentDesk
                  </h2>
                  <p className="text-xs text-slate-500">
                    {parsedSuggestion?.confidenceLabel ?? 'Pendiente de análisis'}
                  </p>
                </div>
              </div>

              {!isClosed && (
                <button
                  type="button"
                  onClick={handleReanalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0B2A5B] border border-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  <span>Regenerar</span>
                </button>
              )}
            </div>

            {parsedSuggestion ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-1">
                    Diagnóstico preliminar
                  </h3>
                  <p className="text-sm text-[#0B2A5B] leading-relaxed">
                    {parsedSuggestion.diagnosis}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">
                    Pasos de solución recomendados
                  </h3>
                  <ol className="space-y-2.5">
                    {parsedSuggestion.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed"
                      >
                        <span className="font-mono text-xs font-semibold text-[#1D63ED] bg-blue-50 w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    <strong className="text-[#059669]">Recomendación preventiva: </strong>
                    {parsedSuggestion.preventiveTip}
                  </span>
                </div>

                {parsedSuggestion.suggestEscalation && !isClosed && ticket.status !== 'Escalado a Humano' && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between gap-4 text-xs text-amber-900">
                    <span>
                      AgentDesk detecta que este incidente podría requerir atención técnica
                      presencial o privilegios administrativos.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEscalateBox(true)}
                      className="font-semibold underline whitespace-nowrap shrink-0"
                    >
                      Escalar ahora
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  No hay una sugerencia automática registrada para este caso todavía.
                </p>
                <button
                  type="button"
                  onClick={handleReanalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] rounded-lg"
                >
                  {analyzing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Consultar Base de Conocimientos con AgentDesk</span>
                </button>
              </div>
            )}
          </section>

          {/* Ticket Conversation Thread */}
          <section className="border border-slate-200 rounded-xl p-6 bg-white space-y-5">
            <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
              Bitácora de Atención y Seguimiento
            </h2>

            <div className="space-y-4">
              {messages.map((msg) => {
                const isAgent = msg.sender_role === 'agent';
                const isHuman = msg.sender_role === 'human_support';
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border ${
                      isAgent
                        ? 'bg-slate-50/80 border-slate-200'
                        : isHuman
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B2A5B]">
                        {isAgent ? (
                          <Bot className="w-3.5 h-3.5 text-[#1D63ED]" aria-hidden="true" />
                        ) : isHuman ? (
                          <Headset className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        )}
                        <span>{msg.sender_name}</span>
                      </span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {msg.created_at}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>

            {!isClosed && (
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2.5">
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Escriba una duda adicional o resultado de los pasos para AgentDesk..."
                  className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !followUp.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {sendingMsg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Enviar</span>
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Right: Ticket Metadata, Closed Rating Summary, & Linked KB Article */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Closed Rating Card */}
          {isClosed && ticket.rating && (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#059669]">
                  Evaluación de Cierre
                </span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {ticket.resolved_at}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (ticket.rating ?? 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-[#0B2A5B]">
                  {ticket.rating} / 5 ({RATING_LABELS[ticket.rating]})
                </span>
              </div>
              {ticket.rating_comment && (
                <p className="text-xs text-slate-600 italic">“{ticket.rating_comment}”</p>
              )}
            </div>
          )}

          {/* Ticket SLA Metadata */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 space-y-3.5">
            <h2 className="font-display text-sm font-semibold text-[#0B2A5B]">
              Trazabilidad del Ticket
            </h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Código único</dt>
                <dd className="font-mono font-semibold text-[#0B2A5B]">{ticket.ticket_code}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Creación</dt>
                <dd className="font-mono text-slate-700 tabular-nums">{ticket.created_at}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Primera atención</dt>
                <dd className="font-mono text-slate-700 tabular-nums">
                  {ticket.first_response_at ?? 'Pendiente'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Resolución</dt>
                <dd className="font-mono text-slate-700 tabular-nums">
                  {ticket.resolved_at ?? 'En curso'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Escalamiento humano</dt>
                <dd className="font-medium text-slate-700">
                  {ticket.escalated_to_human ? 'Sí (Nivel 2)' : 'No requerido'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Linked Knowledge Base Article */}
          {kbArticle && (
            <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Base de Conocimientos · {kbArticle.code}</span>
              </div>
              <h3 className="font-display text-sm font-semibold text-[#0B2A5B]">
                {kbArticle.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{kbArticle.symptoms}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
