import {timeStamp} from "../utilities";
import {Message} from "discord.js";

export interface SoundDesc {
    name: string[],
    file: string,
    description: string
}

export class ClipPlayer {
    sounds: SoundDesc[];
    soundDir: string;
    verbose: boolean;

    constructor(sounds: SoundDesc[], soundDir: string, verbose = false) {
        this.sounds = sounds;
        this.soundDir = soundDir;
        this.verbose = verbose;
    }

    list = () => {
        return this.sounds.reduce((acc: string, sound: SoundDesc) => {
            const {name, description} = sound;
            // concat each sound to a string reduction using newline. also join multiple sound names with 'or'
            return acc.concat(`\n${name.join(' or ')} => ${description}`);
            // start reduction with header
        }, 'Sound Name => Description\n');
    };

    hasSound = (soundName: string) => {
        return this.sounds.some((x) => x.name.includes(soundName));
    };

    play = (soundName: string, msg: Message) => {
        // destructure message to get voiceChannel of the author who sent the message
        const {
            member
        } = msg;

        const sanitizedSoundName = soundName.toLocaleLowerCase();

        if (sanitizedSoundName === 'list') {
            // if sound command argument is list we just want to text reply with available sounds
            const list = this.sounds.reduce((acc: string, sound: SoundDesc) => {
                const {name, description} = sound;
                // concat each sound to a string reduction using newline. also join multiple sound names with 'or'
                return acc.concat(`\n${name.join(' or ')} => ${description}`);
                // start reduction with header
            }, 'Sound Name => Description\n');
            return (message: Message) => message.channel.send(list);
        }

        // check for an existing sound by comparing sent name to what we have in config
        const foundSound = this.sounds.find(x => x.name.map(y => y.toLocaleLowerCase()).includes(sanitizedSoundName));

        if (foundSound === undefined) {
            throw new Error('That sound does not exist');
        }

        if (member === undefined || member.voiceChannel === undefined) {
            throw new Error('You need to be in a voice channel first!');
        }

        if (this.verbose) {
            console.log(`[${timeStamp()}] Playing sound ${foundSound.file}`);
        }

        // return a function so replyToUsers can process delay and return true in message routines
        return async (message: Message) => {
            const vc = message.member.voiceChannel;
            try {
                const connection = await vc.join();
                const dispatcher = connection.playFile(`${this.soundDir}/${foundSound.file}`);
                dispatcher.on('end', end => {
                    // its cutting short for some reason, use a timeout to make sure everything is played
                    setTimeout(() => {
                        vc.leave();
                    }, 1000);
                });
            } catch (err) {
                // make sure we leave the voice channel if any error occurs so the bot isn't just stuck in a channel
                console.log(err);
                vc.leave();
                await message.channel.send('Oops 😳, encountered an error. Tell someone import to check the logs.');
            }
        }
    }
}

export default ClipPlayer;
