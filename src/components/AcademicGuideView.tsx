import React from 'react';
import { TAXONOMY_CATALOG } from '../types/helpdesk';

export const AcademicGuideView: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Plataforma de Desarrollo Web (SPA)',
      detail:
        'Interfaz Single Page Application construida con HTML, CSS (Tailwind) y TypeScript/JavaScript modular, diseñada bajo el esquema cromático institucional de Soportech Vzla (blanco neutro, azul marino #0B2A5B, azul eléctrico #1D63ED y verde tecnológico #059669).',
    },
    {
      num: '02',
      title: 'Agente IA (AgentDesk) y NLP',
      detail:
        'Integración de procesamiento de lenguaje natural mediante el SDK oficial en servidor (@google/genai) conectado a la Base de Conocimientos local para generar diagnósticos y soluciones automáticas sin entrenar un modelo desde cero.',
    },
    {
      num: '03',
      title: 'Servidor de Pruebas y Persistencia SQLite',
      detail:
        'Ejecución local autosuficiente en Express + SQLite (soportech.db) sin infraestructura externa compleja. Persiste tickets, métricas de atención/resolución, historial de conversación, escalamiento a humano y calificaciones CSAT de 5 estrellas.',
    },
    {
      num: '04',
      title: 'Documentación y Evaluación Académica',
      detail:
        'Repositorio listo para descarga, revisión y ejecución local en Visual Studio Code mediante npm install y npm run dev, incluyendo matriz de tipificación ITIL completa.',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-medium text-[#059669] mb-1">
          Caso de Estudio Académico · Arquitectura y Tipificación ITIL
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
          Guía de Implementación y Matriz de Soporte
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Resumen técnico de la solución local para revisión docente: herramientas empleadas,
          arquitectura SPA + SQLite y catálogo completo de clasificación de incidentes.
        </p>
      </div>

      {/* 4 Implementation Steps + Reference Diagram */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col gap-2"
            >
              <span className="font-mono text-xs font-semibold text-[#1D63ED]">
                Paso {s.num}
              </span>
              <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
                {s.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between gap-3">
          <img
            src="/assets/aistudio/image_069125a2.png"
            alt="Diagrama de Herramientas y Recursos de Implementación"
            className="w-full h-auto rounded-lg border border-slate-200 object-contain bg-white"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs text-slate-500">
            Esquema de referencia académica (Pasos 1 al 4): Desarrollo web, API de IA NLP,
            servidor local de pruebas y documentación técnica.
          </p>
        </div>
      </section>

      {/* Reference ITIL Taxonomy Table */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#0B2A5B]">
            Cuadro de Referencia de Tipificación de Casos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación utilizada en el formulario de reporte y por AgentDesk para el enrutamiento.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Categoría</th>
                  <th className="py-3 px-4 whitespace-nowrap">Subcategoría</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Prioridad sugerida</th>
                  <th className="py-3 px-4">Ejemplo de ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {TAXONOMY_CATALOG.map((row) => (
                  <tr key={`${row.category}-${row.subcategory}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-[#0B2A5B] whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {row.subcategory}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{row.type}</td>
                    <td className="py-3 px-4 font-medium text-[#1D63ED] whitespace-nowrap">
                      {row.suggestedPriority}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
