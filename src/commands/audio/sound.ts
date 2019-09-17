import {Command, CommandMessage, CommandoClient} from 'discord.js-commando';
import {ClipPlayer, SoundDesc} from "../../features/ClipPlayer";

export class SoundCommand extends Command {

    clipPlayer: ClipPlayer;

    constructor(player: ClipPlayer, client: CommandoClient) {
        super(client, {
            name: 'sound',
            group: 'audio',
            memberName: 'sound',
            guildOnly: true,
            description: 'Play a sound in the current voice channel',
            details: 'Play a sound in the current voice channel. \n Use `list` to see available sounds',
            examples: ['!sound rickroll'],
            args: [
                {
                    key: 'name',
                    type: 'string',
                    prompt: 'Specify the sound to play',
                    validate: (val: any, msg: CommandMessage, arg: any) => {
                        if (val === 'list') {
                            return true;
                        } else if (!this.clipPlayer.hasSound(val)) {
                            return 'Specified sounds does not exist';
                        }
                        return true;
                    }
                }
            ]
        });
        this.clipPlayer = player;
    }

    hasPermission(cmdMsg: CommandMessage): boolean | string {
        if (cmdMsg.message.member.voiceChannel === undefined) {
            return 'Must be in a voice channel to do this';
        }
        return true;
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {name} = args as { name: string };
        const {message} = cmdMsg;
        if (name === 'list') {
            return message.channel.send(this.clipPlayer.list());
        }
        // @ts-ignore
        const readyFunc = await this.clipPlayer.play(name, message);
        return readyFunc(message);
    }
}

export default SoundCommand;
