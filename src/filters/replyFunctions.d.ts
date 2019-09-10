import { Message } from "discord.js";
export interface replyOpts {
    delay?: {
        min?: number | undefined;
        max?: number | undefined;
    };
    chance?: number;
    userNames?: string[];
    channels?: string[] | undefined;
    verbose?: boolean | undefined;
    functionNameHint?: string;
    allowBow?: boolean;
}
export declare const replyOnUsers: (func: Function, opts?: replyOpts) => (message: Message) => Promise<boolean>;
