import { CommandInteractionOptionResolver } from 'discord.js';
import { client } from '../..';
import { Event } from '../../structs/types/Event';

export default new Event({
  name: 'interactionCreate',
  async run(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const options = interaction.options as CommandInteractionOptionResolver;

    try {
      await command.run({ client, interaction, options });
    } catch (err) {
      console.error(`Erro ao executar /${interaction.commandName}:`, err);
      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: '❌ Ocorreu um erro ao executar o comando.',
          })
          .catch(() => {});
      } else {
        await interaction
          .reply({
            content: '❌ Ocorreu um erro ao executar o comando.',
            ephemeral: true,
          })
          .catch(() => {});
      }
    }
  },
});
