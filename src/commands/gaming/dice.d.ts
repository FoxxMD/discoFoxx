/// <reference types="discord.js" />
import { Command, CommandMessage, CommandoClient } from "discord.js-commando";
import { Dice, FunctionDefinitionList, RandomProvider } from "dice-typescript/dist";
import { InterpreterOptions } from "dice-typescript/dist/interpreter/interpreter-options.interface";
export interface DiceOptions {
    dice?: {
        functions?: FunctionDefinitionList;
        randomProvider?: RandomProvider;
        options?: InterpreterOptions;
    };
}
export declare class DiceCommand extends Command {
    dice: Dice;
    constructor(dice: Dice, client: CommandoClient);
    run(cmdMsg: CommandMessage, args: object): Promise<import("discord.js").Message | import("discord.js").Message[]>;
}
