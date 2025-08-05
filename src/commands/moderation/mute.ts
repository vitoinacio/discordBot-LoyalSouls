import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  EmbedBuilder,
  GuildMember,
  Role,
} from 'discord.js';
import { Command } from '../../structs/types/Command';
import { addMute } from '../../api/mutes';
import { getLogChannel } from '../../api/logsChannel';
import { checkPermission } from '../../helpers/permissions';

export default new Command({
  name: 'mute',
  description: 'Mute um usuário do servidor',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'member',
      description: 'Usuário a ser mutado',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'tempo',
      description: 'Duração do mute (ex: 10m, 1h, 2d)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'motivo',
      description: 'Motivo do mute',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  async run({ interaction, options }) {
    const member = options.getMember('member');
    const reason = options.getString('motivo') || 'Sem motivo fornecido';

    // Verificações básicas
    if (
      !interaction.inGuild() ||
      !interaction.guild ||
      !member ||
      !(member instanceof GuildMember)
    ) {
      return;
    }

    function parseTempo(str: string): number | null {
      const match = str.match(/^(\d+)([smhd])$/i);
      if (!match) return null;

      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      const multipliers: Record<string, number> = {
        s: 1000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
      };

      return value * multipliers[unit];
    }

    const tempoStr = options.getString('tempo'); // pode ser "30m", "1h", etc.
    let tempoMs: number | null = null;

    await interaction.deferReply({ ephemeral: false });

    const autor = interaction.member;
    if (!(autor instanceof GuildMember)) {
      return interaction.editReply({
        content: '❌ Não consegui validar suas permissões.',
      });
    }

    // Verifica se cargo "muted" existe
    let muteRole: Role | undefined = interaction.guild.roles.cache.find(
      (role) => role.name === 'muted',
    );

    // Cria o cargo se não existir
    if (!muteRole) {
      muteRole = await interaction.guild.roles.create({
        name: 'muted',
        color: '#671b00',
        permissions: [],
        reason: 'Cargo "muted" criado via bot',
      });

      // Aplica overwrites em canais
      interaction.guild.channels.cache.forEach(async (channel) => {
        if (!channel.isTextBased() || !('permissionOverwrites' in channel))
          return;

        try {
          if (!channel.permissionOverwrites.cache.has(muteRole!.id)) {
            await channel.permissionOverwrites.create(muteRole!, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
              Connect: false,
              SendMessagesInThreads: false,
              CreatePublicThreads: false,
              CreatePrivateThreads: false,
            });
          }
        } catch (error) {
          console.error(
            `Erro ao aplicar overwrites no canal ${channel.name}:`,
            error,
          );
        }
      });
    }

    const botMember = interaction.guild.members.me;

    if (tempoStr) {
      tempoMs = parseTempo(tempoStr);

      if (tempoMs === null) {
        return interaction.editReply({
          content: '❌ Formato de tempo inválido. Use `10m`, `1h`, `2d`, etc.',
        });
      }
    }

    if (!(interaction.member instanceof GuildMember)) {
      return interaction.editReply({
        content: '❌ Não foi possível validar seu cargo.',
      });
    }

    const hasPermission = await checkPermission(
      interaction.guildId!,
      'mute',
      interaction.member,
    );

    if (!hasPermission) {
      return interaction.editReply({
        content: '❌ Você não tem permissão para usar este comando.',
      });
    }

    // Verificações de bloqueio
    if (member.roles.cache.has(muteRole.id)) {
      return interaction.editReply({
        content: '⚠️ Esse membro já está mutado.',
      });
    }

    if (
      muteRole &&
      botMember &&
      botMember.roles.highest.position <= muteRole.position
    ) {
      return interaction.editReply({
        content:
          '⚠️ Não posso aplicar o cargo "muted". Verifique a hierarquia de cargos do bot.',
      });
    }

    if (botMember && botMember.id === member.id) {
      return interaction.editReply({
        content: '❌ Não posso me mutar.',
      });
    }

    if (
      botMember &&
      botMember.roles.highest.position <= member.roles.highest.position
    ) {
      return interaction.editReply({
        content: '❌ Não posso mutar alguém com cargo superior.',
      });
    }

    if (autor.roles.highest.position <= member.roles.highest.position) {
      return interaction.editReply({
        content:
          '❌ Você não pode mutar alguém com cargo igual ou superior ao seu.',
      });
    }

    // Aplica o mute
    try {
      await member.roles.add(muteRole!);
      await interaction.editReply({
        content: `🔇 ${member.user.tag} foi mutado${
          tempoStr ? ` por ${tempoStr}` : ''
        }.`,
      });
      if (tempoMs) {
        if (tempoMs) {
          await addMute({
            userId: member.id,
            guildId: interaction.guild.id,
            roleId: muteRole.id,
            unmuteAt: Date.now() + tempoMs,
            mutedBy: interaction.user.id,
          });
        }
      }
      const logChannelId = await getLogChannel(interaction.guild.id, 'mute');
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('🔇 Usuário Mutado')
            .setColor('DarkRed')
            .addFields(
              {
                name: '👤 Usuário',
                value: `${member.user} \`(${member.id})\``,
                inline: false,
              },
              {
                name: '🔧 Mutado por',
                value: `${interaction.user} \`(${interaction.user.id})\``,
                inline: false,
              },
              {
                name: '📄 Motivo',
                value: reason,
                inline: false,
              },
              tempoStr
                ? {
                    name: '⏱️ Duração',
                    value: tempoStr,
                    inline: true,
                  }
                : {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true,
                  },
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar mutar o membro.',
      });
    } finally {
      // Apaga a resposta após 5 segundos
      setTimeout(() => {
        interaction.deleteReply().catch(() => null);
      }, 5000);
    }
  },
});
