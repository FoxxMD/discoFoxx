import {Bot, BotConstructorInterface, Environment} from "./Bot";
import {CommandoClient, CommandoClientOptions} from 'discord.js-commando';

export interface CommandoBotConstructorInterface extends BotConstructorInterface {
    env: CommandEnvironment
}

export interface CommandEnvironment extends Environment {
    commando?: {
        clientOptions?: CommandoClientOptions
    }
}

export class CommandoBot extends Bot {

    client: CommandoClient;

    constructor(props: CommandoBotConstructorInterface) {
        super(props);

        const {
            env: {
                commando: {
                    clientOptions = undefined
                } = {}
            }
        } = props;

        this.client = new CommandoClient(clientOptions);
    }
}
