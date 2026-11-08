import { useState } from 'react';
import { Sparkles, Save, ArrowLeft } from 'lucide-react';
import type { View } from '@/types';

interface CreateSurveyProps {
  onNavigate?: (view: View) => void;
}

export function CreateSurvey({ onNavigate }: CreateSurveyProps) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAudience, setAiAudience] = useState('Fàbrica El Prat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Crida a la IA per generar la proposta
  const generateWithAI = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('http://localhost:8000/api/ai/generar-enquesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, audience: aiAudience })
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok' && data.proposta) {
        setTitle(data.proposta.title || '');
        setDescription(data.proposta.description || '');
        setQuestions(data.proposta.questions || []);
        setFeedbackMsg({
          type: 'success',
          text: `✨ Proposta generada amb èxit! Hem preparat ${data.proposta.questions?.length || 0} preguntes sobre "${data.proposta.title}". Revisa-les a sota i fes clic a "Publicar consulta" per activar-la.`
        });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: data.detail || "Hi ha hagut un error en comunicar amb el servei d'IA."
        });
      }
    } catch (err: any) {
      console.error("Error generant amb IA:", err);
      setFeedbackMsg({
        type: 'error',
        text: "No s'ha pogut connectar amb el servidor al port 8000. Comprova que el backend estigui iniciat."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Guarda l'enquesta generada a la base de dades SQLite
  const handlePublish = async () => {
    if (!title.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: "Cal introduir un títol abans de publicar. Pots generar-lo amb la IA o escriure'l a sota."
      });
      return;
    }
    if (questions.length === 0) {
      setFeedbackMsg({
        type: 'error',
        text: "L'enquesta no té preguntes. Fes clic a 'Generar enquesta amb IA' primer."
      });
      return;
    }
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("http://localhost:8000/api/enquestes/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          description: description,
          questions: questions
        })
      });
      
      if (res.ok) {
        if (onNavigate) {
          onNavigate('surveys'); // Redirigeix cap a la llista d'enquestes un cop creat
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFeedbackMsg({
          type: 'error',
          text: "Error al servidor en desar l'enquesta: " + (errorData.detail || res.statusText)
        });
      }
    } catch (err) {
      console.error("Error al guardar l'enquesta:", err);
      setFeedbackMsg({
        type: 'error',
        text: "Error de xarxa en contactar amb el servidor al port 8000."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button 
        onClick={() => onNavigate?.('surveys')} 
        className="flex items-center text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tornar a Enquestes
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Crear nova enquesta</h1>
        <button 
          onClick={handlePublish}
          disabled={isSaving || !title || questions.length === 0}
          className="btn-primary flex items-center disabled:opacity-50"
        >
          {isSaving ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> : <Save className="mr-2 h-4 w-4" />}
          Publicar consulta
        </button>
      </div>

      {/* Targeta DammIÀ */}
      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-indigo-900">Generador de consultes amb DammIÀ</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-indigo-900 mb-1">Quin és l'objectiu de RRHH?</label>
            <textarea 
              className="input-field w-full min-h-[80px]"
              placeholder={`Ex: "Vull avaluar la comoditat dels nous equips de protecció a la línia d'envasat"`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </div>

          {/* Botons de prompt d'exemple ràpid */}
          <div>
            <span className="block text-xs font-semibold text-indigo-900/70 mb-2">💡 Prova amb un d'aquests exemples de fàbrica i logística:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "🌙 Torns de nit i descans", prompt: "Avaluació de l'impacte dels torns de nit en la salut laboral, fatiga i qualitat del descans", aud: "Fàbrica El Prat" },
                { label: "🥽 EPIs i protecció auditiva", prompt: "Estat i comoditat dels equips de protecció individual (EPIs) i soroll a línies de producció", aud: "Fàbrica El Prat" },
                { label: "🌡️ Climatització a línies d'envasat", prompt: "Confort tèrmic, temperatura a les zones de cocció i envasat a la planta d'El Prat", aud: "Fàbrica El Prat" },
                { label: "📦 Ergonomia i càrregues ZAL", prompt: "Prevenció de lesions i ergonomia en el moviment de palets i carretilles", aud: "Logística ZAL" },
                { label: "🍽️ Menjador i àrees comunes", prompt: "Qualitat del servei de menjador, opcions saludables i disponibilitat per a torns continus", aud: "Fàbrica El Prat" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(item.prompt);
                    setAiAudience(item.aud);
                  }}
                  className="rounded-lg border border-indigo-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-indigo-800 shadow-2xs hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 items-center pt-1">
            <select 
              className="input-field max-w-xs"
              value={aiAudience}
              onChange={(e) => setAiAudience(e.target.value)}
            >
              <option value="Fàbrica El Prat">Fàbrica El Prat</option>
              <option value="Logística ZAL">Logística ZAL</option>
              <option value="Oficines Centrals">Oficines Centrals</option>
            </select>
            
            <button 
              onClick={generateWithAI}
              disabled={isGenerating || !aiPrompt}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? "Generant propostes..." : "✨ Generar enquesta amb IA"}
            </button>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedbackMsg.text}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Títol de l'enquesta</label>
            <input 
              type="text" 
              className="input-field w-full font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Descripció per a l'operari</label>
            <textarea 
              className="input-field w-full h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-ink-900">Preguntes de l'enquesta ({questions.length})</h3>
          {questions.map((q, idx) => (
            <div key={idx} className="card p-4 space-y-3">
              <div className="flex justify-between items-start">
                 <span className="font-semibold text-ink-900">Pregunta {idx + 1}</span>
                 <span className="text-xs font-medium px-2 py-1 bg-ink-100 rounded-md text-ink-600">{q.type}</span>
              </div>
              <input 
                className="input-field w-full font-medium" 
                value={q.text} 
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[idx].text = e.target.value;
                  setQuestions(newQ);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
