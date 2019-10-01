import {CommandMessage, CommandoClient} from 'discord.js-commando';
import {stripIndents} from 'common-tags';
import {Pubg, PubError} from "../../../features";
import {GuildMember} from "discord.js";
import AbstractPubgCommand from "./pubg";

export class PubMatch extends AbstractPubgCommand {

    constructor(pubInstance: Pubg, client: CommandoClient) {
        super(pubInstance, client, {
            name: 'pub-match',
            memberName: 'match',
            group: 'pubg',
            guildOnly: true,
            description: 'Get a summary of a finished PUBG match',
            examples: ['!pub-match last', '!pub-match 1c1650da-adde-452e-aa4b-970a0db893ca'],
            args: [
                {
                    key: 'match',
                    type: 'string',
                    prompt: stripIndents`Which match should I retrieve?
                    Possible values: \`last\` or a PUBG Match ID`,
                },
                {
                    key: 'user',
                    type: 'member',
                    prompt: 'Which Discord User to get match for? Default is yourself',
                    default: (msg: CommandMessage) => msg.message.member
                },
                {
                    key: 'location',
                    type: 'string',
                    prompt: stripIndents`Where should I post the results?
                    Possible values: \`DM\` or \`Here\``,
                    validate: (text: string) => {
                        if (!['dm', 'here'].includes(text.toLocaleLowerCase())) {
                            return 'Location must be either `DM` or `Here`'
                        }
                        return true;
                    },
                    default: 'dm'
                },
            ]
        });
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {match, user, location} = args as { match: string, user: GuildMember, location: string };
        const {message: msg} = cmdMsg;
        try {
            const result = match === 'last' ? await this.pub.displayGroupMatch(user) : await this.pub.displayGroupMatch(user, match);
            switch (location.toLocaleLowerCase()) {
                case 'dm':
                    if (msg.deletable) {
                        await msg.delete();
                    }
                    return cmdMsg.direct(result);
                    //return msg.author.send(result);
                case 'here':
                    return cmdMsg.say(result);
                    //return msg.channel.send(result);
                default:
                    return msg.channel.send('Location must be either `DM` or `Here`');
            }
        } catch (e) {
            if (e instanceof PubError) {
                return msg.channel.send(e.message);
            }
            throw e;
        }
    }
}
