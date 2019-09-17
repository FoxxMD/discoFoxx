import {open, Database} from 'sqlite';
import {Client} from "discord.js";
import {pubgEnv} from "./features/pubg";
import {szuruEnv} from "./features/Szurubooru";

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
    szurubooru?: szuruEnv,
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

    protected registeredEvents: string[] = [];
    protected rEvents!: Record<string, eventObj[]>;

    constructor(props: BotConstructorInterface) {
        const {client, env, db, name = 'Bot'} = props;
        this.name = name;
        this.rEvents = {};
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

        if (db !== undefined) {
            this.db = db;
        }
    }

    private initEvents = () => {
        this.addEvent('ready', {
            type: eventType.BOT_PRE,
            name: 'initDB',
            runOnce: true,
            func: async () => {
                await this.initializeDB();
            }
        });
        this.addEvent('ready', {
            type: eventType.BOT_PRE,
            name: 'Output Bot Ready',
            func: async () => {
                console.log(`Bot has started, with ${this.client.users.size} users, in ${this.client.channels.size} channels of ${this.client.guilds.size} guilds.`);
            }

        });
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

        if (this.rEvents[event] === undefined) {
            this.rEvents[event] = [newEvent];
        } else {
            const partitionedEvents = this.rEvents[event].concat(newEvent).reduce((acc: any, curr: eventObj) => {
                return {...acc, [curr.type]: acc[curr.type].concat(curr)};
            }, {[eventType.BOT_PRE]: [], [eventType.BOT_POST]: [], [eventType.USER]: []});
            this.rEvents[event] = [...partitionedEvents[eventType.BOT_PRE], ...partitionedEvents[eventType.USER], ...partitionedEvents[eventType.BOT_POST]];
        }
    };

    private registerEvent = (event: string) => {
        if (!this.registeredEvents.includes(event)) {
            this.client.on(event, async (...args: any) => {
                await this.handleEvent(event, ...args);
            });
            this.registeredEvents.push(event);
        }
    };

    private handleEvent = async (eventName: string, ...args: any) => {
        if (this.rEvents[eventName] !== undefined) {
            let runOnceIndexes: number[] = [];
            const index = 0;
            for (const eventObj of this.rEvents[eventName]) {
                if (eventObj.runOnce === true) {
                    runOnceIndexes.push(index);
                }
                if (await eventObj.func(...args) === true) {
                    break;
                }
            }
            if (runOnceIndexes.length > 1) {
                this.rEvents[eventName] = this.rEvents[eventName].filter((x, index) => !runOnceIndexes.includes(index));
            }
        }
    };

    public run = async () => {
        this.initEvents();
        await this.client.login(this.env.discord.token);
    };

    protected initializeDB = async (): Promise<void> => {
        if (this.db === undefined) {
            this.db = await open(':memory:');
        }
    };
}
