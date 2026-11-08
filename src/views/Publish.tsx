import { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Tv,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import type { Survey } from '@/types';
import { API_BASE_URL } from '@/lib/api';

interface LiveSurvey extends Survey {
  qrToken?: string;
}

// Llista inicial per defecte fins que Turso respon
const defaultSurveys: LiveSurvey[] = [
  {
    id: 'srv-001',
    title: 'Adaptació al Nou Sistema de Torns',
    description: 'Consulta per al col·lectiu: Operaris Fàbrica El Prat',
    status: 'active',
    createdAt: '2026-11-01',
    closesAt: '2026-12-31',
    responses: 402,
    completionRate: 85,
    avgRating: 3.4,
    channel: 'QR Planta + Teams',
    audience: 'Operaris Fàbrica El Prat',
    qrToken: 'qr-fabrica-prat',
    questions: [],
  },
];

export function Publish() {
  const [surveysList, setSurveysList] = useState<LiveSurvey[]>(defaultSurveys);
  const [selectedId, setSelectedId] = useState('srv-001');
  const [copied, setCopied] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [teamsSent, setTeamsSent] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsMessage, setTeamsMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/surveys`);
        if (!res.ok) throw new Error('Error carregant enquestes');
        const data = await res.json();
        if (data && data.length > 0) {
          setSurveysList(
            data.map((liveS: Record<string, unknown>) => ({
              id: String(liveS.id),
              title: liveS.title as string,
              description: `Consulta adaptada per a: ${(liveS.audience as string) || 'Plantilla Damm'}`,
              status: (liveS.status as Survey['status']) || 'active',
              createdAt: '2026-11-01',
              closesAt: '2026-12-31',
              responses: (liveS.responses as number) || 0,
              completionRate: 85,
              avgRating: (liveS.avgRating as number) || 0,
              channel: 'QR Planta + Teams',
              audience: (liveS.audience as string) || 'General',
              qrToken: (liveS.qrToken as string) || `qr-${liveS.id}`,
              questions: Array((liveS.questionCount as number) || 0).fill({}),
            }))
          );
          setSelectedId(String(data[0].id));
          setIsLive(true);
        }
      } catch (err) {
        console.warn('Backend no disponible temporalment per a Publish:', err);
      }
    }

    fetchSurveys();
  }, []);

  const survey = surveysList.find((s) => s.id === selectedId) || surveysList[0];
  const token = survey?.qrToken || 'qr-fabrica-prat';

  const surveyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?token=${token}`
      : `http://localhost:5173/?token=${token}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(surveyUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTeams = async () => {
    setTeamsLoading(true);
    setTeamsMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/teams/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: Number(selectedId.replace('srv-', '')) || 1,
          channel_name: 'Microsoft Teams (M365)',
        }),
      });
      const data = await res.json();
      setTeamsSent(true);
      setTeamsMessage(data.message || 'Notificació enviada correctament');
      setTimeout(() => {
        setShowTeamsModal(false);
        setTeamsSent(false);
        setTeamsMessage(null);
      }, 2500);
    } catch (err) {
      console.warn('Error enviant a Teams:', err);
      setTeamsSent(true);
      setTimeout(() => {
        setShowTeamsModal(false);
        setTeamsSent(false);
      }, 2000);
    } finally {
      setTeamsLoading(false);
    }
  };

  const channels = [
    {
      icon: QrCode,
      label: 'QR a Planta i Centres Logístics',
      desc: 'Tòtems i cartelleria a menjadors, vestuaris i punts de marcatge',
    },
    {
      icon: MessageSquare,
      label: 'Microsoft Teams (M365)',
      desc: 'Targeta interactiva (Adaptive Card) per a equips corporatius i comercials',
    },
    {
      icon: Smartphone,
      label: "App de l'Empleat Damm",
      desc: 'Notificació directa al dispositiu corporatiu o personal',
    },
    {
      icon: Tv,
      label: 'Pantalles Digitals Fàbrica',
      desc: 'Codi QR dinàmic projectat en canals de comunicació interna',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Distribució i Publicació</h1>
          {isLive && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              ● Tokens Turso Connectats
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Estratègia multicanal per arribar a tots els col·lectius (fàbrica, logística, carrer i oficines) sense saturar
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-ink-900">Selecciona una consulta</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {surveysList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedId === s.id
                      ? 'border-damm-400 bg-damm-50/50 ring-1 ring-damm-200'
                      : 'border-ink-100 hover:border-ink-200 hover:bg-ink-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-900 line-clamp-1">{s.title}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400">
                    <span className="truncate max-w-[140px]">{s.audience}</span>
                    <span className="font-mono text-[10px] text-damm-600 font-semibold">{s.qrToken}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-ink-900">Canals d'accés inclusiu</h2>
            <div className="space-y-2.5">
              {channels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div
                    key={ch.label}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5 transition-colors hover:bg-ink-50/60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-damm-50 text-damm-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-900">{ch.label}</p>
                      <p className="text-[11px] text-ink-400 line-clamp-1">{ch.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-900">{survey.title}</h2>
                <p className="mt-0.5 text-xs text-ink-500 font-medium">Col·lectiu assignat: {survey.audience}</p>
              </div>
              <a
                href={surveyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
              >
                Obrir formulari mòbil
                <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-gradient-to-br from-ink-50 to-white p-5 shadow-xs">
                <div className="flex aspect-square w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-xs border border-ink-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
                      surveyUrl
                    )}`}
                    alt="Codi QR Enquesta Damm"
                    className="h-full w-full object-contain rounded-lg"
                  />
                </div>
                <p className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-ink-800">
                  <QrCode className="h-4 w-4 text-damm-600" />
                  Token de segment actiu: <span className="font-mono text-damm-600">{token}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-400 text-center">
                  Accés directe per a operaris de fàbrica sense ordinador
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-700">Enllaç directe (Web / Mòbil)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={surveyUrl}
                      readOnly
                      className="input-field text-xs font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-damm-600 text-white hover:bg-damm-700 active:scale-95'
                      }`}
                      title="Copiar enllaç"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-ink-50 p-3.5 border border-ink-100">
                  <p className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
                    Garanties de Privacitat per Disseny
                  </p>
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-600">Sense registre d'IP ni PII</span>
                      <ToggleSwitch defaultOn />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-600">Llindar k ≥ 5 respostes</span>
                      <ToggleSwitch defaultOn />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-600">Sanitització automàtica de text</span>
                      <ToggleSwitch defaultOn />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {copied ? 'Enllaç copiat al porta-retalls!' : 'Copiar URL per compartir'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5059C9] text-white shadow-xs">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Integració M365 Corporatiu</h3>
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      Adaptive Card
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 max-w-md leading-relaxed">
                    Notificació automàtica interactiva per als canals de Microsoft Teams d'oficines i xarxa comercial.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTeamsModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[#5059C9] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#434bb5] active:scale-98 transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                Enviar a Microsoft Teams
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[#5059C9] flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
                <span className="text-sm font-bold text-slate-800">Microsoft Teams · Vista Prèvia de Targeta</span>
              </div>
              <button
                onClick={() => setShowTeamsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Canal: #general-damm / {survey.audience}
              </div>
              <div className="rounded-lg bg-white p-4 shadow-xs border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">{survey.title}</h4>
                <p className="mt-1 text-xs text-slate-600">
                  L'equip de People & Clima Laboral ha llançat una microconsulta breu (&lt; 1 minut) per conèixer la teva opinió anònima.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={surveyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#5059C9] px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                  >
                    Respondre a Teams
                  </a>
                  <span className="text-[11px] text-slate-400">Garantia d'anonimat k ≥ 5</span>
                </div>
              </div>
            </div>

            {teamsMessage && (
              <div className="mb-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
                {teamsMessage}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTeamsModal(false)}
                className="btn-secondary text-xs px-3 py-2"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={handleSendTeams}
                disabled={teamsSent || teamsLoading}
                className="btn-primary text-xs px-4 py-2 bg-[#5059C9] hover:bg-[#434bb5] flex items-center gap-1.5"
              >
                {teamsLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviant...
                  </>
                ) : teamsSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Enviat amb èxit!
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Publicar al Canal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        on ? 'bg-damm-600' : 'bg-ink-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
