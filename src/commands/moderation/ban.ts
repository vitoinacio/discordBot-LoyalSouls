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
  name: 'ban',
  description: 'bane um membro do servidor',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.KickMembers,
  options: [
    {
      name: 'member',
      description: 'Membro a ser banido',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'motivo',
      description: 'Motivo do ban',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  async run({ interaction, options }) {
    const member = options.getMember('member');
    const reason = options.getString('motivo') || 'Sem motivo fornecido';

    await interaction.deferReply({ ephemeral: false });

    if (
      !interaction.inGuild() ||
      !interaction.guild ||
      !member ||
      !(member instanceof GuildMember)
    ) {
      return interaction.editReply({
        content: '❌ Não foi possível identificar o membro.',
      });
    }

    const autor = interaction.member;
    const bot = interaction.guild.members.me;

    if (!(autor instanceof GuildMember) || !bot) {
      return interaction.editReply({
        content: '❌ Erro interno ao validar permissões.',
      });
    }

    if (!(interaction.member instanceof GuildMember)) {
      return interaction.editReply({
        content: '❌ Não foi possível validar seu cargo.',
      });
    }

    const hasPermission = await checkPermission(
      interaction.guildId!,
      'ban',
      interaction.member,
    );

    if (!hasPermission) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
      });
    }

    // 🔒 Verificações de segurança
    if (member.id === bot.id) {
      return interaction.editReply({
        content: '❌ Não posso me banir.',
      });
    }

    if (member.id === autor.id) {
      return interaction.editReply({
        content: '❌ Você não pode se banir.',
      });
    }

    if (bot.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply({
        content: '❌ Não consigo banir alguém com cargo superior ao meu.',
      });
    }

    if (autor.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply({
        content:
          '❌ Você não pode banir alguém com cargo igual ou superior ao seu.',
      });
    }

    try {
      await member.ban({ reason });
      await interaction.editReply({
        content: `✅ ${member.user.tag} foi banido`,
      });

      // Envia para canal de log, se configurado
      const logChannelId = await getLogChannel(interaction.guild.id, 'ban');
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('🚪 Membro Banido')
            .setColor('DarkOrange')
            .addFields(
              {
                name: '👤 Usuário',
                value: `${member.user} (\`${member.id}\`)`,
                inline: false,
              },
              {
                name: '🔨 Banido por',
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
      console.error('Erro ao banir:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar banir o membro.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
