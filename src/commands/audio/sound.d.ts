import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { ClipPlayer } from "../../features/ClipPlayer";
export declare class SoundCommand extends Command {
    clipPlayer: ClipPlayer;
    constructor(player: ClipPlayer, client: CommandoClient);
    run(message: CommandMessage, arg: string): Promise<any>;
}
export default SoundCommand;
