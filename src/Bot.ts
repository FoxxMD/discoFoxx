import {open, Database} from 'sqlite';
import {Client} from "discord.js";
import {pubgEnv} from "./features/pubg";

export interface BotConstructorInterface {
    client?: Client;
    env: Environment;
    name?: string,
    db?: Database
}

export interface Environment {
    discord: {
        token: string
    },
    szurubooru?: {
        token: string,
        endpoints: {
            frontend: string,
            backend: string
        }
    },
    pubg?: pubgEnv
    debug?: boolean
    commandPrefix?: string
}


export enum eventType {
    USER = 'user',
    BOT_PRE = 'botPre',
    BOT_POST = 'botPost'
}

export interface eventObj {
    type: eventType,
    func: Function,
    runOnce?: boolean,
    name?: string
}

export class Bot {

    name: string;
    client: Client;
    env: Environment;
    db!: Database;

    protected events!: Record<string, eventObj[]>;

    protected onlineStatus: string = 'Bot is online';

    constructor(props: BotConstructorInterface) {
        const {client, env, db, name = 'Bot'} = props;
        this.name = name;
        if (client === undefined) {
            this.client = new Client({disabledEvents: ['TYPING_START']});
        } else {
            this.client = client;
        }
        this.env = env;

        this.handleEvent = this.handleEvent.bind(this);

        if (this.env.discord === undefined) {
            throw new Error(`'discord' property of env object must exists`);
        }
        if (this.env.discord.token === undefined) {
            throw new Error(`'discord' object in env must contains a 'token' property`);
        }

        if(db !== undefined) {
            this.db = db;
        }

        this.initEvents();
    }

    private initEvents = () => {
        this.events = {
            ready: [
                {
                    type: eventType.BOT_PRE,
                    runOnce: true,
                    func: async () => {
                        await this.initializeDB();
                    }
                },
                {
                    type: eventType.BOT_PRE,
                    func: async () => {
                        console.log(`Bot has started, with ${this.client.users.size} users, in ${this.client.channels.size} channels of ${this.client.guilds.size} guilds.`);
                        await this.client.user.setActivity(this.onlineStatus);
                    }

                }
            ],
        };

        this.registerEvent('ready');
    };

    public on = (event: string, func: Function, name?: string) => this.addEvent(event, {
        func,
        name,
        runOnce: false,
        type: eventType.USER
    });

    public once = (event: string, func: Function, name?: string) => this.addEvent(event, {
        func,
        name,
        runOnce: true,
        type: eventType.USER
    });

    protected addEvent = (event: string, newEvent: eventObj) => {
        this.registerEvent(event);

        if (this.events[event] === undefined) {
            this.events[event] = [newEvent];
        } else {
            const partitionedEvents = this.events[event].concat(newEvent).reduce((acc: any, curr: eventObj) => {
                return {...acc, [curr.type]: acc[curr.type].concat(curr)};
            }, {[eventType.BOT_PRE]: [], [eventType.BOT_POST]: [], [eventType.USER]: []});
            this.events[event] = [...partitionedEvents[eventType.BOT_PRE], ...partitionedEvents[eventType.USER], ...partitionedEvents[eventType.BOT_POST]];
        }
    };

    private registerEvent = (event: string) => {
        if (!this.client.eventNames().includes(event)) {
            this.client.on(event, (...args: any) => this.handleEvent(event, ...args))
        }
    };

    private handleEvent = async (eventName: string, ...args: any) => {
        if (this.events[eventName] !== undefined) {
            let runOnceIndexes: number[] = [];
            const index = 0;
            for (const eventObj of this.events[eventName]) {
                if (eventObj.runOnce === true) {
                    runOnceIndexes.push(index);
                }
                if (await eventObj.func(...args) === true) {
                    break;
                }
            }
            if (runOnceIndexes.length > 1) {
                this.events[eventName] = this.events[eventName].filter((x, index) => !runOnceIndexes.includes(index));
            }
        }
    };

    public run = async () => {
        await this.client.login(this.env.discord.token);
    };

    protected initializeDB = async (): Promise<void> => {
        if(this.db === undefined) {
            this.db = await open(':memory:');
        }
    };

    public setOnlineActivity = (arg: string): void => {
        this.onlineStatus = arg;
    };
}
