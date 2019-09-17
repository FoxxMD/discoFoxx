import { Collection, Message, Snowflake, User } from "discord.js";
export declare const sleep: any;
export declare const randomIntFromInterval: (min: number, max: number) => number;
interface normalizeOpts {
    preserveWhiteSpace?: boolean;
    preserveUrl?: boolean;
    preserveCase?: boolean;
    mentions?: any[] | Collection<Snowflake, User>;
}
export declare const normalizeStr: (str: string, opts?: normalizeOpts) => string;
export declare const isVerbose: (envDebug?: boolean, configDebug?: boolean) => boolean;
export declare const timeStamp: (date?: string, locale?: any) => string;
export declare const replaceWithContext: (content: string, message: Message) => string;
export declare const getUserFromMention: (content: string, mentions: Collection<string, User>) => User;
export {};
