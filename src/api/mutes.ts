import fs from 'fs/promises';
import path from 'path';

export interface MuteRecord {
  userId: string;
  guildId: string;
  roleId: string;
  unmuteAt: number;
  mutedBy: string;
}

const filePath = path.resolve(__dirname, '../data/mutes.json');

export const getMutes = async (): Promise<MuteRecord[]> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addMute = async (mute: MuteRecord): Promise<void> => {
  const mutes = await getMutes();
  mutes.push(mute);
  await fs.writeFile(filePath, JSON.stringify(mutes, null, 2));
};

export const removeMute = async (
  userId: string,
  guildId: string
): Promise<void> => {
  const mutes = await getMutes();
  const updated = mutes.filter(
    (m) => !(m.userId === userId && m.guildId === guildId)
  );
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
};

export const getExpiredMutes = async (): Promise<MuteRecord[]> => {
  const now = Date.now();
  const mutes = await getMutes();
  return mutes.filter((m) => m.unmuteAt <= now);
};

