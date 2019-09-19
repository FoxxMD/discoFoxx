import {Command, CommandInfo, CommandMessage, CommandoClient} from 'discord.js-commando';
import {Pubg} from "../../../features";

export abstract class AbstractPubgCommand extends Command {

    pub: Pubg;

    protected constructor(pubInstance: Pubg, client: CommandoClient, info: CommandInfo) {
        super(client, info);
        this.pub = pubInstance;
    }

    hasPermission(msg: CommandMessage) {
        return this.pub.hasInteractionPermissions(msg.message.member);
    }
}

export default AbstractPubgCommand;
