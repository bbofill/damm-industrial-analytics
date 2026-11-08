import { useState } from 'react';
import OpenAI from 'openai';
import { Send } from 'lucide-react'; //
// import { supabase } from '@/lib/supabase'; // Descomenta quan tinguis l'arxiu de Supabase

// Configurem el client apuntant al túnel o localhost des de variables d'entorn
const openai = new OpenAI({
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'http://localhost:3001/v1',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Necessari en aplicacions React de frontend
});

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDatabaseContext = async () => {
    // 1. Aquí fas la crida a la teva BD per obtenir les dades actuals
    // const { data, error } = await supabase.from('teva_taula').select('*').limit(5);
    
    // Exemple de dades retornades (Injecció de Context):
    return `
      Dades actuals de la BD "Damm Escolta Activa":
      - Campanya actual: Estrella Damm Estiu 2026.
      - Mètriques de feedback: 85% positiu, 10% neutre, 5% negatiu.
      - Última incidència reportada: Retard en l'entrega al sector distribució de Barcelona.
    `;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Obtenim el context fresc de la BD
      const dbContext = await fetchDatabaseContext();

      // 3. Construïm el System Prompt amb les dades inserides
      const systemPrompt: Message = {
        role: 'system',
        content: `Ets un assistent virtual de l'aplicació "Damm · Escolta Activa". 
        Respon a l'usuari utilitzant ÚNICAMENT la següent informació extreta de la base de dades:
        ${dbContext}
        
        Si et pregunten una cosa que no està a la informació, digues que no tens accés a aquestes dades.`,
      };

      // 4. Fem la crida a la teva instància de FreeLLMAPI
      const response = await openai.chat.completions.create({
        model: 'claude-3-5-sonnet', // O qualsevol altre model que tinguis carregat localment
        messages: [systemPrompt, ...messages, userMessage],
        temperature: 0.2, // Baixa temperatura perquè no inventi (al·lucini) dades
      });

      const botReply = response.choices[0].message.content || 'Error en la resposta.';
      setMessages((prev) => [...prev, { role: 'assistant', content: botReply }]);
    } catch (error) {
      console.error('Error de FreeLLMAPI:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Hi ha hagut un problema de connexió amb la API.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md mx-auto border border-ink-200 rounded-lg overflow-hidden shadow-cardlg bg-white">
      {/* Header utilitzant els colors del teu tailwind.config.js */}
      <div className="bg-damm-500 text-white p-4 font-semibold text-lg">
        Assistent Escolta Activa
      </div>

      {/* Finestra de missatges */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-ink-50">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-damm-600 text-white rounded-br-none' 
                : 'bg-white border border-ink-200 text-ink-900 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-sm text-ink-400 italic">L'assistent està pensant...</div>}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-ink-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta sobre les dades..."
          className="flex-1 px-3 py-2 border border-ink-200 rounded-md focus:outline-none focus:border-damm-500"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-damm-500 text-white p-2 rounded-md hover:bg-damm-600 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
