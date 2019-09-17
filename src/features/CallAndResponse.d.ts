import { Message } from "discord.js";
export interface CARData {
    nickname?: string;
    call: string[];
    response?: string[] | string;
    react?: string[] | string;
    chance?: {
        respond?: number;
        respondOnMention?: number;
        react?: number;
        reactOnMention?: number;
        multipleReact?: number;
        channels?: string[];
    };
    options?: {
        parsing?: {
            preserveWhiteSpace?: boolean;
            preserveUrl?: boolean;
        };
        call?: {
            match?: string;
        };
        message?: {
            mention?: null | boolean;
        };
    };
    channels?: string[];
}
export declare class CallAndResponse {
    carData: CARData[];
    snowflake?: string;
    verbose: boolean;
    constructor(carData: CARData[], snowflake?: string, verbose?: boolean);
    process: (message: Message) => false | ((message: Message) => void);
}
