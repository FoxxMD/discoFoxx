# Squad Bot

**In active development, everything subject to change 😬**

## Requirements

* NodeJS 9.11 or higher
* Typescript 3.6 or higher
* A discord app token (Can be retrieved from [here](https://discordapp.com/developers/applications/))
* For audio play an FFmpeg library must be installed

## About

This application uses [discord.js](https://discord.js.org/) to control a bot for your server. It can do:

* Message parsing (feature) with options:
    * Per user
    * Per channel
    * On specified % chance
* Parsing functions (features)
    * Call and Response -- Reply and React to arbitrary terms from user-defined list
        * Multiple calls (terms to look for)
        * Multiple responses, choose at random
        * Multiple reacts, choose at random
        * Granular trigger chance
            * Independent chances for reply/react
            * Independent chances based on bot mention
            * Chance to react multiple times per trigger
        * Require all, any, or only calls
        * Require bot mention
        * Restrict to channels
        * Flags for content parsing (preserve whitespace, preserve case, preserve url)
    * Bang commands
        * Sound playback in voice channel from user-defined list
        * Post memes from [szurubooru](https://github.com/rr-/szurubooru)
             * post random
             * post random with specified tags
        * [PUBG API](https://documentation.pubg.com/en/index.html) interaction
            * Get last match stats
* Extend and Develop easily
    * Public methods to access all discord client events and sequence actions with optional return early condition
    * SQLite out of the box, available as Bot property, with default `memory` or easily configured `file` options
    * Easily extend the base Bot class and directly access the discord client
    * Hooks into Bot internals
    * Prioritized event handle
        * Events ordered by Bot (Pre), User, Bot (Post)
        * Allows developers to write custom bots their users can continue to extend
    * All feature functionality as modules

## Installation

`npm install disco-foxx --save`

## Usage

You must provide an `env` object to the constructor of `Bot`. `env` must contain a [discord token](https://discordapp.com/developers/applications). The structure of `env` is:
```json
{
    "discord": {
    "token": "yourToken"
  }
}
```

To start the bot instantiate a new Bot class and pass it the env. Then invoke `run()`

```js
import Bot from 'disco-foxx';
import env from './env.json';

const myBot = new Bot({env});
myBot.run(); // bot it now running
```

### Events

Documentation coming soon!
    
### 3rd Party API Setup

#### Szurubooru

Add endpoints (front and backend) to `env.json`

Follow the instructions for [Authentication](https://github.com/rr-/szurubooru/blob/master/doc/API.md#authentication)

* Include [Basic Auth](https://en.wikipedia.org/wiki/Basic_access_authentication) headers to retrieve a [user token](https://github.com/rr-/szurubooru/blob/master/doc/API.md#creating-user-token)
* Create an auth token by base64 encoding this value: `userName:userToken`
* Add the auth token to `env.json`

#### PUBG

* Register a new app on the [pubg dev api site](https://developer.playbattlegrounds.com/apps/new?locale=en). Copy the token to `env.json`
* Make sure `db` is specified in `env.json` so user associations are persisted
* Setup `acl` in the pub portion of `env.json` if you want to restrict usage to certain roles, otherwise all users can use pubg commands

## Developing

From the project directory:

* After cloning run `npm install`
* Run `tsc` to compile to `dist` dir
