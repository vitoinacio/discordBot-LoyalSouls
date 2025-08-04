import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  GuildMember,
  TextChannel,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { setLogChannel } from '../../api/logsChannel';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'setlog',
  description: 'Define o canal de log para um tipo específico de evento',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'tipo',
      description: 'Tipo de log que será configurado',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Mute', value: 'mute' },
        { name: 'Ban', value: 'ban' },
        { name: 'expulsar', value: 'memberKick' },
        { name: 'castigo', value: 'memberTimeout' },
        { name: 'Entrada de Membro', value: 'memberJoin' },
        { name: 'Saída de Membro', value: 'memberLeave' },
        { name: 'Entrada/Saída de Call', value: 'voiceState' },
        { name: 'Criação de Cargo', value: 'roleCreate' },
        { name: 'Exclusão de Cargo', value: 'roleDelete' },
        { name: 'Exclusão de Canal', value: 'channelDelete' },
      ],
    },
    {
      name: 'canal',
      description: 'Canal onde os logs serão enviados',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channel_types: [ChannelType.GuildText],
    },
  ],

  async run({ interaction, options }) {
    if (!interaction.guild) return;

    const canal = options.getChannel('canal') as TextChannel;
    const tipo = options.getString('tipo') as string;

    await interaction.deferReply({ ephemeral: true });

    if (!(interaction.member instanceof GuildMember)) {
      return interaction.reply({
        content: '❌ Não foi possível validar seu cargo.',
        ephemeral: true,
      });
    }

    const hasPermission = await checkPermission(
      interaction.guildId!,
      'setLogs',
      interaction.member,
    );

    if (!hasPermission) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
      });
    }

    try {
      await setLogChannel(interaction.guild.id, tipo, canal.id);

      await interaction.editReply({
        content: `✅ Canal de log para **${tipo}** definido como ${canal}.`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar setar o canal de log.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
