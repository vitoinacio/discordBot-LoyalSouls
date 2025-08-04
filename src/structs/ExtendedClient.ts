import {
  Client,
  Partials,
  IntentsBitField,
  BitFieldResolvable,
  GatewayIntentsString,
  Collection,
  ApplicationCommandDataResolvable,
  ClientEvents,
} from 'discord.js';
import dotenv from 'dotenv';
import {
  CommandType,
  ComponentsButton,
  ComponentsModal,
  ComponentsSelect,
} from './types/Command';
import fs from 'fs';
import path from 'path';
import { EventType } from './types/Event';

dotenv.config();

const fileCondition = (fileName: string) =>
  fileName.endsWith('.ts') || fileName.endsWith('.js');

export class ExtendedClient extends Client {
  public commands: Collection<string, CommandType> = new Collection();
  public buttons: ComponentsButton = new Collection();
  public selects: ComponentsSelect = new Collection();
  public modals: ComponentsModal = new Collection();
  constructor() {
    super({
      intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<
        GatewayIntentsString,
        number
      >,
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.SoundboardSound,
        Partials.ThreadMember,
        Partials.User,
      ],
    });
  }
  public start() {
    this.registerModules();
    this.registerEvents();
    this.login(process.env.BOT_TOKEN);
  }

  private registerCommands(commands: Array<ApplicationCommandDataResolvable>) {
    this.guilds.cache
      .get(process.env.GUILD_ID!)
      ?.commands.set(commands)
      .then(() => {
        console.log('✅ Slash commands (/) defined'.green);
      })
      .catch((error) => {
        console.log(
          `❌ an error occurred while trying to set the Slash Commands (/): \n${error}`
            .red,
        );
      });
  }

  private registerModules() {
    const slashCommands: Array<ApplicationCommandDataResolvable> = new Array();

    const commandPath = path.join(__dirname, '..', 'commands');

    (async () => {
      for (const local of fs.readdirSync(commandPath)) {
        const files = fs
          .readdirSync(path.join(commandPath, local))
          .filter(fileCondition);

        for (const fileName of files) {
          const filePath = path.join(commandPath, local, fileName);
          const commandModule = await import(filePath);
          const command: CommandType = commandModule?.default;

          if (!command?.name) continue;

          this.commands.set(command.name, command);
          slashCommands.push(command);

          if (command.buttons)
            command.buttons.forEach((run, key) => this.buttons.set(key, run));
          if (command.selects)
            command.selects.forEach((run, key) => this.selects.set(key, run));
          if (command.modals)
            command.modals.forEach((run, key) => this.modals.set(key, run));
        }
      }

      this.on('ready', () => this.registerCommands(slashCommands));
    })();
  }
  private registerEvents() {
    const eventsPath = path.join(__dirname, '..', 'events');

    fs.readdirSync(eventsPath).forEach((local) => {
      fs.readdirSync(`${eventsPath}/${local}`).filter(fileCondition)
      .forEach(async fileName => {
        const {name, once, run}: EventType<keyof ClientEvents> = (await import(`../events/${local}/${fileName}`))?.default

        try {
          if (name) (once) ? this.once(name, run) : this.on(name, run)
        } catch(error) {
          console.log(`An error occurred on event: ${name} \n${error}` .red)
        }
      });
    });
  }
}
