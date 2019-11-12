import fetch from 'node-fetch';
import 'url-search-params-polyfill';
import {randomIntFromInterval} from "../utilities";
import {Message} from "discord.js";

export interface szuruEnv {
    token: string,
    endpoints: {
        frontend: string,
        backend: string
    },
    safety?: string,
}

export interface szuruEndpoints {
    frontend: string,
    backend: string
}

const makeApiCall = (endpoint: string, token: string) => {
    return async (url: string, {headers = {}, body = undefined, method = 'GET', ...requestedOpts} = {}) => {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${token}`
        };

        const opts: any = {
            headers: {
                ...defaultHeaders,
                ...headers
            },
            method,
            ...requestedOpts
            // should at least also have [body] if post
        };
        if (body !== undefined) {
            if (typeof body !== 'string') {
                opts.body = JSON.stringify(body);
            } else {
                opts.body = body;
            }
        }

        const response = await fetch(`${endpoint}/${url}`, opts);
        if (response.status === 400) {
            return new Error('400: Bad Request')
        }
        return response.json();
    }
};

export class Szurubooru {

    private readonly frontend: string;
    private readonly backend: string;
    private readonly token: string;
    private readonly safety: string;

    private readonly api: Function;

    private readonly safetyLevels = ['safe','sketchy','unsafe'];

    constructor(endpoints: szuruEndpoints, token: string, safety: string = 'safe') {
        this.frontend = endpoints.frontend;
        this.backend = endpoints.backend;
        this.token = token;
        if(!this.safetyLevels.includes(safety.toLowerCase())) {
            throw new Error('Safety Level must be one of: safe, sketchy, unsafe');
        }
        this.safety = safety.toLowerCase();
        this.api = makeApiCall(this.backend, this.token);
    }

    randomMeme = async () => {
        const params = new URLSearchParams();
        params.append('query', 'sort:random');
        const posts = await this.api(`posts?${params.toString()}`, {
            method: 'GET'
        });
        let acceptableMeme = false;
        let contentUrl: string = '';
        while (!acceptableMeme) {
            const meme = posts.results[randomIntFromInterval(0, posts.results.length)];
            const {safety, contentUrl: url} = meme;
            if (safety === 'safe') {
                acceptableMeme = true;
            }
            contentUrl = url;
        }
        return (msg: Message) => msg.channel.send({files: [`${this.frontend}/${contentUrl}`]});
    };

    taggedMeme = async (tags: string[]) => {
        const params = new URLSearchParams();
        params.append('query', `sort:random ${tags.join(' ')}`);
        const posts = await this.api(`posts?${params.toString()}`, {
            method: 'GET'
        });
        if (posts.name !== undefined && posts.name === 'Error') {
            if (posts.message.indexOf('400') !== -1) {
                return (msg: Message) => msg.channel.send(`Tags were malformed. 😩 Must be in form of **either** 
 * \`oneTag,twoTag,threeTag\`
 * \`oneTag twoTag threeTag\``);
            }
            return (msg: Message) => msg.channel.send('Unknown error occurred but has been logged 🤒')
        }
        if (posts.results.length === 0) {
            return (msg: Message) => msg.channel.send(`😳 No memes found with the tags: **${tags.join(' ')}**`);
        }
        let availableMemes = [...posts.results];
        let acceptableMeme = false;
        let contentUrl: string = '';
        const acceptableIndex = this.safetyLevels.indexOf(this.safety);
        while (!acceptableMeme && availableMemes.length > 0) {
            const randomIndex = randomIntFromInterval(0, availableMemes.length - 1);
            const meme = availableMemes[randomIndex];
            const {safety, contentUrl: url} = meme;
            if (this.safetyLevels.indexOf(safety) <= acceptableIndex) {
                acceptableMeme = true;
                contentUrl = url;
            } else {
                availableMemes.splice(randomIndex, 1);
            }
        }
        if(!acceptableMeme) {
            return (msg: Message) => msg.channel.send(`No memes with an acceptable level of **${this.safety}**${this.safety === 'safe' ? '' : ' or safer'} were found with the tags: **${tags.join(' ')}** 😳`);
        }

        return (msg: Message) => msg.channel.send({files: [`${this.frontend}/${contentUrl}`]});
    };


}

export default Szurubooru;
