import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { removeLogChannel } from '../../api/logsChannel';

export default new Command({
  name: 'removelog',
  description: 'Remove o canal de log configurado para um tipo de evento',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'tipo',
      description: 'Tipo de log que será removido',
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
  ],

  async run({ interaction, options }) {
    if (!interaction.guild) return;

    const tipo = options.getString('tipo', true);

    try {
      const removed = await removeLogChannel(interaction.guild.id, tipo);

      if (removed) {
        await interaction.reply({
          content: `🗑️ O canal de log do tipo **${tipo}** foi removido com sucesso.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `⚠️ Nenhum log do tipo **${tipo}** estava configurado.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao tentar remover o log.',
        ephemeral: true,
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
