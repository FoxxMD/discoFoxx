import {Command, CommandMessage, CommandoClient} from "discord.js-commando";
import {Dice, FunctionDefinitionList, RandomProvider} from "dice-typescript/dist";
import {InterpreterOptions} from "dice-typescript/dist/interpreter/interpreter-options.interface";
import {stripIndents} from "common-tags";

export interface DiceOptions {
    dice?: {
        functions?: FunctionDefinitionList,
        randomProvider?: RandomProvider
        options?: InterpreterOptions
    }
}

export class DiceCommand extends Command {

    dice: Dice;

    constructor(dice = new Dice(), client: CommandoClient) {
        super(client, {
            name: 'roll',
            group: 'tabletop',
            memberName: 'roll',
            description: 'Roll dice',
            details: stripIndents`Rolls any dice format using the syntax for roll20
            See https://wiki.roll20.net/Dice_Reference#Roll20_Dice_Specification for more information`,
            examples: ['!roll 2d20', '!roll 1d6'],
            args: [
                {
                    key: 'roll',
                    type: 'string',
                    prompt: 'Specify the roll (ex 2d20)'
                }
            ]
        });
        this.dice = dice;
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {roll} = args as { roll: string };
        const result = this.dice.roll(roll);
        if(result.errors.length > 1){
         return cmdMsg.reply(stripIndents`Error! ${result.errors.join('\r\n')}`);
        }
        const contents = [result.renderedExpression];
        // @ts-ignore
        if(result.reducedExpression.type === 'Dice') {
            contents.push(`Total: ${result.total}`);
            // @ts-ignore
        } else if(['Greater','Less'].includes(result.reducedExpression.type)) {
            contents.push(`Total: ${result.total} | Fails: ${result.failures} | Succeeds: ${result.successes}`);
        }
        return cmdMsg.say(contents.join('\n'));
    }
}