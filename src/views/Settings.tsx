import { useState, useEffect } from 'react';
import { Bell, Globe, Shield, Mail, Smartphone, Building2, Check, Save } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export function Settings() {
  const [orgName, setOrgName] = useState('Damm S.A.');
  const [orgSector, setOrgSector] = useState('Begudes i cereals');
  const [orgWeb, setOrgWeb] = useState('www.damm.com');

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(false);

  const [langUi, setLangUi] = useState('Català');
  const [langSurvey, setLangSurvey] = useState('Català');
  const [timezone, setTimezone] = useState('Europe/Madrid (CET)');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.organization) {
          setOrgName(data.organization.name ?? 'Damm S.A.');
          setOrgSector(data.organization.sector ?? 'Begudes i cereals');
          setOrgWeb(data.organization.web ?? 'www.damm.com');
        }
        if (data.notifications) {
          setNotifEmail(!!data.notifications.email);
          setNotifPush(!!data.notifications.push);
          setNotifWeekly(!!data.notifications.weekly);
          setNotifSecurity(!!data.notifications.security);
        }
        if (data.language) {
          setLangUi(data.language.interface ?? 'Català');
          setLangSurvey(data.language.surveys ?? 'Català');
          setTimezone(data.language.timezone ?? 'Europe/Madrid (CET)');
        }
      } catch (err) {
        console.warn('Backend settings fallback actiu:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: { name: orgName, sector: orgSector, web: orgWeb },
          notifications: {
            email: notifEmail,
            push: notifPush,
            weekly: notifWeekly,
            security: notifSecurity,
          },
          language: { interface: langUi, surveys: langSurvey, timezone: timezone },
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Error guardant configuració:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Configuració</h1>
          <p className="mt-1 text-sm text-ink-500">Gestiona les preferències del compte i de l'organització</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary inline-flex items-center gap-2 self-start px-4 py-2 text-sm shadow-xs"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Guardant...
            </>
          ) : savedSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Guardat amb èxit!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar canvis
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-damm-50 text-damm-600">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-semibold text-ink-900">Organització</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Nom</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Sector</label>
              <input
                type="text"
                value={orgSector}
                onChange={(e) => setOrgSector(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Web</label>
              <input
                type="text"
                value={orgWeb}
                onChange={(e) => setOrgWeb(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-damm-50 text-damm-600">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-semibold text-ink-900">Notificacions</h2>
          </div>
          <div className="space-y-3">
            <NotificationRow
              icon={Mail}
              label="Respostes noves per email"
              checked={notifEmail}
              onChange={() => setNotifEmail(!notifEmail)}
            />
            <NotificationRow
              icon={Smartphone}
              label="Alertes crítiques per push"
              checked={notifPush}
              onChange={() => setNotifPush(!notifPush)}
            />
            <NotificationRow
              icon={Bell}
              label="Resum setmanal d'activitat"
              checked={notifWeekly}
              onChange={() => setNotifWeekly(!notifWeekly)}
            />
            <NotificationRow
              icon={Shield}
              label="Notificacions de seguretat"
              checked={notifSecurity}
              onChange={() => setNotifSecurity(!notifSecurity)}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-damm-50 text-damm-600">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-semibold text-ink-900">Idioma i regió</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Idioma de la interfície</label>
              <select
                value={langUi}
                onChange={(e) => setLangUi(e.target.value)}
                className="input-field"
              >
                <option value="Català">Català</option>
                <option value="Español">Español</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Idioma per defecte de les enquestes</label>
              <select
                value={langSurvey}
                onChange={(e) => setLangSurvey(e.target.value)}
                className="input-field"
              >
                <option value="Català">Català</option>
                <option value="Español">Español</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Zona horària</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-field"
              >
                <option value="Europe/Madrid (CET)">Europe/Madrid (CET)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-damm-50 text-damm-600">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-semibold text-ink-900">Seguretat i privacitat</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <span className="text-ink-600">Xifratge de dades</span>
              <span className="badge bg-green-100 text-green-700">Actiu</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <span className="text-ink-600">Compliment GDPR</span>
              <span className="badge bg-green-100 text-green-700">Verificat</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <span className="text-ink-600">Autenticació de dos factors</span>
              <span className="badge bg-gold-100 text-gold-700">Recomanat</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3">
              <span className="text-ink-600">Retenció de dades</span>
              <span className="text-ink-500">24 mesos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  icon: Icon,
  label,
  checked = false,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-ink-600">
        <Icon className="h-4 w-4 text-ink-400" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-damm-600' : 'bg-ink-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
