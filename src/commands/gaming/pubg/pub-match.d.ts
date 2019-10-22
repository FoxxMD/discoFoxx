/// <reference types="discord.js" />
import { CommandMessage, CommandoClient } from 'discord.js-commando';
import { Pubg } from "../../../features";
import AbstractPubgCommand from "./pubg";
export declare class PubMatch extends AbstractPubgCommand {
    constructor(pubInstance: Pubg, client: CommandoClient);
    run(cmdMsg: CommandMessage, args: object): Promise<import("discord.js").Message | import("discord.js").Message[]>;
}
