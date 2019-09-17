import {Command, CommandMessage, CommandoClient} from 'discord.js-commando';
import {Pubg} from "../../features";
import {Guild, GuildMember, Message, User} from "discord.js";

export class PubgCommand extends Command {

    pub: Pubg;

    constructor(pubInstance: Pubg, client: CommandoClient) {
        super(client, {
            name: 'pubg',
            group: 'gaming',
            memberName: 'pubg',
            guildOnly: true,
            description: 'Get PUBG stats',
            examples: ['!pubg lastMatch [@user]'],
            args: [
                {
                    key: 'action',
                    type: 'string',
                    // @ts-ignore
                    oneOf: ['username', 'remove', 'match'],
                    prompt: 'What do you want to do?',
                },
                {
                    key: 'value',
                    type: 'string',
                    prompt: 'What value for this action?',
                },
                // {
                //     key: 'user',
                //     type: 'member',
                //     prompt: 'Perform action on behalf of which user?',
                //     default: (msg: CommandMessage) => msg.author
                // }
            ]
        });
        this.pub = pubInstance;
    }

    hasPermission(msg: CommandMessage) {
        return this.pub.hasInteractionPermissions(msg.message.member);
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {action, value} = args as { action: string, value: string };
        const {message: msg} = cmdMsg;
        const actionedUser = msg.member;
        switch (action) {
            case 'username':

                const nick = value;

                if (nick === undefined || nick === '') {
                    return msg.channel.send('Must provide a valid PUBG username!');
                }

                const [exists, name] = await this.pub.pubNameExists(nick);

                if (exists && name !== msg.member.user.username && !this.pub.hasOpsPermissions(msg.member)) {
                    return msg.channel.send(`User ${name} has already claimed that username and you do not have permission to override`);
                }

                await this.pub.setPlayer(actionedUser, nick);
                return msg.channel.send('PUBG Username set');
            case 'remove':
                await this.pub.removePlayer(actionedUser);
                return msg.channel.send('Removed player from PUBG functions');
            case 'match':
                switch(value) {
                    case 'last':
                        const func = await this.pub.displayGroupMatch(actionedUser);
                        return func(msg);
                    default:
                        return msg.channel.send('Only last match is implemented right now!');
                }

            default:
                return msg.channel.send('I don\'t know that PUBG command yet! :^(');
        }
    }
}

export default PubgCommand;
