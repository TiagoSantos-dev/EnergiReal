import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Substitua os valores abaixo pelas chaves do seu projeto Supabase.
// Você encontra essas chaves em: Project Settings -> API
const SUPABASE_URL = 'https://sua-url-do-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-publica-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
