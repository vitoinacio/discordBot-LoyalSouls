import fs from 'fs/promises';
import path from 'path';

const file = path.resolve(__dirname, '../data/log_channels.json');

interface LogConfig {
  guildId: string;
  type: string;
  channelId: string;
}

// 🔹 Retorna o canal para um tipo específico de log
export const getLogChannel = async (
  guildId: string,
  type: string,
): Promise<string | null> => {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const list: LogConfig[] = JSON.parse(raw);
    return (
      list.find((c) => c.guildId === guildId && c.type === type)?.channelId ??
      null
    );
  } catch {
    return null;
  }
};

// 🔹 Define o canal de log para um tipo específico
export const setLogChannel = async (
  guildId: string,
  type: string,
  channelId: string,
): Promise<void> => {
  const list = await getAllConfigs();

  const updated = list.filter(
    (c) => !(c.guildId === guildId && c.type === type),
  );
  updated.push({ guildId, type, channelId });

  await fs.writeFile(file, JSON.stringify(updated, null, 2));
};

// 🔹 Lista todos os logs configurados
export const getAllConfigs = async (): Promise<LogConfig[]> => {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// 🔹 Remove o canal de log para um tipo específico
export const removeLogChannel = async (
  guildId: string,
  type: string,
): Promise<boolean> => {
  const list = await getAllConfigs();

  const originalLength = list.length;

  const updated = list.filter(
    (c) => !(c.guildId === guildId && c.type === type),
  );

  const changed = updated.length < originalLength;

  if (changed) {
    await fs.writeFile(file, JSON.stringify(updated, null, 2));
  }

  return changed;
};
