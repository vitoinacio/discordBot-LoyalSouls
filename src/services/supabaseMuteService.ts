import { supabase } from '../lib/supabaseClient';

export interface MuteRecord {
  userId: string;
  guildId: string;
  roleId: string;
  unmuteAt: number;
  mutedBy: string;
}

export const addMute = async (mute: MuteRecord) => {
  const { error } = await supabase.from('mutes').insert(mute);
  if (error) throw error;
};

export const getMutes = async (): Promise<MuteRecord[]> => {
  const { data, error } = await supabase.from('mutes').select('*');
  if (error) throw error;
  return data;
};

export const removeMute = async (userId: string, guildId: string) => {
  const { error } = await supabase
    .from('mutes')
    .delete()
    .match({ userId, guildId });
  if (error) throw error;
};

export const getExpiredMutes = async (): Promise<MuteRecord[]> => {
  const now = Date.now();
  const { data, error } = await supabase
    .from('mutes')
    .select('*')
    .lte('unmuteAt', now);
  if (error) throw error;
  return data;
};
