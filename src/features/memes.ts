import fetch from 'node-fetch';
import 'url-search-params-polyfill';
import {randomIntFromInterval} from "../utilities";
import {Message} from "discord.js";

export const makeSzuruBot = (endpoints: any, token: string) => {
    const {frontend, backend} = endpoints;
    const apiCall = makeApiCall(backend, token);

    const randomMeme = async () => {
        const params = new URLSearchParams();
        params.append('query', 'sort:random');
        const posts = await apiCall(`posts?${params.toString()}`, {
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
        return (msg: Message) => msg.channel.send({files: [`${endpoints.frontend}/${contentUrl}`]});
    };

    const taggedMeme = async (tags: string[]) => {
        const params = new URLSearchParams();
        params.append('query', `sort:random ${tags.join(' ')}`);
        const posts = await apiCall(`posts?${params.toString()}`, {
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
            return (msg: Message) => msg.channel.send(`😳 No memes found with the tags: ${tags.join(' ')}`);
        }
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

        return (msg: Message) => msg.channel.send({files: [`${frontend}/${contentUrl}`]});
    };

    return {
        random: randomMeme,
        tagged: taggedMeme
    }
};

// https://memepi.mattfoxx.me/posts?query=sort:random
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

export default makeSzuruBot;
