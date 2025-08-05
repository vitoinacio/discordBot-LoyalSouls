import { EmbedBuilder, TextChannel } from 'discord.js';
import { Event } from '../../structs/types/Event';
import { getLogChannel } from '../../api/logsChannel';

export default new Event({
  name: 'guildMemberRemove',
  run: async (member) => {
    const logChannelId = await getLogChannel(member.guild.id, 'memberLeave');
    if (!logChannelId) return;

    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle('🚪 Membro saiu do servidor')
      .setColor('Orange')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        {
          name: 'Usuário',
          value: `${member.user.tag} (\`${member.id}\`)`,
          inline: false,
        },
        {
          name: 'Conta criada',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: 'Entrou no servidor',
          value: member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : 'Desconhecido',
          inline: true,
        },
      )
      .setTimestamp();

    await (logChannel as TextChannel).send({ embeds: [embed] }).catch(() => null);
  },
});
