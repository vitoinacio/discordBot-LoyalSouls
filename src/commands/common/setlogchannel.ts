import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  TextChannel,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { setLogChannel } from '../../api/logsChannel';

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
