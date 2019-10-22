import { Pubg } from "../../../features";
import { CommandoClient } from "discord.js-commando";
export * from './pub-match';
export * from './pub-setuser';
export declare const registerGroup: (pubInstance: Pubg, client: CommandoClient) => void;
export declare const registerCommands: (pubInstance: Pubg, client: CommandoClient) => void;
