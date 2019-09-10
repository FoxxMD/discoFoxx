import { Message } from "discord.js";
declare const parseBang: (msg: Message, prefix?: string) => false | ((message: Message) => Promise<Message | Message[]>) | {
    command: string;
    args: string[];
};
export default parseBang;
