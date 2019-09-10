import { Client, Message } from "discord.js";
declare const makeCARs: (config: any, client: Client) => (msg: Message) => Promise<false | ((message: Message) => void)>;
export default makeCARs;
