import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
  EmbedBuilder,
  Collection,
  Message,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { getLogChannel } from '../../api/logsChannel';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'clear',
  description:
    'Apaga mensagens do canal. Pode filtrar por usuário. Qualquer um pode apagar as próprias.',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'quantidade',
      description: 'Quantidade de mensagens (1 a 500)',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
      maxValue: 500,
    },
    {
      name: 'usuario',
      description: 'Usuário cujas mensagens serão apagadas',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  async run({ interaction, options }) {
    const quantidade = options.getInteger('quantidade') ?? 50;
    const alvo = options.getUser('usuario');
    const canal = interaction.channel;
    const autor = interaction.member;

    if (!canal || canal.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '❌ Só é possível usar esse comando em canais de texto.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const solicitandoOutro = !alvo || alvo.id !== interaction.user.id;
    const isAutorizado = await checkPermission(
      interaction.guildId!,
      'clear',
      autor as GuildMember,
    );

    if (solicitandoOutro && !isAutorizado) {
      return interaction.editReply({
        content: '❌ Você só pode deletar suas próprias mensagens.',
      });
    }

    try {
      const coletadas = [];
      let lastMessageId: string | undefined = undefined;

      while (coletadas.length < quantidade) {
        const batch: Collection<
          string,
          Message<true>
        > = await canal.messages.fetch({
          limit: 100,
          ...(lastMessageId ? { before: lastMessageId } : {}),
        });

        if (batch.size === 0) break;

        const mensagens = [...batch.values()].filter((m) => !m.pinned);
        if (alvo) {
          coletadas.push(...mensagens.filter((m) => m.author.id === alvo.id));
        } else {
          coletadas.push(...mensagens);
        }

        lastMessageId = batch.last()?.id;
        if (batch.size < 100) break;
      }

      const apagar = coletadas.slice(0, quantidade);
      let deletadasTotal = 0;

      for (let i = 0; i < apagar.length; i += 100) {
        const slice = apagar.slice(i, i + 100);
        const deletadas = await canal.bulkDelete(slice, true);
        deletadasTotal += deletadas.size;
      }

      const resposta = `🧹 ${deletadasTotal} mensagens${
        alvo ? ` de ${alvo}` : ''
      } foram apagadas.`;
      await interaction.editReply({ content: resposta });

      // Envia para log
      const logChannelId = await getLogChannel(interaction.guildId!, 'clear');
      if (logChannelId) {
        const logChannel = interaction.guild!.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('🧹 Mensagens apagadas')
            .setColor('Red')
            .addFields(
              {
                name: 'Executor',
                value: `${interaction.user} (\`${interaction.user.id}\`)`,
              },
              {
                name: 'Canal',
                value: `${canal}`,
              },
              {
                name: 'Quantidade',
                value: `${deletadasTotal}`,
                inline: true,
              },
              ...(alvo
                ? [
                    {
                      name: 'Usuário alvo',
                      value: `${alvo} (\`${alvo.id}\`)`,
                      inline: true,
                    },
                  ]
                : []),
            )
            .setTimestamp();

          await (logChannel as TextChannel).send({ embeds: [embed] });
        }
      }
    } catch (err) {
      console.error('Erro ao deletar mensagens:', err);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar apagar as mensagens.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
