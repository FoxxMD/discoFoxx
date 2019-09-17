import { Database } from "sqlite";
import { PubgAPI } from 'pubg-typescript-api';
import { GuildMember, Message } from "discord.js";
export interface pubgEnv {
    token: string;
    acl?: {
        whitelist?: string[];
        blacklist?: string[];
        ops?: string[];
    };
}
export interface pubgUser {
    id: number;
    snowflake: string;
    discordName: string;
    pubId: string | null;
    pubName: string;
}
export declare class Pubg {
    db: Database;
    whitelist: string[];
    blacklist: string[];
    ops: string[];
    api: PubgAPI;
    constructor(db: Database, env: pubgEnv);
    setPlayer(user: GuildMember, name: string): Promise<void>;
    removePlayer(user: GuildMember): Promise<void>;
    discordUserExists(user: GuildMember): Promise<boolean>;
    pubNameExists(name: string): Promise<[boolean, string?]>;
    hasInteractionPermissions(user: GuildMember): boolean;
    hasOpsPermissions(user: GuildMember): boolean;
    private populatePubgId;
    private getPubgUserFromMember;
    private getMatchFromPubgUser;
    displayGroupMatch(user: GuildMember): Promise<Function>;
    private matchSummary;
    private rosterSummary;
    private createDB;
}
export declare const createPubgCommand: (pub: Pubg) => (msg: Message, args: string[]) => Promise<Function>;
