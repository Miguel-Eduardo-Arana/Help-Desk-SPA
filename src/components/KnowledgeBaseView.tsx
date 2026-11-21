import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  TAXONOMY_CATALOG,
  type KnowledgeBaseArticle,
} from '../types/helpdesk';

export const KnowledgeBaseView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [selected, setSelected] = useState<KnowledgeBaseArticle | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const subOptions = useMemo(
    () => TAXONOMY_CATALOG.filter((t) => t.category === newCategory),
    [newCategory]
  );
  const [newSubcategory, setNewSubcategory] = useState(subOptions[0]?.subcategory ?? '');
  const [newTitle, setNewTitle] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'Todas') params.set('category', category);
      const res = await fetch(`/api/kb?${params.toString()}`);
      const data = (await res.json()) as KnowledgeBaseArticle[];
      setArticles(data);
      if (data.length > 0 && (!selected || !data.some((a) => a.id === selected.id))) {
        setSelected(data[0]);
      } else if (data.length === 0) {
        setSelected(null);
      }
    } catch {
      setError('No se pudo cargar la Base de Conocimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchArticles();
    }, 120);
    return () => clearTimeout(t);
  }, [query, category]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          subcategory: newSubcategory,
          title: newTitle,
          symptoms: newSymptoms,
          solution_steps: newSteps,
          keywords: newKeywords,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Error guardando artículo');
      setShowCreate(false);
      setNewTitle('');
      setNewSymptoms('');
      setNewSteps('');
      setNewKeywords('');
      await fetchArticles();
      setSelected(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar artículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelected(null);
        await fetchArticles();
      }
    } catch {
      setError('No se pudo eliminar el artículo.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2A5B]">
            Base de Conocimientos Técnica
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Procedimientos almacenados en SQLite que AgentDesk utiliza para diagnosticar y
            resolver incidentes de usuarios y equipos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1D63ED] hover:bg-[#0B2A5B] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{showCreate ? 'Cerrar formulario' : 'Agregar Artículo Técnico'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="border border-slate-200 rounded-xl p-6 bg-slate-50/70 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-[#0B2A5B]">
            Nuevo Procedimiento de Soporte para AgentDesk
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">Categoría</label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setNewCategory(cat);
                  const first = TAXONOMY_CATALOG.find((t) => t.category === cat);
                  if (first) setNewSubcategory(first.subcategory);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">
                Subcategoría
              </label>
              <select
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
              >
                {subOptions.map((s) => (
                  <option key={s.subcategory} value={s.subcategory}>
                    {s.subcategory}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">
              Título del procedimiento
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej. Configuración de firma electrónica en cliente de correo"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">
              Síntomas comunes
            </label>
            <input
              type="text"
              required
              value={newSymptoms}
              onChange={(e) => setNewSymptoms(e.target.value)}
              placeholder="Describa cuándo aplica esta guía..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">
              Pasos de solución (uno por línea)
            </label>
            <textarea
              required
              rows={4}
              value={newSteps}
              onChange={(e) => setNewSteps(e.target.value)}
              placeholder="1. Abra Configuración...&#10;2. Verifique..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2A5B] mb-1">
              Palabras clave (separadas por coma)
            </label>
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="firma, correo, outlook, certificado"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg"
            >
              {saving ? 'Guardando...' : 'Guardar en SQLite'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar solución, síntoma o palabra clave..."
            aria-label="Buscar en base de conocimientos"
            className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED] w-full sm:w-80"
          />
        </div>

        <select
          aria-label="Filtrar artículos por categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1D63ED]"
        >
          <option value="Todas">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Master-Detail Knowledge Base Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No se encontraron artículos que coincidan con la búsqueda.
            </div>
          ) : (
            articles.map((art) => {
              const isSelected = selected?.id === art.id;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setSelected(art)}
                  className={`w-full text-left p-4 transition-colors ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-[#1D63ED]">{art.code}</span>
                    <span>{art.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0B2A5B] leading-snug">
                    {art.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 truncate">{art.subcategory}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7 border border-slate-200 rounded-xl p-6 sm:p-8 bg-white min-h-[380px]">
          {selected ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                    <span className="font-mono font-semibold text-[#1D63ED]">
                      {selected.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selected.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selected.subcategory}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#0B2A5B]">
                    {selected.title}
                  </h2>
                </div>

                {selected.code.startsWith('KB-USR-') && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selected.id)}
                    title="Eliminar artículo personalizado"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1.5">
                  Síntomas y contexto del problema
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{selected.symptoms}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Procedimiento de resolución paso a paso
                </h3>
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-[#0B2A5B] whitespace-pre-line leading-relaxed">
                  {selected.solution_steps}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Palabras clave: {selected.keywords}</span>
                <span className="font-mono tabular-nums">Actualizado: {selected.updated_at}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 py-16">
              Seleccione un artículo de la lista para visualizar su procedimiento técnico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
