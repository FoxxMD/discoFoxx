import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { Szurubooru } from "../../features/Szurubooru";
export declare class MemeCommand extends Command {
    memeApi: Szurubooru;
    constructor(api: Szurubooru, client: CommandoClient);
    run(message: CommandMessage, args: string[]): Promise<any>;
}
export default MemeCommand;
