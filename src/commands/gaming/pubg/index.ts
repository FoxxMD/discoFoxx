import {PubMatch} from "./pub-match";
import {PubSetUser} from "./pub-setuser";
import {Pubg} from "../../../features";
import {CommandoClient} from "discord.js-commando";

export * from './pub-match';
export * from './pub-setuser';

export const registerGroup = (pubInstance: Pubg, client: CommandoClient) => {
    client.registry.registerGroup(['pubg', 'PUBG Stats']);
    registerCommands(pubInstance, client);
};

export const registerCommands = (pubInstance: Pubg, client: CommandoClient) => {
    const match = new PubMatch(pubInstance, client);
    const setUser = new PubSetUser(pubInstance, client);
    client.registry.registerCommands([match, setUser]);
};
