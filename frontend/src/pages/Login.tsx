import { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../auth';

const Login = () => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(username, password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="LOGE" className="h-16 w-auto object-contain mb-3" />
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-bold">Sistema de Gestión</p>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="bg-white rounded-3xl shadow-modal ring-1 ring-gray-100 p-8 space-y-5"
        >
          <div>
            <h1 className="text-lg font-black text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-gray-400 mt-0.5">Acceso al CRM de LOGE</p>
          </div>

          <div>
            <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                data-1p-ignore
                data-lpignore="true"
                className="input pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 rounded-2xl font-bold disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-300 mt-6 font-medium">LOGE S.L. · Acceso privado</p>
      </div>
    </div>
  );
};

export default Login;
