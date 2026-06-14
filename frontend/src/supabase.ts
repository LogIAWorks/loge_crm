import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Cliente Supabase para el login. La sesión se persiste y refresca sola.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'loge_crm_auth',
  },
});

// Los usuarios escriben solo "edu"/"oscar"; Supabase necesita un email interno.
const DOMAIN = '@loge.es';
export const usernameToEmail = (username: string) => {
  const u = (username || '').trim().toLowerCase();
  return u.includes('@') ? u : `${u}${DOMAIN}`;
};
