import { Message } from "discord.js";
export declare const makePlaySound: (config: any, soundDir: string) => (msg: Message, soundName: string) => Promise<((message: Message) => Promise<Message | Message[]>) | ((message: Message) => Promise<void>)>;
export default makePlaySound;
