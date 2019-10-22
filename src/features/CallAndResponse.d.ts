import { Message, User } from "discord.js";
import { IChannels } from "../common/interfaces";
export interface CARConfig {
    channels?: IChannels;
    data: CARData[];
}
export interface ChanceConfig {
    respond?: number;
    respondOnMention?: number;
    react?: number;
    reactOnMention?: number;
    multipleReact?: number;
}
export interface CARData {
    nickname?: string;
    call: string[];
    response?: string[] | string;
    react?: string[] | string;
    chance?: ChanceConfig;
    channelChance?: Record<string, ChanceConfig>;
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
    channels?: IChannels;
}
export declare class CallAndResponse {
    carData: CARData[];
    channelDefaults: IChannels;
    snowflake: string;
    bot: User;
    verbose: boolean;
    constructor(config: CARConfig, bot: User, verbose?: boolean);
    process: (message: Message) => false | ((message: Message) => void);
}
