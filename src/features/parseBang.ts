//
import {Message} from "discord.js";
import {normalizeStr} from "../utilities";

export const parseBang = (msg: Message, prefix = '!') => {
    // check to see if message content begins with prefix
    if (msg.content.indexOf(prefix) === 0) {
        // make sure prefix isn't the *only* content SMH
        if (msg.content.length === 1) {
            return (message: Message) => message.reply(`Your prefix looks so lonely 😞 you should add a command to it! (like this \`!kuchi\`)`);
        }
        // remove prefix from string and then split string by whitespace
        const tokens = normalizeStr(msg.content, {preserveWhiteSpace: true, preserveCase: true}).substring(1).split(' ');
        // EX !sound wtfRichard
        // token[0] is the command IE sound
        // everything else are arguments for the command, package them with a spread operator IE wtfRichard
        const [command, ...args] = tokens;
        return {
            command,
            args
        };
    }
    // no prefix found
    return false;
};
