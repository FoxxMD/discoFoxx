import { Message } from "discord.js";
export interface SoundDesc {
    name: string[];
    file: string;
    description: string;
}
export declare class ClipPlayer {
    sounds: SoundDesc[];
    soundDir: string;
    verbose: boolean;
    constructor(sounds: SoundDesc[], soundDir: string, verbose?: boolean);
    list: () => string;
    hasSound: (soundName: string) => boolean;
    play: (soundName: string, msg: Message) => ((message: Message) => Promise<Message | Message[]>) | ((message: Message) => Promise<void>);
}
export default ClipPlayer;
