import er from 'emoji-regex';
import {normalizeStr, randomIntFromInterval, replaceWithContext, timeStamp} from "../utilities";
import {DMChannel, Emoji, GuildChannel, Message, Permissions, User} from "discord.js";
import {IChannels} from "../common/interfaces";

const emojiRegex = er();

export interface CARConfig {
    channels?: IChannels,
    data: CARData[]
}

export interface ChanceConfig {
    respond?: number, // percent chance to send a message. Default 50%
    respondOnMention?: number, // percent chance to send a message when bot is mentioned. Default 100%
    react?: number, // chance to react. Default 50%
    reactOnMention?: number, // chance to react when bot is mentioned. Default 100%
    multipleReact?: number, // chance we can react more than once. Default 0%
}

export interface CARData {
    nickname?: string, // used for referencing other CARS data
    call: string[], // multiple terms can trigger a response
    response?: string[] | string, // multiple responses possible for trigger. a response is chosen at random
    react?: string[] | string,
    chance?: ChanceConfig,
    channelChance?: Record<string, ChanceConfig>,
    options?: {
        parsing?: { // modifiers for parsing message content and calls
            preserveWhiteSpace?: boolean,
            preserveUrl?: boolean,
        },
        call?: {
            match?: ('any' | 'all' | 'only') // determines what conditions need to be met for calls
            // any => any string in a call array can trigger a response
            // all => all strings in a call array must be present to trigger a response
            // only => assumes only one string in call array. the message content must only be this string
        },
        message?: {
            mention?: null | boolean, // when null no mention (of bot) state required. true = mention must be present, false = must not have mention
        }
    },
    channels?: IChannels  // specify channels to whitelist or blacklist
}

export class CallAndResponse {
    carData: CARData[];
    channelDefaults: IChannels;
    snowflake: string;
    bot: User;
    verbose: boolean;

    constructor(config: CARConfig, bot: User, verbose: boolean = false) {
        const {channels = {}, data} = config;

        this.carData = data;
        this.bot = bot;
        this.snowflake = this.bot.id;
        this.verbose = verbose;
        this.channelDefaults = channels;
    }

    process = (message: Message) => {

        const {author: {username: user}, channel, mentions: {users: mentionedUsers = []}} = message;
        const channelName = channel instanceof DMChannel ? 'dm' : 'name' in channel ? channel.name : undefined;
        const mentioned = mentionedUsers.some((x: User) => x.id === this.snowflake);
        const messageContent = normalizeStr(message.content, {
            preserveWhiteSpace: true,
            preserveUrl: true,
            mentions: mentionedUsers.filter((x: User) => x.id !== this.snowflake)
        });

        let contextString = [timeStamp(), (messageContent.length > 40 ? `${messageContent.substring(0, 60)}...(truncated)` : messageContent)];
        if (channelName !== undefined) {
            contextString.push(`#${channelName}`);
        }
        contextString.push(`@${user}`);

        let verboseStrings = [contextString.join(' -> ')];
        let responseContent: string[] = [];
        let reactions: (string | Emoji)[] = [];
        let warn = false;
        let canRespond = true;
        let canReact = true;

        if (channel instanceof GuildChannel) {
            const permissions = channel.memberPermissions(this.bot);
            if (permissions === null) {
                canRespond = false;
                canReact = false;
            } else {
                canRespond = permissions.has(Permissions.FLAGS.SEND_MESSAGES as number);
                canReact = permissions.has(Permissions.FLAGS.ADD_REACTIONS as number);
            }
        }

        if (!canRespond && !canReact) {
            return false;
        }

        // look through each CAR object
        // if a CAR object does not meet success conditions we 'continue' to iterate to the next CAR object
        for (const cr of this.carData) {
            // each call-response object can contain all of the below datas and modifiers
            // so that the behavior for each call-response can be customized.
            //
            // only 'call' and 'response' arrays are necessary, everything else has a default
            const {
                nickname = '',
                call = [],
                response = [],
                react = [],
                chance = {},
                channelChance = {},
                options: {
                    parsing: {
                        preserveWhiteSpace = false,
                        preserveUrl = false,
                    } = {},
                    call: {
                        match: callMatch = 'any'
                    } = {},
                    message: {
                        mention: mentionPresent = null,
                    } = {}
                } = {},
                channels = this.channelDefaults
            }: CARData = cr;

            let matchString = [];

            // check channel restrictions
            const channel = channelName !== undefined ? normalizeStr(channelName) : undefined;
            if (channel !== undefined) {
                const {include, exclude} = channels;
                if (include !== undefined) {
                    if (include.length !== 0 && !include.map(x => x.toLowerCase()).includes(channel)) {
                        continue;
                    }
                } else if (exclude !== undefined) {
                    if (exclude.length === 0 || exclude.map(x => x.toLowerCase()).includes(channel)) {
                        continue;
                    }
                }
            }

            // make sure mention state is correct, if specified
            if (mentionPresent !== null) {
                if (mentionPresent === true && !mentioned) {
                    continue;
                }
                if (mentionPresent === false && mentioned) {
                    continue;
                }
            }

            // check for call
            let foundCall = undefined;
            if (call.length > 0) {

                // most call terms are one word entries or whole phrases --
                // most of the time we want to ignore whitespace to allow variations in phrase building
                // EX good morning gamers --or-- goodmorning gamers => (ignore whitespace) goodmorninggamers
                //
                // we use preserveWhiteSpace when short calls might accidentally be parsed from adjacent words
                // EX owo => n[o wo]rries would trigger with no whitespace. preserve it to ensure owo intention

                const content = normalizeStr(messageContent, {preserveWhiteSpace, preserveUrl});

                switch (callMatch) {
                    case 'all':
                        if (!call.every(x => content.includes(normalizeStr(x, {preserveWhiteSpace})))) {
                            continue;
                        }
                        foundCall = call.join(',');
                        break;
                    case 'only':
                        // call should have 1 entry. this what we match the entire string against
                        if (normalizeStr(call[0]) !== content) {
                            continue;
                        }
                        foundCall = call[0];
                        break;
                    case 'any':
                        foundCall = call.find(x => content.includes(normalizeStr(x, {preserveWhiteSpace})));
                        if (foundCall === undefined) {
                            continue;
                        }
                        break;
                    default: // shouldn't happen
                        continue;
                }
            } else {
                foundCall = nickname;
            }

            matchString.push(` -> Matched {${foundCall}}`);

            // determine which chances to use
            let chanceToUse: ChanceConfig = chance;

            if (channel !== undefined && channelChance[channel] !== undefined) {
                chanceToUse = channelChance[channel];
            }

            const {
                respond: normalChance = 50,
                respondOnMention: mentionChance = 100,
                react: reactChance = 50,
                reactOnMention = 100,
                multipleReact: multipleReactChance = 0,
            } = chanceToUse;

            // react ops
            if (react.length > 0 && canReact) {
                // should we react?
                const chanceOfReact = mentioned ? reactOnMention : reactChance;
                if (Math.random() - 0.01 > chanceOfReact) {
                    matchString.push('React: No');
                    continue;
                } else {
                    matchString.push('React: Yes')
                }

                let continuedChance = 100;
                const maxHits = react.length;
                let hitCount = 0;
                while ((Math.random() - 0.01 < (continuedChance * 0.01)) && hitCount <= maxHits) {

                    const reaction = react[randomIntFromInterval(1, react.length) - 1];
                    let actualReaction = null;

                    if (emojiRegex.test(reaction)) {
                        actualReaction = reaction; // so we know its a regular emoji
                    } else if ('guild' in message.channel) { // its the text for a guild emoji, need to make sure we are in a guild to use it
                        const foundCustom = message.channel.guild.emojis.find(x => x.name === reaction || x.id === reaction);
                        if (foundCustom !== undefined) {
                            actualReaction = foundCustom;
                        } else {
                            matchString.push(`WARN: Could not find guild emoji ${reaction}`);
                            warn = true;
                        }
                    }
                    if (actualReaction !== null && !reactions.includes(actualReaction)) { //only add those we haven't already added
                        reactions.push(actualReaction);
                    }
                    continuedChance = multipleReactChance;
                    hitCount++;
                }
            }

            // respond ops
            if (response.length > 0 && canRespond) {
                // should we respond
                const respondChance = mentioned ? mentionChance : normalChance;
                if ((Math.random() - 0.01 > respondChance * 0.01)) {
                    matchString.push('Respond: No');
                    continue;
                } else {
                    matchString.push('Respond: Yes');
                }
                // get random response
                let responses = undefined;
                if (typeof responses === 'string') { // we're looking for a nickname
                    const foundCar = this.carData.find(x => x.nickname === response);
                    if (foundCar === undefined) {
                        matchString.push(`WARN: Could not match nickname ${response} for a response`);
                        warn = true;
                    } else {
                        responses = foundCar.response;
                    }
                } else {
                    responses = response;
                }
                if (responses !== undefined) {
                    responseContent.push(replaceWithContext(responses[randomIntFromInterval(1, response.length) - 1], message));
                }
            }
            verboseStrings.push(matchString.join(' | '))
        }

        if (responseContent.length === 0 && reactions.length === 0) {
            return false;
        }

        if (this.verbose) {
            for (let str of verboseStrings) {
                if (str.toLowerCase().includes('warn')) {
                    console.warn(str)
                } else {
                    console.log(str);
                }
            }
        }

        return (message: Message) => {
            if (responseContent.length > 0) {
                const finalResponse = responseContent[randomIntFromInterval(1, responseContent.length) - 1];
                message.channel.send(finalResponse);
            }

            if (reactions.length > 0) {

                for (const r of reactions.slice(0, 5)) {
                    message.react(r).catch((e) => {
                        console.error(` -> Failed to react with ${r}: ${e.message}`);
                    });
                }
            }
        }
    };
}
