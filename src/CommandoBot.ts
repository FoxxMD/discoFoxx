import {Bot, BotConstructorInterface, Environment } from "./Bot";
import {Database, open} from "sqlite";
import {CommandoClient, CommandoClientOptions, SQLiteProvider} from 'discord.js-commando';

export interface CommandoBotConstructorInterface extends BotConstructorInterface {
    commando?: {
        db?: Database,
    }
    env: CommandEnvironment
}

export interface CommandEnvironment extends Environment {
    commando?: {
        clientOptions?: CommandoClientOptions
    }

}

export class CommandoBot extends Bot {

    commandoDb!: Database;
    client: CommandoClient;

    constructor(props: CommandoBotConstructorInterface) {
        super(props);

        const {
            commando: {
                db: commandoDb = undefined
            } = {},
            env: {
                commando: {
                    clientOptions = undefined
                } = {}
            }
        } = props;


        this.client = new CommandoClient(clientOptions);

        if (commandoDb !== undefined) {
            this.commandoDb = commandoDb;
        }
    }

    protected initializeDB = async (): Promise<void> => {
        // have to duplicate body of parent method because async methods in Class dont support super yet
        // https://github.com/microsoft/TypeScript/issues/5124
        if(this.db === undefined) {
            this.db = await open(':memory:');
        }

        if (this.commandoDb === undefined) {
            this.commandoDb = this.db;
        }
        await this.client.setProvider(new SQLiteProvider(this.commandoDb));
    }

}
