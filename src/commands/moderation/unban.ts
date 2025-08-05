import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { getLogChannel } from '../../api/logsChannel';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'unban',
  description: 'Desbane um usuário do servidor pelo ID',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: 'user_id',
      description: 'ID do usuário a ser desbanido',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'motivo',
      description: 'Motivo do desbanimento',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  async run({ interaction, options }) {
    const userId = options.getString('user_id')!;
    const reason = options.getString('motivo') || 'Sem motivo fornecido';

    await interaction.deferReply({ ephemeral: false });

    if (!interaction.inGuild() || !interaction.guild) {
      return interaction.editReply({
        content: '❌ Comando só pode ser usado em servidores.',
      });
    }
    const autor = await interaction.guild.members.fetch(interaction.user.id);

    if (!('roles' in autor)) {
      return interaction.editReply({
        content: '❌ Não foi possível validar seu cargo.',
      });
    }


    const hasPermission = await checkPermission(
      interaction.guild.id,
      'ban',
      autor,
    );

    if (!hasPermission) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
      });
    }

    try {
      const banInfo = await interaction.guild.bans
        .fetch(userId)
        .catch(() => null);

      if (!banInfo) {
        return interaction.editReply({
          content: '⚠️ Esse usuário não está banido.',
        });
      }

      await interaction.guild.bans.remove(userId, reason);

      await interaction.editReply({
        content: `✅ Usuário com ID \`${userId}\` foi desbanido.`,
      });

      // Envia log se canal configurado
      const logChannelId = await getLogChannel(interaction.guild.id, 'ban');
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('✅ Usuário Desbanido')
            .setColor('Green')
            .addFields(
              { name: '🧾 ID do Usuário', value: `\`${userId}\`` },
              { name: '📄 Motivo', value: reason },
              {
                name: '👮‍♂️ Ação realizada por',
                value: `${interaction.user} (\`${interaction.user.id}\`)`,
              },
            )
            .setTimestamp();

          await (logChannel as TextChannel).send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Erro ao desbanir usuário:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar desbanir o usuário.',
      });
    }
  },
});
