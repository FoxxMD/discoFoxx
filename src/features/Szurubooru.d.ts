import 'url-search-params-polyfill';
import { Message } from "discord.js";
export interface szuruEnv {
    token: string;
    endpoints: {
        frontend: string;
        backend: string;
    };
}
export interface szuruEndpoints {
    frontend: string;
    backend: string;
}
export declare class Szurubooru {
    private readonly frontend;
    private readonly backend;
    private readonly token;
    private readonly api;
    constructor(endpoints: szuruEndpoints, token: string);
    randomMeme: () => Promise<(msg: Message) => Promise<Message | Message[]>>;
    taggedMeme: (tags: string[]) => Promise<(msg: Message) => Promise<Message | Message[]>>;
}
export default Szurubooru;
