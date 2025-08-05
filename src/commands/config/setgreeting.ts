import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { setGreetingConfig } from '../../api/greetingsConfig';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'setgreeting',
  description:
    'Configura a saudação para novos membros. Suporta variáveis como {user}, {guild} e {canalId}.',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: 'canal',
      description: 'Canal onde a saudação será enviada',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channel_types: [ChannelType.GuildText],
    },
    {
      name: 'mensagem',
      description:
        'Mensagem de boas-vindas. Use {user}, {guild} e {123456789012345678} para mencionar canais.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'tempo',
      description:
        'Tempo (em segundos) para a mensagem sumir (1 a 20). Deixe vazio para não apagar.',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: 1,
      maxValue: 20,
    },
  ],

  async run({ interaction, options }) {
    const canal = options.getChannel('canal') as TextChannel;
    let mensagem = options.getString('mensagem')!;
    const tempo = options.getInteger('tempo') ?? 5;

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

    // 🔒 Substitui apenas {IDs} por menções <#ID>
    mensagem = mensagem.replace(/\{(\d{17,20})\}/g, '<#$1>');

    await setGreetingConfig(interaction.guildId!, {
      channelId: canal.id,
      message: mensagem,
      duration: tempo,
    });

    await interaction.editReply({
      content: `Saudação configurada com sucesso!\n\nCanal: ${canal}\nMensagem: "${mensagem}"\n${`A mensagem será apagada após ${tempo}s.`}`,
    });

    // Apaga a resposta após 5s
    setTimeout(() => {
      interaction.deleteReply().catch(() => null);
    }, 5000);
  },
});
