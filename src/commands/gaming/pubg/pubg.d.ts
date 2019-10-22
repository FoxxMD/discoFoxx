import { Command, CommandInfo, CommandMessage, CommandoClient } from 'discord.js-commando';
import { Pubg } from "../../../features";
export declare abstract class AbstractPubgCommand extends Command {
    pub: Pubg;
    protected constructor(pubInstance: Pubg, client: CommandoClient, info: CommandInfo);
    hasPermission(msg: CommandMessage): boolean;
}
export default AbstractPubgCommand;
