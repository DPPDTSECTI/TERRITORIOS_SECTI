import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vicaqpcluxkwbbbwdpkg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_jpW0W_VeeQXuHJ0XoKJwMg_FNiwdmzE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente anonimo isolado para leitura das tabelas/views publicas mesmo com usuario logado
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'secti-public-readonly',
  },
});