import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Substitua os valores abaixo pelas chaves do seu projeto Supabase.
// Você encontra essas chaves em: Project Settings -> API
const SUPABASE_URL = 'https://qgfetyeaohhajgrpceif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZmV0eWVhb2hoYWpncnBjZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzQ0MjksImV4cCI6MjA4MDI1MDQyOX0.zD3PeqZjwGLv1cz605zPPT5N0dmGrMOBpR6DHEpdMfQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
