import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mic, Send, Square, X } from 'lucide-react';
import {
  CATEGORIES,
  ORGANIZATIONAL_UNITS,
  TAXONOMY_CATALOG,
  type TicketDetailResponse,
  type TicketPriority,
} from '../types/helpdesk';

interface CreateTicketViewProps {
  onCancel: () => void;
  onCreated: (detail: TicketDetailResponse & { aiError?: string | null }) => void;
}

export const CreateTicketView: React.FC<CreateTicketViewProps> = ({
  onCancel,
  onCreated,
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [department, setDepartment] = useState(ORGANIZATIONAL_UNITS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);

  const subcategories = useMemo(
    () => TAXONOMY_CATALOG.filter((item) => item.category === category),
    [category]
  );

  const [subcategory, setSubcategory] = useState(subcategories[0]?.subcategory ?? '');
  const selectedTaxonomy = useMemo(
    () =>
      TAXONOMY_CATALOG.find(
        (item) => item.category === category && item.subcategory === subcategory
      ) ?? subcategories[0],
    [category, subcategory, subcategories]
  );

  const [priority, setPriority] = useState<TicketPriority>(
    selectedTaxonomy?.suggestedPriority ?? 'Media'
  );
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRecordingRef = useRef(false);

  const [nowClock, setNowClock] = useState(() =>
    new Date().toLocaleString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNowClock(
        new Date().toLocaleString('es-VE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        cancelRecordingRef.current = true;
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopTracksAndTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const formatTimer = (sec: number) => {
    const mins = String(Math.floor(sec / 60)).padStart(2, '0');
    const secs = String(sec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de audio grabado.'));
      reader.readAsDataURL(blob);
    });

  const handleStartRecording = async () => {
    setVoiceError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('Su navegador no soporta grabación de micrófono.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedType = preferredTypes.find((type) =>
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)
      );

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      cancelRecordingRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopTracksAndTimer();
        setIsRecording(false);

        if (cancelRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size < 256) {
          setVoiceError('La grabación fue demasiado corta. Intente hablar unos segundos.');
          return;
        }

        setTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Error al transcribir el audio.');
          }
          const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
          if (transcript) {
            setDescription((prev) => (prev.trim() ? `${prev.trim()}\n${transcript}` : transcript));
          }
        } catch (err) {
          setVoiceError(
            err instanceof Error ? err.message : 'No se pudo transcribir la nota de voz.'
          );
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      stopTracksAndTimer();
      setVoiceError(
        'No se pudo acceder al micrófono. Verifique los permisos del navegador.'
      );
    }
  };

  const handleStopAndTranscribe = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      cancelRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      stopTracksAndTimer();
      setIsRecording(false);
    }
  };

  const handleCategoryChange = (nextCat: string) => {
    setCategory(nextCat);
    const firstSub = TAXONOMY_CATALOG.find((t) => t.category === nextCat);
    if (firstSub) {
      setSubcategory(firstSub.subcategory);
      setPriority(firstSub.suggestedPriority);
    }
  };

  const handleSubcategoryChange = (nextSub: string) => {
    setSubcategory(nextSub);
    const match = TAXONOMY_CATALOG.find(
      (t) => t.category === category && t.subcategory === nextSub
    );
    if (match) {
      setPriority(match.suggestedPriority);
    }
  };

  const handleFillExample = () => {
    if (!selectedTaxonomy) return;
    if (!reporterName.trim()) setReporterName('Luisana Bolívar');
    if (!reporterEmail.trim()) setReporterEmail('l.bolivar@soportech.ve');
    setSubject(selectedTaxonomy.example);
    setDescription(
      `Reporto la siguiente situación en el área de ${department}: ${selectedTaxonomy.example}. Agradezco asistencia de AgentDesk para verificar los pasos de diagnóstico.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          department,
          category,
          subcategory,
          ticket_type: selectedTaxonomy?.type ?? 'Incidencia',
          priority,
          subject,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar el ticket.');
      }
      onCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0B2A5B] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver al Panel de Estadísticas</span>
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
            Registrar Caso o Reportar Falla
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Al registrar el ticket se asignará un código único y AgentDesk consultará la Base de
            Conocimientos para sugerirle una solución inmediata.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillExample}
          className="px-3.5 py-2 text-xs font-medium text-[#1D63ED] border border-[#1D63ED]/30 bg-blue-50/40 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Autocompletar ejemplo según categoría
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 border border-slate-200 rounded-xl p-6 sm:p-8 bg-white space-y-6"
        >
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="reporter-name"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Usuario que reporta
              </label>
              <input
                id="reporter-name"
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Ej. María Fernanda Torres"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
              />
            </div>

            <div>
              <label
                htmlFor="reporter-email"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Correo corporativo
              </label>
              <input
                id="reporter-email"
                type="email"
                required
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="nombre.apellido@empresa.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="department"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Unidad organizativa o departamento
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1D63ED]"
              >
                {ORGANIZATIONAL_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Prioridad del ticket
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1D63ED]"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Categoría del caso
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1D63ED]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subcategory"
                className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
              >
                Subcategoría específica
              </label>
              <select
                id="subcategory"
                value={subcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1D63ED]"
              >
                {subcategories.map((sub) => (
                  <option key={sub.subcategory} value={sub.subcategory}>
                    {sub.subcategory}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-xs font-semibold text-[#0B2A5B] mb-1.5"
            >
              Asunto o resumen de la falla
            </label>
            <input
              id="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describa brevemente el incidente o solicitud"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-[#0B2A5B]"
              >
                Descripción detallada
              </label>

              <div className="flex items-center gap-2">
                {!isRecording && !transcribing && (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#1D63ED] border border-[#1D63ED]/30 bg-blue-50/50 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Grabar voz y transcribir</span>
                  </button>
                )}

                {isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#DC2626] tabular-nums">
                      Grabando {formatTimer(recordingSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={handleStopAndTranscribe}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#DC2626] hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Square className="w-3 h-3 fill-white" aria-hidden="true" />
                      <span>Detener y transcribir</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      aria-label="Cancelar grabación"
                      className="p-1 text-slate-500 hover:text-[#0B2A5B] rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {transcribing && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669] whitespace-nowrap">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Transcribiendo audio a texto...</span>
                  </span>
                )}
              </div>
            </div>

            {voiceError && (
              <p className="text-xs text-red-700 mb-2">{voiceError}</p>
            )}

            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Indique mensajes de error, equipo afectado, desde cuándo ocurre o utilice el botón 'Grabar voz y transcribir' para dictar su reporte..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B2A5B] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] disabled:opacity-60 rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Registrando ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Registrar Ticket y Solicitar Solución</span>
                </>
              )}
            </button>
          </div>
          {submitting && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-sm text-amber-800"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              AgentDesk puede estar ocupado. Esperaremos y reintentaremos automáticamente hasta 3
              veces.
            </p>
          )}
        </form>

        {/* Right Metadata & Classification Preview Column */}
        <aside className="lg:col-span-4 border border-slate-200 rounded-xl p-6 bg-slate-50/70 space-y-5">
          <div>
            <h2 className="font-display text-sm font-semibold text-[#0B2A5B]">
              Ficha de Tipificación Automática
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generada conforme a la matriz ITIL de Soportech Vzla.
            </p>
          </div>

          <dl className="space-y-3.5 text-xs border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Identificador asignado</dt>
              <dd className="font-mono font-semibold text-[#1D63ED]">STV-2026-AUTO</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Fecha y hora de registro</dt>
              <dd className="font-mono text-[#0B2A5B] tabular-nums">{nowClock}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Tipo de caso</dt>
              <dd className="font-semibold text-[#0B2A5B]">
                {selectedTaxonomy?.type ?? 'Incidencia'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Prioridad sugerida</dt>
              <dd className="font-semibold text-[#059669]">
                {selectedTaxonomy?.suggestedPriority ?? 'Media'}
              </dd>
            </div>
          </dl>

          {selectedTaxonomy && (
            <div className="pt-4 border-t border-slate-200 space-y-1.5">
              <p className="text-xs font-semibold text-[#0B2A5B]">
                Caso de referencia en esta subcategoría
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedTaxonomy.example}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-1.5">
            <p className="text-xs font-semibold text-[#059669]">
              Resolución con AgentDesk + SQLite
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              El ticket se guardará en la base de datos SQLite local y AgentDesk buscará
              procedimientos verificados para responder en segundos. Si el problema persiste,
              podrá escalarlo a un agente humano con un clic.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
