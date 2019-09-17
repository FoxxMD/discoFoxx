import er from 'emoji-regex';
import {normalizeStr, randomIntFromInterval, replaceWithContext, timeStamp} from "../utilities";
import {DMChannel, Emoji, Message, User} from "discord.js";

const emojiRegex = er();

export interface CARData {
    nickname?: string, // used for referencing other CARS data
    call: string[], // multiple terms can trigger a response
    response?: string[] | string, // multiple responses possible for trigger. a response is chosen at random
    react?: string[] | string,
    chance?: {
        respond?: number, // percent chance that any successful call will trigger a response
        respondOnMention?: number, // percent chance that a successful call, with a mention of the bot, will trigger a response
        react?: number, // chance we will react
        reactOnMention?: number,
        multipleReact?: number, // chance we can react more than once
        channels?: string[], // percent chances per channel
    },
    options?: {
        parsing?: { // modifiers for parsing message content and calls
            preserveWhiteSpace?: boolean,
            preserveUrl?: boolean,
        },
        call?: {
            match?: string // determines what conditions need to be met for calls
            // any => any string in a call array can trigger a response
            // all => all strings in a call array must be present to trigger a response
            // only => assumes only one string in call array. the message content must only be this string
        },
        message?: {
            mention?: null | boolean, // when null no mention (of bot) state required. true = mention must be present, false = must not have mention
        }
    },
    channels?: string[]  // restrict success condition to certain channels. empty means all channels
}

export class CallAndResponse {
    carData: CARData[];
    snowflake?: string;
    verbose: boolean;

    constructor(carData: CARData[], snowflake?: string, verbose: boolean = false) {
        this.carData = carData;
        this.snowflake = snowflake;
        this.verbose = verbose;
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
                chance: {
                    respond: normalChance = 50,
                    respondOnMention: mentionChance = 100,
                    react: reactChance = 50,
                    reactOnMention = 100,
                    multipleReact: multipleReactChance = 0,
                    channels: channelChances = [],
                } = {},
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
                channels = []
            }: CARData = cr;

            let matchString = [];

            // check channel restrictions
            if (channels.length > 0 && channelName !== undefined) {
                const channel = normalizeStr(channelName);
                if (!channels.map(x => x.toLowerCase()).includes(channel)) {
                    continue;
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
                        if (!call.every(x => content.indexOf(normalizeStr(x, {preserveWhiteSpace})) !== -1)) {
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
                        foundCall = call.find(x => content.indexOf(normalizeStr(x, {preserveWhiteSpace})) !== -1);
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

            // react ops
            if (react.length > 0) {
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
            if (response.length > 0) {
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
                if (str.toLowerCase().indexOf('warn') !== -1) {
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
