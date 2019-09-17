import {Command, CommandMessage, CommandoClient} from 'discord.js-commando';
import {ClipPlayer, SoundDesc} from "../../features/ClipPlayer";

export class SoundCommand extends Command {

    clipPlayer: ClipPlayer;

    constructor(player: ClipPlayer, client: CommandoClient) {
        super(client, {
            name: 'sound',
            group: 'audio',
            memberName: 'sound',
            description: 'Play a sound in the current voice channel',
            details: 'Play a sound in the current voice channel. \n Use `list` to see available sounds',
            examples: ['!sound rickroll'],
            args: [
                {
                    key: 'sound',
                    type: 'string',
                    prompt: 'Specify the sound to play',
                    validate: (val: string, msg: CommandMessage) => {
                        if (val === 'list') {
                            return true;
                        } else if (!this.clipPlayer.hasSound(val)) {
                            return 'Specified sounds does not exist';
                        } else if (msg.member === undefined || msg.member.voiceChannel === undefined) {
                            return 'Must be in a voice channel to do this';
                        }
                    }
                }
            ]
        });
        this.clipPlayer = player;
    }

    async run(message: CommandMessage, arg: string) {
        if (arg === 'list') {
            return message.say(this.clipPlayer.list());
        }
        // @ts-ignore
        const readyFunc = await this.clipPlayer.play(arg, message);
        return readyFunc(message);
    }
}

export default SoundCommand;
