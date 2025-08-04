import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  Interaction,
} from 'discord.js';
import { Command } from '../../structs/types/Command';

function formatarTempo(segundos: number): string {
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const seg = Math.floor(segundos % 60);
  return `${dias}d ${horas}h ${minutos}m ${seg}s`;
}

export default new Command({
  name: 'ping',
  description: 'Replies with bot latency and stats',
  type: ApplicationCommandType.ChatInput,

  async run({ interaction, client }) {
    console.log(`/ping executado por ${interaction.user.tag}`);
    try {
      if (!interaction.isChatInputCommand() || !client.user) return;

      await interaction.deferReply({ ephemeral: true });

      const apiPing = Math.round(client.ws.ping);
      const latency = Date.now() - interaction.createdTimestamp;
      const uptime = formatarTempo(process.uptime());

      const userTag = interaction.user.tag;
      const userId = interaction.user.id;
      const servidores = client.guilds.cache.size;

      const userFormat = client.user.avatar?.startsWith('a_') ? 'gif' : 'png';
      const authorFormat = interaction.user.avatar?.startsWith('a_')
        ? 'gif'
        : 'png';

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('🏓 Ping Report')
        .setDescription(
          [
            '📊 **Estatísticas do Bot:**',
            '',
            `📡 **Latência da Mensagem:** ${latency}ms`,
            `🌐 **Ping da API:** ${apiPing}ms`,
            `⏳ **Tempo de Atividade:** ${uptime}`,
            `🧩 **Servidores Ativos:** ${servidores}`,
            `👤 **Usuário:** ${userTag} \`(${userId})\``,
            '',
            `Bot LoyalSouls - Developed by Zenon`,
          ].join('\n'),
        )
        .setThumbnail(client.user.displayAvatarURL({ extension: userFormat }))
        .setFooter({
          text: `Comando executado por ${userTag}`,
          iconURL: interaction.user.displayAvatarURL({
            extension: authorFormat,
          }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro no comando /ping:', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ Ocorreu um erro ao executar este comando.',
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao responder o comando.',
          ephemeral: true,
        });
      }
    }
  },
});
