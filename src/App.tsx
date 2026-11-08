import { useState, useEffect } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { SurveysList } from '@/views/SurveysList';
import { SurveyDetail } from '@/views/SurveyDetail';
import { CreateSurvey } from '@/views/CreateSurvey';
import { Publish } from '@/views/Publish';
import { Copilot } from '@/views/Copilot';
import { Settings } from '@/views/Settings';
import { PublicSurvey } from '@/views/PublicSurvey';
import type { View } from '@/types';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);

  // Detecta si s'accedeix mitjançant escaneig de codi QR (ex: ?token=qr-prat-envasat)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setPublicToken(token);
    }
  }, []);

  const navigate = (v: View) => {
    setView(v);
  };

  const selectSurvey = (id: string) => {
    setSelectedSurveyId(id);
    setView('survey-detail');
  };

  // Si l'usuari entra des del mòbil escanejant el QR, només veu l'enquesta anònima
  if (publicToken) {
    return <PublicSurvey />;
  }

  // Panell d'Administració de RRHH (Estrella Damm)
  return (
    <div className="print:h-auto print:overflow-visible flex h-screen overflow-hidden bg-damm-cream text-ink-900">
      <Sidebar current={view} onNavigate={navigate} />

      <div className="print:overflow-visible flex flex-1 flex-col overflow-hidden">
        {/* Barra superior difuminada en vermell Damm */}
        <header className="print:hidden flex h-16 shrink-0 items-center justify-between border-b border-damm-300/80 bg-gradient-to-r from-damm-200/90 via-damm-100/80 to-damm-200/70 px-4 backdrop-blur-lg lg:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-damm-800 hover:bg-damm-200/60 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-damm-700" />
              <input
                type="text"
                placeholder="Cerca enquestes, mètriques o departaments..."
                className="w-80 rounded-xl border border-damm-300/90 bg-white/95 py-2 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 shadow-xs backdrop-blur-xs transition-all focus:border-damm-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-damm-600/25"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-damm-300/80 bg-white/90 p-2 text-damm-800 shadow-xs transition-colors hover:bg-damm-200/70 hover:text-damm-900">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-damm-600 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 rounded-xl border border-damm-300/80 bg-white/90 px-3 py-1.5 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-damm-600 text-xs font-bold text-white shadow-xs">
                AD
              </div>
              <div className="hidden leading-tight sm:block text-left">
                <p className="text-xs font-bold text-ink-900">Admin</p>
                <p className="text-[10px] font-semibold text-damm-700">Damm S.A.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Cos de l'aplicació */}
        <main className="print:overflow-visible print:p-0 flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {view === 'dashboard' && <Dashboard onNavigate={navigate} onSelectSurvey={selectSurvey} />}
          {view === 'surveys' && <SurveysList onSelectSurvey={selectSurvey} onNavigate={navigate} />}
          {view === 'survey-detail' && selectedSurveyId && (
            <SurveyDetail surveyId={selectedSurveyId} onBack={() => navigate('surveys')} onNavigate={navigate} />
          )}
          {view === 'create-survey' && <CreateSurvey onNavigate={navigate} />}
          {view === 'publish' && <Publish />}
          {view === 'copilot' && <Copilot />}
          {view === 'settings' && <Settings />}
        </main>
      </div>

      <MobileNav current={view} onNavigate={navigate} />
    </div>
  );
}

export default App;
