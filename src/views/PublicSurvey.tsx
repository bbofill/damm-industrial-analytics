import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, ShieldCheck, CheckSquare, Square, Lock, Clock } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface PublicSurveyProps {
  token?: string | null;
}

interface Option {
  id: string;
  label: string;
}

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'single' | 'multiple' | 'text';
  options?: Option[];
}

interface SurveyData {
  title: string;
  description: string;
  questions: Question[];
}

type AnswerValue = string | number | string[];
type Metode = 'xarxa' | 'm365';

/**
 * Extreu el missatge d'error del cos de la resposta del backend.
 *
 * @param resposta - Resposta HTTP fallida.
 * @param perDefecte - Text a mostrar si el backend no envia detall.
 * @returns Missatge d'error per a l'usuari.
 */
async function detallError(resposta: Response, perDefecte: string): Promise<string> {
  try {
    const dades = await resposta.json();
    return typeof dades.detail === 'string' ? dades.detail : perDefecte;
  } catch {
    return perDefecte;
  }
}

export function PublicSurvey({ token: propToken }: PublicSurveyProps) {
  const token = propToken || new URLSearchParams(window.location.search).get('token');

  const [lang, setLang] = useState<'ca' | 'es'>('ca');
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [metode, setMetode] = useState<Metode | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const t = {
    ca: {
      channelTag: 'Canal Anònim',
      badge: '100% Anònim',
      trustTitle: 'Garantia de Confidencialitat Damm',
      trustTime: '< 1 minut',
      trustDesc: 'Aquesta microconsulta no desa noms, telèfons ni adreces IP. Les dades es processen exclusivament de manera agregada per a millores de clima laboral.',
      submit: 'Enviar resposta anònima',
      successTitle: 'Gràcies pel teu feedback!',
      successDesc: "La teva resposta s'ha guardat de manera totalment agregada i anònima.",
      encryptedBadge: "Dades agregades · Sense registre d'IP ni identitat",
      placeholder: 'Escriu la teva observació lliurement (es filtren dades personals)...',
      invalidToken: "No s'ha detectat cap codi d'accés vàlid. Torna a escanejar el codi QR.",
      notAvailable: 'Aquest codi QR no és vàlid o no té cap enquesta activa associada.',
      loginM365: 'Entrar amb Microsoft 365 (demo)',
      loginHint: "Cal verificar el teu compte corporatiu. La teva identitat no es guarda ni s'enllaça amb les respostes.",
      verifyingNet: 'Verificant la xarxa de la planta...',
      verifyError: "No s'ha pogut verificar l'accés.",
      sessionExpired: "La verificació ha caducat o ja s'ha utilitzat. Torna-ho a provar.",
      submitError: "No s'han pogut desar les respostes. Comprova la connexió i torna-ho a provar.",
      retry: 'Torna-ho a provar',
      loading: 'Carregant microconsulta...',
      unavailableTitle: 'Consulta no disponible',
      invalidTitle: 'Codi no vàlid',
    },
    es: {
      channelTag: 'Canal Anónimo',
      badge: '100% Anónimo',
      trustTitle: 'Garantía de Confidencialidad Damm',
      trustTime: '< 1 minuto',
      trustDesc: 'Esta microconsulta no guarda nombres, teléfonos ni direcciones IP. Los datos se procesan exclusivamente de forma agregada para mejoras de clima laboral.',
      submit: 'Enviar respuesta anónima',
      successTitle: '¡Gracias por tu feedback!',
      successDesc: 'Tu respuesta se ha guardado de forma totalmente agregada y anónima.',
      encryptedBadge: 'Datos agregados · Sin registro de IP ni identidad',
      placeholder: 'Escribe tu observación libremente (se filtran datos personales)...',
      invalidToken: 'No se ha detectado ningún código de acceso válido. Vuelve a escanear el código QR.',
      notAvailable: 'Este código QR no es válido o no tiene ninguna encuesta activa asociada.',
      loginM365: 'Entrar con Microsoft 365 (demo)',
      loginHint: 'Hay que verificar tu cuenta corporativa. Tu identidad no se guarda ni se vincula con las respuestas.',
      verifyingNet: 'Verificando la red de la planta...',
      verifyError: 'No se ha podido verificar el acceso.',
      sessionExpired: 'La verificación ha caducado o ya se ha utilizado. Vuelve a intentarlo.',
      submitError: 'No se han podido guardar las respuestas. Comprueba la conexión y vuelve a intentarlo.',
      retry: 'Volver a intentarlo',
      loading: 'Cargando microconsulta...',
      unavailableTitle: 'Consulta no disponible',
      invalidTitle: 'Código no válido',
    },
  };

  const text = t[lang];

  // Carrega les preguntes enviant el token de verificació
  const carregarPreguntes = async (tok: string): Promise<void> => {
    const resposta = await fetch(`${API_BASE_URL}/api/preguntes/${token}`, {
      headers: { 'X-Access-Token': tok },
    });
    if (resposta.status === 404) {
      setFatal(text.notAvailable);
      return;
    }
    if (!resposta.ok) {
      throw new Error(await detallError(resposta, text.verifyError));
    }
    setSurveyData(await resposta.json());
  };

  // Verifica l'accés (xarxa o M365) i després carrega les preguntes
  const verificar = async (via: Metode): Promise<void> => {
    setIsVerifying(true);
    setError(null);
    try {
      const resposta = await fetch(`${API_BASE_URL}/api/verificar/${via}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_qr: token }),
      });
      if (!resposta.ok) {
        throw new Error(await detallError(resposta, text.verifyError));
      }
      const dades = await resposta.json();
      await carregarPreguntes(dades.access_token);
      setAccessToken(dades.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.verifyError);
    } finally {
      setIsVerifying(false);
    }
  };

  // En carregar la pàgina: detecta el mètode i verifica automàticament si és xarxa de planta
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const iniciar = async () => {
      try {
        const resposta = await fetch(`${API_BASE_URL}/api/verificar/metode/${token}`);
        if (resposta.status === 404) {
          setFatal(text.notAvailable);
          return;
        }
        if (!resposta.ok) {
          throw new Error(await detallError(resposta, text.verifyError));
        }
        const dades = await resposta.json();
        setMetode(dades.metode);
        if (dades.metode === 'xarxa') {
          await verificar('xarxa');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : text.verifyError);
      } finally {
        setIsLoading(false);
      }
    };

    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleToggle = (questionId: string, label: string) => {
    const llistaActual = Array.isArray(answers[questionId]) ? (answers[questionId] as string[]) : [];
    const actualitzada = llistaActual.includes(label)
      ? llistaActual.filter(item => item !== label)
      : [...llistaActual, label];

    setAnswers(prev => {
      const seguent = { ...prev };
      if (actualitzada.length > 0) {
        seguent[questionId] = actualitzada;
      } else {
        delete seguent[questionId];
      }
      return seguent;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !accessToken) return;

    setIsSubmitting(true);
    setError(null);

    // Les multiples s'envien com a text separat per comes, que és el que espera el backend
    const respostes: Record<string, string | number> = {};
    for (const clau of Object.keys(answers)) {
      const valor = answers[clau];
      respostes[clau] = Array.isArray(valor) ? valor.join(',') : valor;
    }

    try {
      const resposta = await fetch(`${API_BASE_URL}/api/enviar-resposta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_qr: token,
          access_token: accessToken,
          respostes,
        }),
      });

      if (resposta.status === 403) {
        // El token s'ha consumit o ha caducat: cal tornar a verificar
        setAccessToken(null);
        setSurveyData(null);
        setError(text.sessionExpired);
        return;
      }
      if (!resposta.ok) {
        throw new Error(await detallError(resposta, text.submitError));
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-stone-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-[#C8102E]">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-stone-900">{text.invalidTitle}</h2>
          <p className="text-sm text-stone-600">{text.invalidToken}</p>
        </div>
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-stone-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-stone-900">{text.unavailableTitle}</h2>
          <p className="text-sm text-stone-600">{fatal}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#C8102E] border-t-transparent"></span>
          <p className="text-sm font-semibold tracking-wide text-stone-700">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-stone-200">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-stone-900">{text.successTitle}</h2>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">{text.successDesc}</p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-stone-50 py-3 px-4 border border-stone-200/80 text-xs text-stone-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-[#C8102E]" />
            {text.encryptedBadge}
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = surveyData?.questions.length || 0;
  const answeredQuestions = Object.keys(answers).filter(
    k => answers[k] !== undefined && answers[k] !== '' && (!Array.isArray(answers[k]) || (answers[k] as string[]).length > 0)
  ).length;
  const isFormComplete = totalQuestions > 0 && answeredQuestions === totalQuestions;

  return (
    <div className="min-h-screen bg-stone-100 pb-12 font-sans selection:bg-[#C8102E] selection:text-white">
      <header className="sticky top-0 z-20 bg-[#C8102E] text-white shadow-md border-b border-red-800">
        <div className="mx-auto flex max-w-lg items-center justify-between px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/damm-logo.png"
              alt="Damm"
              className="h-8 w-auto max-w-[105px] object-contain brightness-0 invert drop-shadow-xs shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="border-l border-white/25 pl-2 min-w-0">
              <h1 className="text-[11px] font-black uppercase tracking-wider leading-none text-white truncate">
                Escolta Activa
              </h1>
              <p className="text-[9px] text-red-200 font-medium leading-none mt-1 truncate">
                {text.channelTag}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-full bg-black/25 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLang('ca')}
                className={`rounded-full px-2 py-0.5 transition-all ${
                  lang === 'ca' ? 'bg-white text-[#C8102E] shadow-xs' : 'text-white/90'
                }`}
              >
                CA
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`rounded-full px-2 py-0.5 transition-all ${
                  lang === 'es' ? 'bg-white text-[#C8102E] shadow-xs' : 'text-white/90'
                }`}
              >
                ES
              </button>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-xs">
              <ShieldCheck className="h-3 w-3 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">{text.badge}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-4 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              <Lock className="h-4 w-4" />
            </div>
            <div className="text-left text-xs text-stone-600">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <span>{text.trustTitle}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Clock className="h-3 w-3" /> {text.trustTime}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{text.trustDesc}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-stone-200/90">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-lg font-bold tracking-tight text-stone-900 leading-snug">
              {surveyData?.title}
            </h2>
            <p className="mt-1 text-xs font-medium text-stone-500">{surveyData?.description}</p>
          </div>

          {/* Verificació: només es mostra fins que hi ha token d'accés i preguntes */}
          {!surveyData && (
            <div className="mt-5 space-y-3">
              {metode === 'm365' && !isVerifying && (
                <>
                  <p className="text-xs leading-relaxed text-stone-500">{text.loginHint}</p>
                  <button
                    type="button"
                    onClick={() => verificar('m365')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8102E] py-3.5 px-4 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-[#A50D25]"
                  >
                    <Lock className="h-4 w-4" />
                    {text.loginM365}
                  </button>
                </>
              )}

              {isVerifying && (
                <div className="flex justify-center py-2">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8102E] border-t-transparent" />
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                    {error}
                  </div>
                  {metode && (
                    <button
                      type="button"
                      onClick={() => verificar(metode)}
                      disabled={isVerifying}
                      className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-4 text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      {text.retry}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {surveyData && accessToken && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              {surveyData.questions.map((q, index) => (
                <div key={q.id} className="space-y-2.5">
                  <label className="block text-sm font-bold text-stone-800 leading-snug">
                    <span className="text-[#C8102E] mr-1.5">{index + 1}.</span>
                    {q.text}
                  </label>

                  {q.type === 'rating' && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map(num => {
                        const seleccionat = answers[q.id] === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, num)}
                            className={`flex h-12 items-center justify-center rounded-xl border text-base font-bold transition-all active:scale-95 ${
                              seleccionat
                                ? 'border-[#C8102E] bg-[#C8102E] text-white shadow-sm ring-2 ring-red-200'
                                : 'border-stone-200 bg-stone-50/70 text-stone-700 hover:border-red-300 hover:bg-stone-50'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <textarea
                      rows={3}
                      placeholder={text.placeholder}
                      value={(answers[q.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs text-stone-800 placeholder-stone-400 focus:border-[#C8102E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                    />
                  )}

                  {q.type === 'single' && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map(opt => {
                        const seleccionat = answers[q.id] === opt.label;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt.label)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${
                              seleccionat
                                ? 'border-[#C8102E] bg-red-50/40 text-stone-900 font-semibold'
                                : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100/60'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              seleccionat ? 'border-[#C8102E] bg-[#C8102E]' : 'border-stone-300'
                            }`}>
                              {seleccionat && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'multiple' && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map(opt => {
                        const llista = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                        const seleccionat = llista.includes(opt.label);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleMultipleToggle(q.id, opt.label)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${
                              seleccionat
                                ? 'border-[#C8102E] bg-red-50/40 text-stone-900 font-semibold'
                                : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100/60'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span className="text-[#C8102E]">
                              {seleccionat ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-stone-300" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormComplete || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8102E] py-3.5 px-4 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#A50D25]"
              >
                {isSubmitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {text.submit}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
