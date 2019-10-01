import {getUserFromMention, randomIntFromInterval, sleep, timeStamp} from "../utilities";
import {Message} from "discord.js";
import {CommandoClient} from "discord.js-commando";

export interface replyOpts {
    delay?: {
        min?: number | undefined,
        max?: number | undefined
    },
    chance?: number,
    userNames?: string[]
    channels?: string[] | undefined,
    verbose?: boolean | undefined,
    functionNameHint?: string
    allowBot?: boolean,
    allowCommand?: boolean,
}

// main wrapper for executing a function when a message happens
// this allows us to manipulate pre and post function execution behavior
// and, more generally, gets this logic out of the way of the individual features to make them simpler
// 
// options here include:
// * restricting execution based on message author (userNames)
// * restricting execution based on which channel message is from (channels)
// * adding a arbitrary chance that execution will occur (chance)
// * delaying final execution randomly based on an interval of seconds (delay)
export const replyToMessage = (func: Function, opts?: replyOpts) => async (message: Message) => {

    const {
        delay: {
            min = 0,
            max = 0
        } = {},
        userNames = [],
        chance = 100,
        channels = [],
        verbose = false,
        functionNameHint = '',
        allowBot = false,
        allowCommand = false,
    } = opts || {};

    let verboseStrings = [timeStamp()];
    if (functionNameHint !== '') {
        verboseStrings.push(functionNameHint);
    }

    if (!allowCommand && message.client instanceof CommandoClient) {
        if (message.content.startsWith(message.client.commandPrefix)) {
            return;
        }
        const mentionedUser = getUserFromMention(message.content.split(/ +/)[0], message.mentions.users);
        if (mentionedUser !== undefined && mentionedUser.id === message.client.user.id) {
            return;
        }
    }

    // if the userNames array is empty it means "execute on any user"
    if (userNames.length > 0) {
        const messageUser = message.author.username.toLocaleLowerCase();
        const foundUser = userNames.find(x => {
            return x.toLocaleLowerCase() === messageUser;
        });
        if (foundUser === undefined) {
            return;
        } else if (verbose) {
            // only want to log if verbose *and* we are looking for a specific user to reduce log noise
            verboseStrings.push(`Found ${foundUser}`);
        }
    } else if (!allowBot && message.author.bot) {
        // don't reply to bot, but only if a bot username isn't explicitly specified (above)
        return;
    }

    // if channels array is empty this essentially means "execute on any channel"
    if (channels.length > 0) {
        // @ts-ignore
        if (!channels.map(x => x.toLocaleLowerCase()).includes(message.channel.name.toLocaleLowerCase())) {
            return;
        } else if (verbose) {
            // only want to log if verbose *and* we are looking for a specific channel to reduce log noise
            // @ts-ignore
            verboseStrings.push(`In Channel ${message.channel.name}`);
        }
    }

    // chance defaults to 100
    // we decrease random by 0.01 (random returns number between 0.01 and 1)
    // to ensure if chance = 1 its always greater than random - 0.01
    if (Math.random() - 0.01 > chance * 0.01) {
        if (verbose) {
            verboseStrings.push('failed chance');
            console.log(verboseStrings.join(' -> '));
        }
        return;
    }

    if (verbose) {
        verboseStrings.push('preparing matched scenario');
        console.info(verboseStrings.join(' -> '));
        console.group();
    }

    // if a feature wants a delay wrapper its function should return a new function with the same arguments (or at least 1 argument of 'message')
    // this sets us up to have a ready execution with the specified result/behavior
    // and lets us know that it can delay (if necessary) a successful function execution
    const result = await func(message, verbose);

    if (verbose) {
        console.groupEnd();
    }

    if (typeof result === 'function') {

        if (verbose) {
            console.log(`${functionNameHint} ready to execute`);
        }
        if (min !== 0 || max !== 0) {
            const sleepTime = randomIntFromInterval(min, max);
            const sleepFormattedValue = sleepTime < 60 ? `${sleepTime} seconds` : `${(sleepTime / 60).toFixed(1)} minutes`;

            // only want to log delay times if its significant (over 5 seconds) so we can confirm the feature function is OK from the console
            if (sleepTime > 5) {
                console.log(`Sleeping for ${sleepFormattedValue}${functionNameHint !== null ? ` on ${functionNameHint}` : null}`);
            }

            await sleep(sleepTime * 1000);

            if (sleepTime > 5) {
                console.log(`Done sleeping for ${sleepFormattedValue}${functionNameHint !== null ? ` on ${functionNameHint}` : null}`);
            }
        }
        // execute bot behavior hooray!
        if (verbose) {
            console.log(`Executing ${functionNameHint}`)
        }
        result(message);
        // return true to let routine loop know it should stop now
        return true;
    }

    if (verbose) {
        console.log(`${functionNameHint} ${result === true ? 'matched true' : 'did not match true'}`);
    }
    return result;
};
