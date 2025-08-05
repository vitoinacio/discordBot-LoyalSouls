import fs from 'fs/promises';
import path from 'path';

const file = path.resolve(__dirname, '../data/greetings.json');

export interface GreetingConfig {
  guildId: string;
  channelId: string;
  message: string;
  duration?: number;
}

// 🔹 Define ou atualiza a configuração de saudação
export const setGreetingConfig = async (
  guildId: string,
  data: Omit<GreetingConfig, 'guildId'>,
): Promise<void> => {
  const configs = await getAllGreetingConfigs();

  const filtered = configs.filter((c) => c.guildId !== guildId);
  filtered.push({ guildId, ...data });

  await fs.writeFile(file, JSON.stringify(filtered, null, 2));
};

// 🔹 Obtém a configuração de saudação para uma guilda
export const getGreetingConfig = async (
  guildId: string,
): Promise<GreetingConfig | null> => {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const configs: GreetingConfig[] = JSON.parse(raw);
    return configs.find((c) => c.guildId === guildId) ?? null;
  } catch {
    return null;
  }
};

// 🔹 Lista todas as configurações salvas
export const getAllGreetingConfigs = async (): Promise<GreetingConfig[]> => {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};
