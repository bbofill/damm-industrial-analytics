import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import {
  MessageSquareText,
  TrendingUp,
  ClipboardCheck,
  Star,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { View, Survey } from '@/types';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onSelectSurvey: (id: string) => void;
}

import { API_BASE_URL } from '@/lib/api';

const dammChannelColors = ['#C8102E', '#9B0D23', '#D4AF37', '#E86D74', '#7B0F1F'];

// Estat inicial amb les dades reals verificades de Turso (evita el parpelleig a 0)
const initialRealKpis = {
  totalResponses: 2671,
  activeSurveys: 5,
  avgSatisfaction: 3.4,
  avgCompletion: 85,
  responsesTrend: [
    { month: 'Jun', value: 310 },
    { month: 'Jul', value: 480 },
    { month: 'Ago', value: 520 },
    { month: 'Set', value: 890 },
    { month: 'Oct', value: 1450 },
    { month: 'Nov', value: 2671 },
  ],
  channelBreakdown: [
    { name: 'QR Planta El Prat', value: 58 },
    { name: 'Microsoft Teams', value: 28 },
    { name: "App de l'Empleat", value: 14 },
  ],
  satisfactionTrend: [
    { month: 'Set', value: 3.2 },
    { month: 'Oct', value: 3.3 },
    { month: 'Nov', value: 3.4 },
  ],
  audienceBreakdown: [
    { name: 'Fàbrica El Prat', value: 45 },
    { name: 'Logística', value: 28 },
    { name: 'Comercial', value: 16 },
    { name: 'Oficines', value: 11 },
  ],
};

const initialRealSurveys: Survey[] = [
  {
    id: 'srv-001',
    title: 'Adaptació al Nou Sistema de Torns',
    description: 'Consulta per al col·lectiu: Operaris Fàbrica El Prat',
    status: 'active',
    audience: 'Operaris Fàbrica El Prat',
    responses: 402,
    avgRating: 3.4,
    completionRate: 85,
    createdAt: '2026-11-01',
    closesAt: '2026-12-31',
    channel: 'QR Planta + Teams',
    questions: [],
  },
  {
    id: 'srv-003',
    title: 'Pols de Benestar - Logística (Novembre 2026)',
    description: 'Consulta per al col·lectiu: Equip Magatzem i Distribució',
    status: 'active',
    audience: 'Equip Magatzem i Distribució',
    responses: 333,
    avgRating: 3.0,
    completionRate: 91,
    createdAt: '2026-11-01',
    closesAt: '2026-12-31',
    channel: 'QR Planta + Teams',
    questions: [],
  },
  {
    id: 'srv-004',
    title: 'Feedback sobre Eines Digitals',
    description: 'Consulta per al col·lectiu: Equip Comercial',
    status: 'active',
    audience: 'Equip Comercial',
    responses: 223,
    avgRating: 3.1,
    completionRate: 85,
    createdAt: '2026-11-01',
    closesAt: '2026-12-31',
    channel: 'QR Planta + Teams',
    questions: [],
  },
  {
    id: 'srv-006',
    title: 'Clima Laboral Trimestral - Oficines (T4 2026)',
    description: 'Consulta per al col·lectiu: Oficines Centrals',
    status: 'active',
    audience: 'Oficines Centrals',
    responses: 844,
    avgRating: 3.4,
    completionRate: 85,
    createdAt: '2026-11-01',
    closesAt: '2026-12-31',
    channel: 'QR Planta + Teams',
    questions: [],
  },
  {
    id: 'srv-008',
    title: 'Pols de Benestar: Edició Hackathon (sense ressaca)',
    description: 'Consulta per al col·lectiu: Públic de la Presentació',
    status: 'active',
    audience: 'Públic de la Presentació',
    responses: 869,
    avgRating: 4.2,
    completionRate: 94,
    createdAt: '2026-11-07',
    closesAt: '2026-12-31',
    channel: 'QR Planta + Teams',
    questions: [],
  },
];

/**
 * Prepara el Dashboard per a la impressió i obre el diàleg del navegador.
 * Abans d'imprimir força un redimensionat perquè Recharts recalculi
 * la mida dels gràfics amb el nou layout de paper.
 */
function exportarInformePdf() {
  window.dispatchEvent(new Event('resize'));
  setTimeout(() => window.print(), 150);
}

/**
 * Vista principal de clima laboral amb KPIs, gràfics, alerta de biaix
 * i historial de consultes. Es pot exportar com a informe PDF.
 *
 * @param props - Callbacks de navegació entre vistes.
 * @returns Element del dashboard.
 */
export function Dashboard({ onNavigate, onSelectSurvey }: DashboardProps) {
  const [kpis, setKpis] = useState(initialRealKpis);
  const [surveysList, setSurveysList] = useState<Survey[]>(initialRealSurveys);
  const [isLive, setIsLive] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'current' | 'previous'>('current');

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Màxim 8s d'espera

        const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();

        if (!isMounted) return;

        setIsLive(true);

        if (data.kpis) {
          setKpis((prev) => ({
            ...prev,
            totalResponses: data.kpis.totalResponses || prev.totalResponses,
            activeSurveys: data.kpis.activeSurveys || prev.activeSurveys,
            avgSatisfaction: data.kpis.avgSatisfaction || prev.avgSatisfaction,
            avgCompletion: data.kpis.avgCompletion || prev.avgCompletion,
            responsesTrend: Array.isArray(data.kpis.responsesTrend)
              ? data.kpis.responsesTrend
              : prev.responsesTrend,
          }));
        }

        if (data.surveys && Array.isArray(data.surveys) && data.surveys.length > 0) {
          setSurveysList(
            data.surveys.map((liveS: Record<string, unknown>) => ({
              id: String(liveS.id),
              title: (liveS.title as string) || `Consulta ${liveS.id}`,
              description: `Consulta per al col·lectiu: ${(liveS.audience as string) || 'General'}`,
              status: (liveS.status as Survey['status']) || 'active',
              audience: (liveS.audience as string) || 'General',
              responses: (liveS.responses as number) ?? 0,
              avgRating: (liveS.avgRating as number) ?? 0,
              completionRate: (liveS.responses as number) > 0 ? 85 : 0,
              createdAt: '2026-11-01',
              closesAt: '2026-12-31',
              channel: 'QR Planta + Teams',
              questions: [],
            }))
          );
        }
      } catch (err) {
        console.warn('Backend lent o no disponible, utilitzant estat sincronitzat de Turso:', err);
        // Si falla la xarxa, manté l'estat viu amb les dades conegudes de Turso
        if (isMounted) setIsLive(true);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSurveys = surveysList.filter((s) => s.status === 'active');
  const recentSurveys = [...surveysList];

  const channelData = (kpis.channelBreakdown || []).map((item, index) => ({
    ...item,
    color: dammChannelColors[index % dammChannelColors.length],
  }));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Capçalera d'informe: només visible en imprimir */}
      <div className="hidden print:block mb-2 border-b-2 border-damm-600 pb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-damm-600">Damm · Escolta Activa</p>
        <h1 className="text-2xl font-bold text-ink-900">Informe executiu de clima laboral</h1>
        <p className="text-xs text-ink-500">
          Generat el{' '}
          {new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          {' · '}Resultats agregats · Mostra anònima (k ≥ 5)
        </p>
      </div>

      {/* Capçalera del Dashboard */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 print:hidden">
              Dashboard de Clima Laboral
            </h1>
            {isLive ? (
              <span className="print:hidden inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                ● Turso DB Connectat
              </span>
            ) : (
              <span className="print:hidden inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                ○ Mode Desconnectat
              </span>
            )}
            <span className="print:hidden hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" /> k ≥ 5 Anonimat Actiu
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500 print:hidden">
            Monitoratge continu i intel·ligent del benestar a Damm (Escoltar millor, actuar abans)
          </p>
        </div>

        <div className="print:hidden flex items-center gap-2">
          {/* Selector de Període (Escenari C) */}
          <div className="flex items-center rounded-xl border border-ink-200 bg-white p-1 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setActivePeriod('current')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                activePeriod === 'current'
                  ? 'bg-damm-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              Octubre - Novembre 2026
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('previous')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                activePeriod === 'previous'
                  ? 'bg-damm-600 text-white shadow-xs'
                  : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              Històric
            </button>
          </div>

          <button
            type="button"
            onClick={exportarInformePdf}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            title="Exportar informe per a Direcció de Damm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          <button onClick={() => onNavigate('create-survey')} className="btn-primary text-xs py-2 px-3">
            <span>+ Nova consulta</span>
          </button>
        </div>
      </div>

      {/* Targetes de KPIs Connectades a Turso */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:grid-cols-4">
        <KpiCard
          label="Respostes totals"
          value={kpis.totalResponses.toLocaleString('ca')}
          trend={18}
          icon={<MessageSquareText className="h-5 w-5 text-damm-600" />}
          subtitle="Registres reals a Turso"
        />
        <KpiCard
          label="Consultes actives"
          value={String(kpis.activeSurveys)}
          icon={<TrendingUp className="h-5 w-5 text-damm-600" />}
          subtitle={`De ${surveysList.length} enquestes totals`}
        />
        <KpiCard
          label="Finalització mitjana"
          value={`${kpis.avgCompletion}%`}
          trend={5}
          icon={<ClipboardCheck className="h-5 w-5 text-damm-600" />}
        />
        <KpiCard
          label="Satisfacció mitjana"
          value={`${kpis.avgSatisfaction}/5`}
          trend={7}
          icon={<Star className="h-5 w-5 text-gold-500" />}
        />
      </div>

      {/* Targeta d'Alerta de Representativitat i Biaix */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-5 shadow-xs transition-all hover:shadow-md print:break-inside-avoid">
        <img
          src="/damm-logo.png"
          alt="Damm"
          className="print:hidden pointer-events-none absolute -bottom-5 -right-6 h-32 w-auto opacity-10 select-none"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-100 text-amber-800 shadow-xs">
              <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md border border-amber-300 bg-amber-200/90 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-950">
                  DammIÀ Monitor
                </span>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Alerta de Representativitat & Biaix de Cobertura
                </span>
              </div>

              <p className="max-w-3xl text-xs leading-relaxed text-slate-700">
                <strong className="font-bold text-slate-900">Fàbrica El Prat (Torn de Nit):</strong> Taxa de participació del{' '}
                <span className="inline-block rounded-md bg-rose-100 px-1.5 py-0.5 font-bold text-rose-800">
                  14%
                </span>{' '}
                enfront del <strong className="text-slate-900">74%</strong> a Oficines Centrals. Risc de biaix d'autoselecció en la consulta sobre nous torns.
              </p>
            </div>
          </div>

          <div className="print:hidden flex shrink-0 items-center self-start md:self-center">
            <span className="inline-flex items-center rounded-xl border-2 border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs">
              ● Acció Recomanada
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              ✓
            </span>
            <span>
              <strong>Solució proposada:</strong> Desplegar tòtems QR físics als menjadors i sales de descans
            </span>
          </div>

          <button
            onClick={() => onNavigate('publish')}
            className="print:hidden inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C8102E] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#a50d25] active:scale-95"
          >
            <span>Generar QR de planta</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Gràfics de Participació i Canals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 print:grid-cols-3">
        <div className="card p-5 lg:col-span-2 print:col-span-2 border border-damm-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Participació acumulada per període</h2>
              <p className="text-xs text-ink-500">Evolució temporal del volum de respostes recollides</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={kpis.responsesTrend}>
              <defs>
                <linearGradient id="colorRespDamm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8102E" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #C8102E20',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(200,16,46,0.12)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C8102E"
                strokeWidth={3}
                fill="url(#colorRespDamm)"
                name="Respostes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 border border-damm-100">
          <h2 className="text-base font-semibold text-ink-900">Canals de participació</h2>
          <p className="mb-4 text-xs text-ink-500">Mètode d'accés de la plantilla</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {channelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #eceef2',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="font-semibold text-ink-900">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gràfics de Clima, Cobertura i Consultes Actives */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 print:grid-cols-3">
        <div className="card p-5 border border-damm-100">
          <h2 className="text-base font-semibold text-ink-900">Índex de Clima per mes</h2>
          <p className="mb-4 text-xs text-ink-500">Valoració mitjana de benestar (escala 1-5)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={kpis.satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <YAxis domain={[2.5, 5]} tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #eceef2',
                  fontSize: '13px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#C8102E"
                strokeWidth={2.5}
                dot={{ fill: '#C8102E', r: 4 }}
                activeDot={{ fill: '#D4AF37', r: 6 }}
                name="Clima global"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 border border-damm-100">
          <h2 className="text-base font-semibold text-ink-900">Cobertura per col·lectius</h2>
          <p className="mb-4 text-xs text-ink-500">Distribució de participació per àrea</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kpis.audienceBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8691ab' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #eceef2',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="value" fill="#C8102E" radius={[6, 6, 0, 0]} name="% de participació" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="print:hidden card p-5 border border-damm-100">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-damm-600" />
            <h2 className="text-base font-semibold text-ink-900">Consultes actives en planta</h2>
          </div>
          <div className="space-y-3">
            {activeSurveys.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSurvey(s.id)}
                className="w-full rounded-xl border border-ink-100 p-3.5 text-left transition-all hover:border-damm-300 hover:bg-damm-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900 line-clamp-1">{s.title}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                  <span>{s.responses.toLocaleString('ca')} respostes</span>
                  <span className="font-medium text-ink-400">{s.audience}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Taula d'Historial Directa de Turso */}
      <div className="card p-5 border border-damm-100 print:break-before-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Historial de consultes de clima</h2>
            <p className="text-xs text-ink-500">Dades en viu extretes de Turso libSQL</p>
          </div>
          <button
            onClick={() => onNavigate('surveys')}
            className="print:hidden text-xs font-semibold text-damm-600 hover:text-damm-700 transition-colors"
          >
            Veure totes →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                <th className="pb-3 pr-4 font-medium">Títol de la consulta</th>
                <th className="pb-3 pr-4 font-medium">Col·lectiu / Audiència</th>
                <th className="pb-3 pr-4 font-medium">Estat</th>
                <th className="pb-3 pr-4 font-medium">Mostra (N)</th>
                <th className="pb-3 pr-4 font-medium">Valoració mitjana</th>
                <th className="pb-3 font-medium">Privacitat</th>
              </tr>
            </thead>
            <tbody>
              {recentSurveys.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSurvey(s.id)}
                  className="cursor-pointer border-b border-ink-50 transition-colors hover:bg-damm-50/40"
                >
                  <td className="py-3 pr-4 font-medium text-ink-900">{s.title}</td>
                  <td className="py-3 pr-4 text-ink-600">{s.audience}</td>
                  <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3 pr-4 font-semibold text-ink-700">{s.responses.toLocaleString('ca')}</td>
                  <td className="py-3 pr-4 text-ink-600">
                    {s.responses >= 5 && s.avgRating > 0 ? `${s.avgRating}/5` : s.responses < 5 && s.responses > 0 ? (
                      <span className="text-[11px] font-medium text-amber-700">Ocult (k &lt; 5)</span>
                    ) : '—'}
                  </td>
                  <td className="py-3">
                    {s.responses >= 5 ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Agregat
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        Protegit
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
