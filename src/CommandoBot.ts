import {Bot, BotConstructorInterface, Environment, eventType} from "./Bot";
import {Database, open} from "sqlite";
import {CommandoClient, CommandoClientOptions, SQLiteProvider} from 'discord.js-commando';
//import {getUserFromMention} from "./utilities";

export interface CommandoBotConstructorInterface extends BotConstructorInterface {
    commando?: {
        db?: Database,
    }
    env: CommandEnvironment
}

export interface CommandEnvironment extends Environment {
    commando?: {
        // allowMentionPrefix?: boolean
        clientOptions?: CommandoClientOptions
    }

}

export class CommandoBot extends Bot {

    commandoDb!: Database;
    client: CommandoClient;
    //allowMentionPrefix: boolean;

    constructor(props: CommandoBotConstructorInterface) {
        super(props);

        const {
            commando: {
                db: commandoDb = undefined
            } = {},
            env: {
                commando: {
                    //allowMentionPrefix = true,
                    clientOptions = undefined
                } = {}
            }
        } = props;

        //this.allowMentionPrefix = allowMentionPrefix;

        this.client = new CommandoClient(clientOptions);

        if (commandoDb !== undefined) {
            this.commandoDb = commandoDb;
        }

        // this.events.ready.push({
        //     type: eventType.BOT_PRE,
        //     runOnce: true,
        //     func: async() => {
        //         if(this.allowMentionPrefix === false) {
        //             this.client.dispatcher.addInhibitor(msg => {
        //                 const {content} = msg;
        //                 if (content.startsWith(this.client.commandPrefix)) return false;
        //                 const mentionMatch = getUserFromMention(content.split(/ +/)[0], msg.mentions.users);
        //                 return mentionMatch ? 'no'
        //                 // this.client.user.id
        //             })
        //         }
        //     }
        // })
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
