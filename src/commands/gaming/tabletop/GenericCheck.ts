import {Command, CommandMessage, CommandoClient} from "discord.js-commando";
import {Dice} from "dice-typescript/dist";
import {stripIndents} from "common-tags";
import {normalNumber, normalNumberOpts, randomIntFromInterval} from "../../../utilities";

export interface checkStatsOptions {
    opponent?: {
        ac?: normalNumberOpts,
        dex?: normalNumberOpts
    },
    player?: {
        dice?: Dice,
        critical?: {
            show?: boolean,
            threshold?: {
                success?: number,
                failure?: number,
            }
        }
        bab?: {
            min?: number,
            max?: number
        },
        str?: normalNumberOpts
    },
    emojis?: {
        results?: {
            show?: boolean,
            success?: string[],
            fail?: string[]
        },
        critical?: {
            show?: boolean
            success?: string[],
            fail?: string[]
        }
    }
}

const defaultSuccess = ['😁', '😎', '🔥', '🙌', '🙏', '💪', '🎉', '🌈', '🎊', '💃', '😍'];
const defaultFail = ['😬', '😅', '☠', '😈', '😰', '😩', '😭', '😖', '😫', '😵', '🙈', '😢'];
const defaultCritSuccess = ['😱', '😍', '💪', '💃', '💗'];
const defaultCritFail = ['😂', '💀', '😏', '😭', '💩', '😆', '😵'];

export class GenericCheckCommand extends Command {

    dice: Dice;
    opts: checkStatsOptions;
    checkSuccessEmojis: string[] = [];
    checkFailEmojis: string[] = [];
    critSuccessEmojis: string[] = [];
    critFailEmojis: string[] = [];

    constructor(client: CommandoClient, opts: checkStatsOptions = {}) {
        super(client, {
            name: 'check',
            group: 'tabletop',
            memberName: 'check',
            description: 'Make a dice roll check against anything!',
            details: stripIndents`Rolls a d20 to see if you succeed or fail against the check of your desire.
            A random AC is generated to roll against. GL HF`,
            examples: ['!check for cuteness', '!check to intimidate @Glitch'],
            args: [
                {
                    key: 'checkContents',
                    type: 'string',
                    prompt: 'What do you want to roll for?'
                }
            ]
        });
        this.opts = opts;
        const {
            player: {
                dice = new Dice()
            } = {},
            emojis: {
                results: {
                    success: checkSuccess = defaultSuccess,
                    fail: checkFail = defaultFail
                } = {},
                critical: {
                    success: critSuccess = defaultCritSuccess,
                    fail: critFail = defaultCritFail,
                } = {}
            } = {}
        } = opts;

        this.checkSuccessEmojis = checkSuccess;
        this.checkFailEmojis = checkFail;
        this.critSuccessEmojis = critSuccess;
        this.critFailEmojis = critFail;
        this.dice = dice;
    }

    async run(cmdMsg: CommandMessage, args: object) {
        const {checkContents} = args as { checkContents: string };

        const {
            opponent: {
                ac: {
                    min: opAcMin = 5,
                    max: opAcMax = 20,
                    skew: opAcSkew = 1,
                } = {},
                dex: {
                    min: opDexMin = -2,
                    max: opDexMax = 2,
                    skew: opDexSkew = 0.5
                } = {}
            } = {},
            player: {
                critical: {
                    show: showPlayerCritical = true,
                    threshold: {
                        success: critSThreshold = 20,
                        failure: critTThreshold = 1
                    } = {}
                } = {},
                bab: {
                    min: babMin = 0,
                    max: babMax = 2,
                } = {},
                str: {
                    min: pStrMin = -2,
                    max: pStrMax = 2,
                    skew: pStrSkew = 0.75
                } = {}
            } = {},
            emojis: {
                results: {
                    show: showResultEmojis = true
                } = {},
                critical: {
                    show: showCriticalEmojis = true,
                } = {},
            } = {}
        } = this.opts;

        const baseAc = Math.round(normalNumber(opAcMin, opAcMax, opAcSkew));
        const dexModifier = Math.round(normalNumber(opDexMin, opDexMax, opDexSkew));
        const result = this.dice.roll('1d20');
        const {total} = result;
        const bab = randomIntFromInterval(babMin, babMax);
        const strModifier = Math.round(normalNumber(pStrMin, pStrMax, pStrSkew));
        const diceRoll = total + strModifier + bab;
        const AC = baseAc + dexModifier;

        const checkResult = [];
        if (diceRoll >= AC) {
            checkResult.push('Check succeeded');
            if (showResultEmojis && this.checkSuccessEmojis.length > 1) {
                checkResult.push(this.checkSuccessEmojis[randomIntFromInterval(0, this.checkSuccessEmojis.length - 1)]);
            }
        } else {
            checkResult.push('Check failed');
            if (showResultEmojis && this.checkFailEmojis.length > 1) {
                checkResult.push(this.checkFailEmojis[randomIntFromInterval(0, this.checkFailEmojis.length - 1)]);
            }
        }
        const criticalResult = [''];
        if (showPlayerCritical) {
            if (total <= critTThreshold) {
                criticalResult.push('Crit Fail');
                if (showCriticalEmojis && this.critFailEmojis.length > 0) {
                    criticalResult.push(this.critFailEmojis[randomIntFromInterval(0, this.critFailEmojis.length - 1)])
                }
            } else if (total >= critSThreshold) {
                criticalResult.push('Crit');
                if (showCriticalEmojis && this.critSuccessEmojis.length > 0) {
                    criticalResult.push(this.critSuccessEmojis[randomIntFromInterval(0, this.critSuccessEmojis.length - 1)])
                }
            }
        }

        const contents = stripIndents`
        Rolling **${checkContents}** against ${AC} (${baseAc} ${dexModifier < 0 ? '-' : '+'} ${Math.abs(dexModifier)} DEX) AC
        Rolled ${diceRoll} (${total}${criticalResult.join(' ')} + ${bab} BAB ${strModifier < 0 ? '-' : '+'} ${Math.abs(strModifier)} STR)
        ${checkResult.join(' ')}`;
        return cmdMsg.say(contents);
    }
}
