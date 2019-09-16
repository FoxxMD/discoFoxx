import util from 'util';
import {Collection, Message, Snowflake, User, MessageMentions} from "discord.js";

export const sleep = util.promisify(setTimeout);

export const randomIntFromInterval = (min: number, max: number) => { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
};

interface normalizeOpts {
    preserveWhiteSpace?: boolean,
    preserveUrl?: boolean,
    preserveCase?: boolean,
    mentions?: any[] | Collection<Snowflake, User>
}

export const normalizeStr = (str: string, opts?: normalizeOpts) => {
    const {preserveWhiteSpace = false, preserveUrl = false, preserveCase = false, mentions} = opts || {};
    let finalStr = str;
    if (!preserveCase) {
        finalStr = finalStr.toLowerCase();
    }
    // remove mentions by replacing any text in carets, inclusively IE <fdfasdf> -> ''
    finalStr = finalStr.replace(MessageMentions.USERS_PATTERN, (match: string) => {
        if (mentions !== undefined) {
            // @ts-ignore
            const foundUser: User = mentions.find((x: any) => `<@${x.id}>` === match);
            if (foundUser !== null) {
                return foundUser.username;
            }
            return '';
        }
        return '';
    })
        .replace(/`[^`]*`/g, ''); // replace code markdown
    if (!preserveWhiteSpace) {
        finalStr = finalStr.replace(/\s/g, ''); // replace whitespace characters
    }
    if (!preserveUrl) {
        finalStr = finalStr.replace(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, '');
    }

    return finalStr;
};

export const isVerbose = (envDebug = false, configDebug = false) => {
    if (envDebug) {
        return true;
    }
    if (configDebug) {
        return true;
    }
    return false;
};

export const timeStamp = (date: string | undefined = undefined, locale = undefined) => {
    const event = (date === undefined) ? new Date() : new Date(date);
    return event.toLocaleDateString(locale) + " " + event.toLocaleTimeString(locale)
};

export const replaceWithContext = (content: string, message: Message) => {
    return content.replace(/{{[^{}]*}}/g, (match) => {
        const {author, channel, mentions: {users}} = message;
        const channelName = 'name' in channel ? channel.name : '';
        const mentionedUsers: Collection<Snowflake, User> | never[] = users;

        switch (match.substring(2, match.length - 2)) {
            case 'author':
                return author.toString();
            case 'channel':
                return channelName;
            case 'mention':
                if (mentionedUsers.size > 1) {
                    // @ts-ignore
                    const mu = mentionedUsers.first(); // just use the first
                    return mu.toString();
                }
                return '';
            case 'mentions':
                if (mentionedUsers.size > 1) {
                    // @ts-ignore
                    return mentionedUsers.map(x => x.toString()).join(' ');
                }
                return '';
            default:
                return '';
        }
    });
};

export const getUserFromMention = (content: string, mentions: Collection<Snowflake, User>) => {
    // The id is the first and only match found by the RegEx.
    const matches = content.match(/^<@!?(\d+)>$/);

    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) return undefined;

    return mentions.get(matches[1]);
};
