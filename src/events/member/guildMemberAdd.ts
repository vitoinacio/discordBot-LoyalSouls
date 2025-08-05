import { getGreetingConfig } from '../../api/greetingsConfig';
import { getLogChannel } from '../../api/logsChannel';
import { Event } from '../../structs/types/Event';
import { EmbedBuilder, TextChannel } from 'discord.js';

export default new Event({
  name: 'guildMemberAdd',
  run: async (member) => {
    const config = await getGreetingConfig(member.guild.id);
    const logChannelId = await getLogChannel(member.guild.id, 'greeting');

    // Saudação personalizada
    if (config) {
      const greetingChannel = member.guild.channels.cache.get(config.channelId);
      if (greetingChannel?.isTextBased()) {

        let messageText = config.message
          .replace('{user}', `<@${member.id}>`)
          .replace('{guild}', member.guild.name)
          .replace(/\{(\d{17,20})\}/g, '<#$1>');

        const sentMessage = await greetingChannel.send({
          content: messageText,
        });

        // Deleta a saudação após X segundos, se configurado
        if (config.duration && config.duration > 0) {
          setTimeout(() => {
            sentMessage.delete().catch(() => null);
          }, config.duration * 1000);
        }
      }
    }

    // Log de entrada
    if (logChannelId) {
      const logChannel = member.guild.channels.cache.get(logChannelId);
      if (logChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('📥 Novo membro entrou')
          .setColor('Green')
          .addFields(
            { name: 'Usuário', value: `${member.user} (\`${member.id}\`)` },
            {
              name: 'Criado em',
              value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
            {
              name: 'Entrou em',
              value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`,
              inline: true,
            },
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        (logChannel as TextChannel).send({ embeds: [embed] });
      }
    }
  },
});
