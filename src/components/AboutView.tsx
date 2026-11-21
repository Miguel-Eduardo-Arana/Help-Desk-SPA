import React from 'react';
import { BookOpen, GraduationCap, Users } from 'lucide-react';

export const AboutView: React.FC = () => {
  const authors = [
    {
      name: 'Danyelith Castañeda',
      ci: 'C.I. 27.703.232',
      role: 'Coautora · Desarrollo e Integración',
    },
    {
      name: 'Miguel Eduardo Arana',
      ci: 'C.I. 6.914.378',
      role: 'Coautor · Arquitectura y Base de Datos',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Official UNETI Institutional Header Banner */}
      <section className="border border-slate-200 rounded-xl bg-white p-5 sm:p-6 shadow-sm flex flex-col items-center gap-4">
        <img
          src="/assets/aistudio/header_uneti_62e793bc.png"
          alt="Ministerio del Poder Popular para la Educación Universitaria - UNETI"
          className="w-full max-w-4xl h-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Main About Card */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-200">
          <img
            src="/assets/aistudio/logo_helpdesk_spa_peq_f26b7f94.png"
            alt="Logo Helpdesk SPA"
            className="h-24 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#059669]">
              Proyecto Académico · Caso de Estudio Local
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
              Acerca de Soportech Vzla — Helpdesk SPA
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aplicación web tipo Single Page Application orientada a la gestión inteligente de
              mesa de ayuda y soporte técnico TI corporativo, con almacenamiento local en SQLite,
              asistencia conversacional AgentDesk y transcripción de voz.
            </p>
          </div>
        </div>

        {/* Academic Course & Instructor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#1D63ED]/10 text-[#1D63ED] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Unidad Curricular</p>
              <p className="font-display text-lg font-bold text-[#0B2A5B] mt-0.5">
                Inteligencia Artificial
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Docente a cargo</p>
              <p className="font-display text-lg font-bold text-[#0B2A5B] mt-0.5">
                Ivannie Blanco
              </p>
            </div>
          </div>
        </div>

        {/* Authors Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B2A5B]">
            <Users className="w-4 h-4 text-[#1D63ED]" aria-hidden="true" />
            <span>Autores del Proyecto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {authors.map((author) => (
              <div
                key={author.ci}
                className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between gap-2"
              >
                <div>
                  <h2 className="font-display text-lg font-bold text-[#0B2A5B]">
                    {author.name}
                  </h2>
                  <p className="font-mono text-sm font-semibold text-[#1D63ED] mt-0.5 tabular-nums">
                    {author.ci}
                  </p>
                </div>
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {author.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
