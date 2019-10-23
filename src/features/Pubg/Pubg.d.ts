import { Database } from "sqlite";
import { PubgAPI } from 'pubg-typescript-api';
import { GuildMember } from "discord.js";
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
    pubId: string;
    pubName: string;
}
export declare class PubError extends Error {
}
export declare class Pubg {
    db: Database;
    whitelist: string[];
    blacklist: string[];
    ops: string[];
    api: PubgAPI;
    constructor(db: Database, env: pubgEnv);
    setPlayer(user: GuildMember, name: string): Promise<void>;
    pubNameExists(name: string): Promise<[boolean, string?]>;
    hasInteractionPermissions(user: GuildMember): boolean;
    hasOpsPermissions(user: GuildMember): boolean;
    private getPubgPlayerByName;
    private getPubgUserFromMember;
    private getMatch;
    displayGroupMatch(user: GuildMember, matchId?: string): Promise<string>;
    private matchSummary;
    private rosterSummary;
    private createDB;
}
