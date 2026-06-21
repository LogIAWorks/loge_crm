import { useEffect, useState } from 'react';
import { Save, Key, Shield, CheckCircle2, Bot, Zap } from 'lucide-react';
import { api, authHeaders, jsonHeaders } from '../api';

const SECRET_KEYS = ['claude_api_key', 'openclaw_token', 'crm_api_key'];

const Settings = () => {
  // `configured` guarda solo si cada secreto existe (no su valor).
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  // `inputs` son valores NUEVOS que el usuario escribe; vacío = no tocar.
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/api/settings', { headers: authHeaders() })
      .then(res => res.json())
      .then((data: any) => {
        const conf: Record<string, boolean> = {};
        SECRET_KEYS.forEach(k => { conf[k] = !!data[k]; });
        setConfigured(conf);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Solo enviamos las claves que el usuario ha rellenado (no se pisa con vacío).
    const payload: Record<string, string> = {};
    SECRET_KEYS.forEach(k => { if (inputs[k]?.trim()) payload[k] = inputs[k].trim(); });
    if (Object.keys(payload).length > 0) {
      await api('/api/settings', { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(payload) });
      const conf = { ...configured };
      Object.keys(payload).forEach(k => { conf[k] = true; });
      setConfigured(conf);
      setInputs({});
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const placeholder = (k: string, fallback: string) =>
    configured[k] ? '•••••••••••• (configurado — escribe para cambiar)' : fallback;

  return (
    <div className="space-y-8 page-enter max-w-3xl">
      {/* Success toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-xl shadow-lg border border-emerald-200 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-medium text-sm">Ajustes guardados correctamente</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Claude API */}
        <div className="card space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 ring-1 ring-violet-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">Claude API (Anthropic)</h3>
              <p className="text-sm text-gray-400 mt-0.5">Permite que el asistente IA consulte y actualice el CRM directamente a través de la API REST.</p>
            </div>
            <div className={`px-2 py-1 rounded-md text-[11px] font-semibold ${configured.claude_api_key ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {configured.claude_api_key ? 'Configurado' : 'Sin configurar'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key de Claude</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Key className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="input pl-10 font-mono text-sm"
                value={inputs.claude_api_key || ''}
                onChange={e => setInputs({...inputs, claude_api_key: e.target.value})}
                placeholder={placeholder('claude_api_key', 'sk-ant-api03-...')}
              />
            </div>
          </div>
        </div>

        {/* OpenClaw */}
        <div className="card space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">OpenClaw Gateway</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Conecta con el bot de Telegram. URL base: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand">http://localhost:18789</code>
              </p>
            </div>
            <div className={`px-2 py-1 rounded-md text-[11px] font-semibold ${configured.openclaw_token ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {configured.openclaw_token ? 'Configurado' : 'Sin configurar'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Token de OpenClaw</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Key className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="input pl-10 font-mono text-sm"
                value={inputs.openclaw_token || ''}
                onChange={e => setInputs({...inputs, openclaw_token: e.target.value})}
                placeholder={placeholder('openclaw_token', 'Token de autenticación...')}
              />
            </div>
          </div>
        </div>

        {/* Internal CRM Auth */}
        <div className="card space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">Seguridad de la API</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Token requerido en el header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-brand">X-CRM-API-KEY</code> para acceso externo.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Token Interno</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Key className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="input pl-10 font-mono text-sm"
                value={inputs.crm_api_key || ''}
                onChange={e => setInputs({...inputs, crm_api_key: e.target.value})}
                placeholder={placeholder('crm_api_key', 'Token interno...')}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Este token lo usarán Claude y OpenClaw para autenticarse contra la API del CRM.
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
