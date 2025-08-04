import { supabase } from '../lib/supabaseClient';

export interface LogConfig {
  guildId: string;
  type: string; // Ex: "mute", "ban", "memberJoin", etc.
  channelId: string; // ID do canal de log
}

// 🔹 Obtém o canal de log para um tipo específico em uma guilda
export const getLogChannel = async (
  guildId: string,
  type: string,
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('log_channels')
    .select('channelId')
    .eq('guildId', guildId)
    .eq('type', type)
    .single();

  if (error && error.code !== 'PGRST116') {
    // erro diferente de "no rows returned"
    throw error;
  }

  return data?.channelId ?? null;
};

// 🔹 Define (ou substitui) o canal de log para um tipo
export const setLogChannel = async (
  guildId: string,
  type: string,
  channelId: string,
): Promise<void> => {
  // Remove qualquer configuração existente
  const { error: deleteError } = await supabase
    .from('log_channels')
    .delete()
    .match({ guildId, type });

  if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;

  // Insere nova configuração
  const { error: insertError } = await supabase
    .from('log_channels')
    .insert([{ guildId, type, channelId }]);

  if (insertError) throw insertError;
};

// 🔹 Lista todas as configurações de logs
export const getAllConfigs = async (): Promise<LogConfig[]> => {
  const { data, error } = await supabase.from('log_channels').select('*');
  if (error) throw error;
  return data;
};

export const removeLogChannel = async (
  guildId: string,
  type: string,
): Promise<boolean> => {
  const { error, count } = await supabase
    .from('log_channels')
    .delete({ count: 'exact' }) // 👈 adiciona contagem de linhas afetadas
    .match({ guildId, type });

  if (error) throw error;
  return !!count;
};
