import { supabase } from '../lib/supabase';
import { Reading, TariffConfig } from '../types';
import { DEFAULT_TARIFFS } from '../constants';

// --- Leituras (Readings) ---

export const getReadings = async (): Promise<Reading[]> => {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .order('data', { ascending: true });

  if (error) {
    console.error('Erro ao buscar leituras:', error);
    return [];
  }

  // Converter campos numéricos que podem vir como string do banco
  return (data || []).map((r: any) => ({
    ...r,
    leitura: Number(r.leitura)
  }));
};

export const saveReading = async (reading: Omit<Reading, 'id'>): Promise<Reading | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('readings')
    .insert([{
      user_id: user.id,
      data: reading.data,
      leitura: reading.leitura
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar leitura:', error);
    throw error;
  }

  return { ...data, leitura: Number(data.leitura) };
};

export const updateReading = async (updatedReading: Reading): Promise<Reading | null> => {
  const { data, error } = await supabase
    .from('readings')
    .update({ 
      data: updatedReading.data, 
      leitura: updatedReading.leitura 
    })
    .eq('id', updatedReading.id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar leitura:', error);
    throw error;
  }

  return { ...data, leitura: Number(data.leitura) };
};

export const deleteReading = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('readings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar leitura:', error);
    throw error;
  }
};

// --- Tarifas (Tariffs) ---

export const getTariffs = async (): Promise<TariffConfig> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_TARIFFS;

  const { data, error } = await supabase
    .from('user_configs')
    .select('tariffs')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar tarifas:', error);
  }

  if (data && data.tariffs) {
    let t = data.tariffs as any;

    // --- MIGRATION LOGIC (Runtime) ---
    // 1. Converter Iluminação Pública antiga (number) para objeto
    if (typeof t.iluminacaoPublica === 'number') {
        t.iluminacaoPublica = {
            tipo: 'fixo',
            valor: t.iluminacaoPublica
        };
    }
    // 2. Adicionar bandeira2 se não existir
    if (!t.bandeira.bandeira2) {
        t.bandeira.bandeira2 = {
            ativa: false,
            tipo: 'Amarela',
            valor: 0.01885
        };
    }
    // ---------------------------------

    return t as TariffConfig;
  }

  return DEFAULT_TARIFFS;
};

export const saveTariffs = async (tariffs: TariffConfig): Promise<TariffConfig> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('user_configs')
    .upsert({ 
      user_id: user.id, 
      tariffs: tariffs,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Erro ao salvar tarifas:', error);
    throw error;
  }

  return tariffs;
};