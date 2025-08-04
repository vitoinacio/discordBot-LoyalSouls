import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { getLogChannel } from '../../api/logsChannel';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'expulsar',
  description: 'Expulsa um membro do servidor',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.KickMembers,
  options: [
    {
      name: 'member',
      description: 'Membro a ser expulso',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'motivo',
      description: 'Motivo da expulsão',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  async run({ interaction, options }) {
    const member = options.getMember('member');
    const reason = options.getString('motivo') || 'Sem motivo fornecido';

    if (
      !interaction.inGuild() ||
      !interaction.guild ||
      !member ||
      !(member instanceof GuildMember)
    ) {
      return interaction.reply({
        content: '❌ Não foi possível identificar o membro.',
        ephemeral: true,
      });
    }

    const autor = interaction.member;
    const bot = interaction.guild.members.me;

    if (!(autor instanceof GuildMember) || !bot) {
      return interaction.reply({
        content: '❌ Erro interno ao validar permissões.',
        ephemeral: true,
      });
    }

    if (!(interaction.member instanceof GuildMember)) {
      return interaction.editReply({
        content: '❌ Não foi possível validar seu cargo.',
      });
    }

    const hasPermission = await checkPermission(
      interaction.guildId!,
      'kick',
      interaction.member,
    );

    if (!hasPermission) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
      });
    }

    // 🔒 Verificações de segurança
    if (member.id === bot.id) {
      return interaction.reply({
        content: '❌ Não posso me expulsar.',
        ephemeral: true,
      });
    }

    if (member.id === autor.id) {
      return interaction.reply({
        content: '❌ Você não pode se expulsar.',
        ephemeral: true,
      });
    }

    if (bot.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({
        content: '❌ Não consigo expulsar alguém com cargo superior ao meu.',
        ephemeral: true,
      });
    }

    if (autor.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({
        content:
          '❌ Você não pode expulsar alguém com cargo igual ou superior ao seu.',
        ephemeral: true,
      });
    }

    try {
      await member.kick(reason);
      await interaction.reply({
        content: `✅ ${member.user.tag} foi expulso com sucesso.`,
        ephemeral: true,
      });

      // Envia para canal de log, se configurado
      const logChannelId = await getLogChannel(
        interaction.guild.id,
        'memberKick',
      );
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('🚪 Membro Expulso')
            .setColor('DarkOrange')
            .addFields(
              {
                name: '👤 Usuário',
                value: `${member.user} (\`${member.id}\`)`,
                inline: false,
              },
              {
                name: '🔨 Expulso por',
                value: `${interaction.user} (\`${interaction.user.id}\`)`,
                inline: false,
              },
              {
                name: '📄 Motivo',
                value: reason,
                inline: false,
              },
            )
            .setTimestamp();

          await (logChannel as TextChannel).send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Erro ao expulsar:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar expulsar o membro.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
