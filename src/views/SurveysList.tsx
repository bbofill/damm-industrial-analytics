import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  Star,
  Plus,
} from 'lucide-react';
import type { View, Survey } from '@/types';

interface SurveysListProps {
  onNavigate: (view: View) => void;
  onSelectSurvey: (id: string) => void;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/['"\s]/g, '').replace(/\/$/, '');

// Paleta de etiquetas por colectivo (idéntica a producción)
function getAudienceBadgeStyle(audience: string) {
  const aud = (audience || '').toLowerCase();
  if (aud.includes('fàbrica') || aud.includes('fabrica') || aud.includes('operaris')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (aud.includes('magatzem') || aud.includes('logística') || aud.includes('distribució') || aud.includes('zal')) {
    return 'bg-sky-50 text-sky-800 border-sky-200';
  }
  if (aud.includes('comercial')) {
    return 'bg-purple-50 text-purple-800 border-purple-200';
  }
  if (aud.includes('oficines')) {
    return 'bg-rose-50 text-rose-800 border-rose-200';
  }
  if (aud.includes('manager') || aud.includes('direcció')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  return 'bg-pink-50 text-pink-800 border-pink-200';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Activa
        </span>
      );
    case 'closed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Tancada
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Esborrany
        </span>
      );
  }
}

export function SurveysList({ onNavigate, onSelectSurvey }: SurveysListProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchSurveys() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/surveys`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        if (!isMounted) return;

        const list = Array.isArray(data) ? data : data.surveys || [];
        setSurveys(
          list.map((s: any) => ({
            id: String(s.id),
            title: s.title || `Consulta ${s.id}`,
            description: s.description || `Consulta per al col·lectiu: ${s.audience || 'General'}`,
            status: s.status || (s.is_active ? 'active' : 'closed'),
            audience: s.audience || 'General',
            responses: s.responses ?? 0,
            avgRating: s.avgRating ?? 0,
            completionRate: s.completionRate ?? (s.responses > 0 ? 85 : 0),
            createdAt: s.created_at || '2026-11-01',
            closesAt: '2026-12-31',
            channel: 'QR Planta + Teams',
            questions: s.questions || [],
            questionCount: s.questionCount || 5,
          }))
        );
        setIsLive(true);
      } catch (err) {
        console.warn('Error carregant enquestes des de la BD:', err);
        if (isMounted) setIsLive(false);
      }
    }

    fetchSurveys();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrado reactivo por texto y por pestaña
  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (survey.audience || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'active') return survey.status === 'active';
    if (filterTab === 'draft') return survey.status === 'draft';
    if (filterTab === 'closed') return survey.status === 'closed';
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabecera idéntica a Producción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">Consultes de Clima Laboral</h1>
            {isLive ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                ● Turso DB Connectat
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                ○ Mode Local
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Supervisió, edició i seguiment de microconsultes extretes directament de Turso
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-survey')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C8102E] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#a50d25] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Nova consulta</span>
        </button>
      </div>

      {/* Barra de búsqueda y selector de pestañas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per títol o col·lectiu (ex: Fàbrica, Logística)..."
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-damm-500 focus:outline-hidden focus:ring-1 focus:ring-damm-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white p-1 shadow-xs text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            Totes
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterTab === 'active'
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            Actives
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('draft')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterTab === 'draft'
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            Esborranys
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('closed')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              filterTab === 'closed'
                ? 'bg-[#C8102E] text-white shadow-xs'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            Tancades
          </button>
        </div>
      </div>

      {/* Parrilla de tarjetas completa con métricas al pie */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredSurveys.map((survey) => (
          <div
            key={survey.id}
            onClick={() => onSelectSurvey(survey.id)}
            className="group flex flex-col justify-between rounded-2xl border border-ink-200/80 bg-white p-5 shadow-xs transition-all hover:border-damm-300 hover:shadow-md cursor-pointer"
          >
            <div>
              {/* Badges superiores: Colectivo y Estado */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-block rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${getAudienceBadgeStyle(
                    survey.audience
                  )}`}
                >
                  {survey.audience}
                </span>
                {getStatusBadge(survey.status)}
              </div>

              {/* Título y descripción */}
              <h2 className="mt-3.5 text-base font-bold text-ink-900 group-hover:text-damm-600 transition-colors line-clamp-1">
                {survey.title}
              </h2>
              <p className="mt-1 text-xs text-ink-500 line-clamp-2">
                {survey.description}
              </p>
            </div>

            {/* Pie de la tarjeta con métricas e iconos */}
            <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
              <div className="flex items-center gap-3.5">
                <span className="flex items-center gap-1 font-medium text-ink-600">
                  <Users className="h-3.5 w-3.5 text-ink-400" />
                  {survey.responses.toLocaleString('ca')}
                </span>

                <span className="flex items-center gap-1 font-medium text-ink-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-ink-400" />
                  {survey.completionRate}%
                </span>

                <span className="flex items-center gap-1 font-medium text-ink-600">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                  {survey.avgRating > 0 ? `${survey.avgRating}/5` : '—'}
                </span>
              </div>

              <span className="font-medium text-ink-400">
                {(survey as any).questionCount || 5} preguntes
              </span>
            </div>
          </div>
        ))}

        {filteredSurveys.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-ink-200 py-12 text-center">
            <p className="text-sm text-ink-500">No s'ha trobat cap consulta amb aquest criteri de cerca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
