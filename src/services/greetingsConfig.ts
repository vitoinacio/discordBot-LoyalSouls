import { supabase } from '../lib/supabaseClient';

export interface GreetingConfig {
  guildId: string;
  channelId: string;
  message: string;
  duration?: number;
}

export const setGreetingConfig = async (
  guildId: string,
  data: Omit<GreetingConfig, 'guildId'>,
) => {
  await supabase
    .from('greetings')
    .upsert([{ guildId, ...data }], { onConflict: 'guildId' });
};

export const getGreetingConfig = async (
  guildId: string,
): Promise<GreetingConfig | null> => {
  const { data, error } = await supabase
    .from('greetings')
    .select('*')
    .eq('guildId', guildId)
    .single();

  if (error) return null;
  return data;
};
