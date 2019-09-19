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
            examples: ['!pub-match last @FoxxMD', '!pub-match 1c1650da-adde-452e-aa4b-970a0db893ca @FoxxMD'],
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
                }
            ]
        });
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {match, user} = args as { match: string, user: GuildMember };
        const {message: msg} = cmdMsg;
        try {
            if (match === 'last') {
                const func = await this.pub.displayGroupMatch(user);
                return func(msg);
            }
            const func = await this.pub.displayGroupMatch(user, match);
            return func(msg);

        } catch (e) {
            if (e instanceof PubError) {
                return msg.channel.send(e.message);
            }
            throw e;
        }
    }
}
