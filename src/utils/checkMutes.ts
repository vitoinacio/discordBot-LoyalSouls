import { Client } from 'discord.js';
import { getExpiredMutes, removeMute } from '../api/mutes';
// import { getExpiredMutes, removeMute } from '../services/supabaseMuteService';

export async function verificarMutes(client: Client) {
  const expirados = await getExpiredMutes();

  for (const mute of expirados) {
    try {
      const guild = await client.guilds.fetch(mute.guildId);
      const member = await guild.members.fetch(mute.userId);
      await member.roles.remove(mute.roleId);
      console.log(`🔊 Desmutado automaticamente: ${member.user.tag}`);
    } catch (err) {
      console.error(`Erro ao desmutar ${mute.userId}:`, err);
    } finally {
      await removeMute(mute.userId, mute.guildId);
    }
  }
}
