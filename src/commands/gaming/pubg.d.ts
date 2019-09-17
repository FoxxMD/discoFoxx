import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { Pubg } from "../../features";
export declare class PubgCommand extends Command {
    pub: Pubg;
    constructor(pubInstance: Pubg, client: CommandoClient);
    hasPermission(msg: CommandMessage): boolean;
    run(msg: CommandMessage, args: object): Promise<any>;
}
export default PubgCommand;
