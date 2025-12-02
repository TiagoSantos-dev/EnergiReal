import { createClient } from '@supabase/supabase-js';

// Função auxiliar para tentar ler variáveis de ambiente sem quebrar a aplicação
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {
    // Silent fail
  }
  return '';
};

// --- ESTRATÉGIA DE CONFIGURAÇÃO ---
// 1. Variáveis de Ambiente (.env) - Prioridade Máxima
// 2. LocalStorage (Configurado via UI) - Prioridade Secundária (Útil para Preview/Dev)
// 3. Fallback (Placeholders)

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_project_url') : '';
const storageKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : '';

// Placeholders (não apague isso para não quebrar o build, mas não vai conectar se não configurar)
const FALLBACK_URL = 'https://qgfetyeaohhajgrpceif.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZmV0eWVhb2hoYWpncnBjZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzQ0MjksImV4cCI6MjA4MDI1MDQyOX0.zD3PeqZjwGLv1cz605zPPT5N0dmGrMOBpR6DHEpdMfQ';

// Decisão final da URL/KEY
const SUPABASE_URL = (envUrl && envUrl.length > 10) ? envUrl : ((storageUrl && storageUrl.length > 10) ? storageUrl : FALLBACK_URL);
const SUPABASE_ANON_KEY = (envKey && envKey.length > 10) ? envKey : ((storageKey && storageKey.length > 10) ? storageKey : FALLBACK_KEY);

// Exportar funções para a UI conseguir atualizar
export const updateSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('supabase_project_url', url);
    localStorage.setItem('supabase_anon_key', key);
    window.location.reload(); // Recarrega para aplicar o novo client
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);