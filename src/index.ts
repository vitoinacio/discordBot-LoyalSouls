process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import { EmbedBuilder } from 'discord.js';
import { ExtendedClient } from './structs/ExtendedClient';
export * from 'colors';

const client = new ExtendedClient();

client.start();

export { client };

client.on('ready', () => {
  console.log('Bot Online'.green);
});

function formatarTempo(segundos: number): string {
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const seg = Math.floor(segundos % 60);
  return `${dias}d ${horas}h ${minutos}m ${seg}s`;
}

client.on('messageCreate', (message) => {
  if (message.author.bot || message.content !== '!ping') return;

  const latency = Date.now() - message.createdTimestamp;
  const apiPing = Math.round(client.ws.ping);
  const uptimeFormatado = formatarTempo(process.uptime());
  const { tag: userTag, id: userId } = message.author;
  const servidores = client.guilds.cache.size;

  if (!client.user) return;

  const formatUser = client.user.avatar?.startsWith('a_') ? 'gif' : 'png';
  const formatAuthor = message.author.avatar?.startsWith('a_') ? 'gif' : 'png';

  const embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('🏓 Ping Report')
    .setDescription(
      [
        `📊 **Estatísticas do bot:**`,
        ``,
        `📡 **Latência da Mensagem:** ${latency}ms`,
        `🌐 **Ping da API:** ${apiPing}ms`,
        `⏳ **Uptime:** ${uptimeFormatado}`,
        `🧩 **Servidores Ativos:** ${servidores}`,
        `👤 **Usuário:** ${userTag} \`(${userId})\``,
        ``,
        `Bot LoyalSouls - Desenvolvido por Zenon`,
      ].join('\n'),
    )
    .setThumbnail(client.user.displayAvatarURL({ extension: formatUser }))
    .setFooter({
      text: `Comando executado por ${userTag}`,
      iconURL: message.author.displayAvatarURL({ extension: formatAuthor }),
    })
    .setTimestamp();

  message.reply({ embeds: [embed] });
});
