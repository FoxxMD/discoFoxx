import carData from "./configs/CARS.json";
// uncomment if sounds are present
//import sounds from "./configs/sounds.json";
import env from '../env.json';
import {Message} from "discord.js";
import path from 'path';
import {open} from 'sqlite';
import HelloCommand from './commands/fun/hello';
import {CallAndResponse, Pubg, ClipPlayer, Szurubooru} from "../../src/features";
import {BotConstructorInterface, CommandoBot} from "../../src";
import {replyOnUsers} from "../../src/filters";
import {PubgCommand, MemeCommand, SoundCommand} from "../../src/commands";
import {getUserFromMention} from "../../src/utilities";

export interface userEventObj {
    func: Function,
    runOnce?: boolean,
    name?: string
}

class KitchenSink extends CommandoBot {

    constructor(props: BotConstructorInterface) {
        super({name: 'KitchenSink', ...props});
    }

    createMessageRoutines = (): userEventObj[] => {
        const car = new CallAndResponse(carData, this.client.user, true);

        const CAR = replyOnUsers(
            (msg: Message) => car.process(msg),
            {
                delay: {max: 1}, // delay maximum 1 second
            });

        return [
            {name: 'CAR', func: CAR}
        ];
    }
}

(async () => {
    try {

        const db = await open(path.join(__dirname, 'example.db'));
        const bot = new KitchenSink({env, db});

        bot.client.registry
            .registerDefaults()
            .registerGroups([
                ['fun', 'Odds and Ends'],
                ['memes', 'Gotta Post Em All!'],
                ['audio', 'Can you hear me now?'],
                ['gaming', 'E-sports and such']
            ]);

        // uncomment if pub env is present
        // const pub = new Pubg(db, env.pubg);
        // const pubCmd = new PubgCommand(pub, bot.client);
        // bot.client.registry.registerCommand(pubCmd);

        // uncomment if szuru env is present
        // const szuru = new Szurubooru(env.szurubooru.endpoints, env.szurubooru.token);
        // const memeCmd = new MemeCommand(szuru, bot.client);
        // bot.client.registry.registerCommand(memeCmd);

        // uncomment if sounds are present
        // const player = new ClipPlayer(sounds, path.join(__dirname, 'sounds'));
        // const soundCmd = new SoundCommand(player, bot.client);
        // bot.client.registry.registerCommand(soundCmd);

        const hello = new HelloCommand(bot.client);

        // @ts-ignore
        bot.client.dispatcher.addInhibitor(msg => {
            // prevent all DMs as being detected as commands
            // so a user can use CAR functionality in a DM with the bot
            if (msg.channel.type === 'dm') {
                if (msg.content.startsWith(bot.client.commandPrefix)) {
                    return false;
                }
                const mentionMatch = getUserFromMention(msg.content.split(/ +/)[0], msg.mentions.users);
                if (mentionMatch === undefined || mentionMatch.id !== bot.client.user.id) {
                    return 'no mention in first token or not a bot mention';
                }
                return false;
            }
            return false;
        });

        bot.once('ready', async (args: any) => {
            await bot.client.user.setActivity('Kitchen Sink Bot is online!');

            const routines = bot.createMessageRoutines();
            for (const routine of routines) {
                bot.on('message', routine.func, routine.name);
            }
        });

        bot.client.on('error', console.error);

        bot.run();

    } catch (e) {
        console.error(e);
    }
})();
