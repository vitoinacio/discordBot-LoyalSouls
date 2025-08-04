import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../structs/types/Command';
import { addPermission } from '../../helpers/permissions';

// Exemplo simplificado
export default new Command({
  name: 'setrolepermissions',
  description: 'Define cargos autorizados para comandos de moderação',
  options: [
    {
      name: 'tipo',
      description: 'Comando (mute, ban, kick...)',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Mute', value: 'mute' },
        { name: 'Ban', value: 'ban' },
        { name: 'Kick', value: 'kick' },
        { name: 'castigo', value: 'timeout' },
        { name: 'setLogs', value: 'setLogs' },
      ],
    },
    {
      name: 'cargos',
      description: 'Cargos permitidos',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],
  async run({ interaction, options }) {
    // Verifica se é admin
    if (!interaction.memberPermissions?.has('Administrator')) {
      return interaction.reply({
        content: '❌ Apenas administradores podem usar este comando.',
        ephemeral: true,
      });
    }

    const type = options.getString('tipo', true);
    const role = options.getRole('cargos', true);

    await addPermission({
      guildId: interaction.guildId!,
      type,
      roleId: role.id,
    });

    await interaction.reply({
      content: `✅ Permissão para **${type}** concedida ao cargo ${role}.`,
      ephemeral: true,
    });

    // Apaga a resposta após 5 segundos
    setTimeout(() => {
      interaction.deleteReply().catch(() => null);
    }, 5000);
  },
});
