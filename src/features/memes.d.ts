import 'url-search-params-polyfill';
import { Message } from "discord.js";
export declare const makeSzuruBot: (endpoints: any, token: string) => {
    random: () => Promise<(msg: Message) => Promise<Message | Message[]>>;
    tagged: (tags: string[]) => Promise<(msg: Message) => Promise<Message | Message[]>>;
};
export default makeSzuruBot;
