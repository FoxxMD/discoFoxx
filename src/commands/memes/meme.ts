import {Command, CommandMessage, CommandoClient} from 'discord.js-commando';
import {Szurubooru} from "../../features/Szurubooru";

export class MemeCommand extends Command {

    memeApi: Szurubooru;

    constructor(api: Szurubooru, client: CommandoClient) {
        super(client, {
            name: 'meme',
            group: 'memes',
            memberName: 'meme',
            description: 'Post a meme from The Meme Machine.',
            details: `Post a meme from a szurubooru image board
            * Command without args will post a random meme
            * Command with args will restrict the memes to specified tags`,
            examples: ['!meme', '!meme shrek deepFried', '!meme deepFried,glowingEyes shrek'],
            args: [
                {
                    key: 'tags',
                    default: '',
                    type: 'string',
                    infinite: true,
                    prompt: 'Add one or more tags',
                    // @ts-ignore
                    isEmpty: (vals: string[], msg, arg) => {
                        return vals.length === 0;
                    },
                    validate: (vals: string[]) => {
                        for (const val of vals) {
                            const commaIndex = val.indexOf(',');
                            if (commaIndex !== -1 && (commaIndex === 0 || commaIndex === val.length - 1)) {
                                return 'OR operator (,) cannot be at the end or beginning of a term. Must be placed in the middle.';
                            }
                        }
                        return true;
                    }
                }
            ]
        });
        this.memeApi = api;
    }

    async run(message: CommandMessage, args: object) {
        const {tags} = args as { tags: string[] };
        if (args === undefined) {
            return false;
        }
        const func = tags.length === 0 ? await this.memeApi.randomMeme() : await this.memeApi.taggedMeme(tags);
        // @ts-ignore
        return func(message);
    }
}

export default MemeCommand;
