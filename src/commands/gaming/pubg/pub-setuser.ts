import {CommandMessage, CommandoClient} from 'discord.js-commando';
import {Pubg, PubError} from "../../../features";
import AbstractPubgCommand from "./pubg";
import {GuildMember} from "discord.js";

export class PubSetUser extends AbstractPubgCommand {

    constructor(pubInstance: Pubg, client: CommandoClient) {
        super(pubInstance, client, {
            name: 'pub-setuser',
            memberName: 'setuser',
            group: 'pubg',
            guildOnly: true,
            description: 'Set a PUBG username for a Discord User',
            examples: ['!pub-setuser FoxxMD'],
            args: [
                {
                    key: 'username',
                    type: 'string',
                    prompt: 'Enter the PUBG username to set',
                },
                {
                    key: 'user',
                    type: 'member',
                    prompt: 'Enter the Discord User to set the username for. Default is yourself.',
                    default: (msg: CommandMessage) => msg.message.author
                }
            ]
        });
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {username: nick, user: actionedUser} = args as { username: string, user: GuildMember };
        const {message: msg} = cmdMsg;

        if (actionedUser !== msg.member && !this.pub.hasOpsPermissions(msg.member)) {
            return msg.channel.send(`You do not have permission to set a username for other Users`);
        }

        if (nick === undefined || nick === '') {
            return msg.channel.send('Must provide a valid PUBG username!');
        }

        const [exists, name] = await this.pub.pubNameExists(nick);

        if (exists && name !== msg.member.user.username && !this.pub.hasOpsPermissions(msg.member)) {
            return msg.channel.send(`User ${name} has already claimed that username and you do not have permission to override`);
        }

        try {
            await this.pub.setPlayer(actionedUser, nick);
        } catch (e) {
            if (e instanceof PubError) {
                return msg.channel.send(`Cannot set username: ${e.message}`);
            }
            throw e;
        }
        await msg.react("✅");
        return msg;
    }
}
