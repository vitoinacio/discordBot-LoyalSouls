import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  GuildMember,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { removeMute } from '../../api/mutes';
import { getLogChannel } from '../../api/logsChannel';

export default new Command({
  name: 'unmute',
  description: 'Desmuta um usuário do servidor',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'member',
      description: 'Usuário que será desmutado',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  async run({ interaction, options }) {
    if (!interaction.inGuild() || !interaction.guild) return;

    const member = options.getMember('member') as GuildMember;
    if (!member) {
      return interaction.reply({
        content: '❌ Membro não encontrado.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const muteRole = interaction.guild.roles.cache.find(
      (role) => role.name.toLowerCase() === 'muted',
    );

    if (!muteRole || !member.roles.cache.has(muteRole.id)) {
      return interaction.editReply({
        content: '⚠️ Esse usuário não está mutado.',
      });
    }

    const autor = interaction.member as GuildMember;

    // Verificações de hierarquia
    const botMember = interaction.guild.members.me;
    if (
      botMember &&
      botMember.roles.highest.position <= member.roles.highest.position
    ) {
      return interaction.editReply({
        content: '❌ Não posso desmutar alguém com cargo superior ao meu.',
      });
    }

    if (
      autor.roles.highest.position <= member.roles.highest.position &&
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return interaction.editReply({
        content:
          '❌ Você não pode desmutar alguém com cargo igual ou superior ao seu.',
      });
    }

    // Tenta remover o cargo e o registro
    try {
      await member.roles.remove(muteRole);
      await removeMute(member.id, interaction.guild.id);

      await interaction.editReply({
        content: `🔊 ${member.user.tag} foi desmutado com sucesso.`,
      });

      // Enviar embed no canal de log (se configurado)
      const logChannelId = await getLogChannel(interaction.guild.id, 'mute');
      const logChannel = logChannelId
        ? interaction.guild.channels.cache.get(logChannelId)
        : null;

      if (logChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('🔊 Usuário Desmutado')
          .setColor('Green')
          .addFields(
            {
              name: '👤 Usuário',
              value: `${member.user} \`(${member.id})\``,
              inline: false,
            },
            {
              name: '👮 Desmutado por',
              value: `${interaction.user} \`(${interaction.user.id})\``,
              inline: false,
            },
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar desmutar o membro.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
