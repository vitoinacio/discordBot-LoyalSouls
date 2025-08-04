import fs from 'fs/promises';
import path from 'path';
import { GuildMember } from 'discord.js';

// Caminho do arquivo onde as permissões ficarão salvas
const filePath = path.resolve(__dirname, '../data/moderation_permissions.json');

export interface ModerationPermission {
  guildId: string;
  type: string; // ex: "mute", "ban", "kick"
  roleIds: string[];
}

// 🔹 Lê todas as permissões salvas
export const getAllConfigs = async (): Promise<ModerationPermission[]> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// 🔹 Verifica se o membro tem permissão para um tipo de comando
export const checkPermission = async (
  guildId: string,
  type: string,
  member: GuildMember,
): Promise<boolean> => {
  const configs = await getAllConfigs();
  const entry = configs.find((c) => c.guildId === guildId && c.type === type);
  if (!entry) return false;

  return member.roles.cache.some((role) => entry.roleIds.includes(role.id));
};

// 🔹 Adiciona ou atualiza permissão de cargo para um tipo de comando
export const addPermission = async (config: {
  guildId: string;
  type: string;
  roleId: string;
}): Promise<void> => {
  const list = await getAllConfigs();

  const existing = list.find(
    (c) => c.guildId === config.guildId && c.type === config.type,
  );

  if (existing) {
    if (!existing.roleIds.includes(config.roleId)) {
      existing.roleIds.push(config.roleId);
    }
  } else {
    list.push({
      guildId: config.guildId,
      type: config.type,
      roleIds: [config.roleId],
    });
  }

  await fs.writeFile(filePath, JSON.stringify(list, null, 2));
};
