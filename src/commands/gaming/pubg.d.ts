import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { Pubgg } from "../../features/Pubgg";
export declare class PubgCommand extends Command {
    pub: Pubgg;
    constructor(pubInstance: Pubgg, client: CommandoClient);
    hasPermission(msg: CommandMessage): boolean;
    run(msg: CommandMessage, args: object): Promise<any>;
}
export default PubgCommand;
