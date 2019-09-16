import { Bot, BotConstructorInterface, Environment } from "./Bot";
import { Database } from "sqlite";
import { CommandoClient, CommandoClientOptions } from 'discord.js-commando';
export interface CommandoBotConstructorInterface extends BotConstructorInterface {
    commando?: {
        db?: Database;
    };
    env: CommandEnvironment;
}
export interface CommandEnvironment extends Environment {
    commando?: {
        clientOptions?: CommandoClientOptions;
    };
}
export declare class CommandoBot extends Bot {
    commandoDb: Database;
    client: CommandoClient;
    constructor(props: CommandoBotConstructorInterface);
    protected initializeDB: () => Promise<void>;
}
