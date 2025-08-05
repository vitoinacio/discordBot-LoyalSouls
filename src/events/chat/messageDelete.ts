import { EmbedBuilder, TextChannel } from 'discord.js';
import { Event } from '../../structs/types/Event';
import { getLogChannel } from '../../api/logsChannel';

export default new Event({
  name: 'messageDelete',
  async run(message) {
    // Ignorar DMs ou mensagens de sistema
    if (!message.guild || !message.channel || message.system) return;

    // Ignorar mensagens sem conteúdo (ex: attachments puros, embeds?)
    const conteudo = message.content?.slice(0, 1000) || '*Sem conteúdo*';

    const logChannelId = await getLogChannel(message.guild.id, 'deletMenssage');
    if (!logChannelId) return;

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Mensagem deletada')
      .setColor('DarkRed')
      .addFields(
        {
          name: 'Usuário',
          value: `${message.author ?? 'Desconhecido'} (\`${message.author?.id ?? '??'}\`)`,
          inline: false,
        },
        {
          name: 'Canal',
          value: `${message.channel}`,
          inline: false,
        },
        {
          name: 'Conteúdo',
          value: conteudo,
          inline: false,
        },
      )
      .setTimestamp();

    (logChannel as TextChannel).send({ embeds: [embed] }).catch(() => null);
  },
});