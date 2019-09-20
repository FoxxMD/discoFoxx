# Disco Foxx (A Discord Bot)

**In active development, everything subject to change 😬**

## Requirements

* NodeJS 9.11 or higher
* Typescript 3.6 or higher
* A [discord app token](https://discordapp.com/developers/applications/)
* For voice channel usage an FFmpeg library must be installed

## About

This library provides a user and developer friendly bot for [discord.js](https://discord.js.org/). It can do:

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
* Commands using [Discordjs-commando](https://discord.js.org/#/docs/commando/v0.10.0/general/welcome)
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
    * All feature functionality as modules/classes

## Installation

`npm install disco-foxx --save`

## Usage (User)

An `env` object must be provided to the constructor of `Bot`. `env` must contain a [discord token](https://discordapp.com/developers/applications). The minimum valid structure for `env` is:
```json
{
    "discord": {
    "token": "yourToken"
  }
}
```

To start the bot instantiate a new Bot class and pass it the env. Then invoke `run()`

```js
import { Bot } from 'disco-foxx';
import env from './env.json';

const myBot = new Bot({env});
myBot.run(); // bot is now running
```

### Events

All event listeners are inserted in the order they were created.

foxx-disco will pass through any [discord client](https://discord.js.org/#/docs/main/stable/class/Client) event using the same event api

```js
myBot.on('message', (message) => {
   console.log(`Message content: ${message.content}`);
});
myBot.once('ready', () => {   
    console.log('Bot is ready');
});
```

but extends event listener execution to allow an early exit if your listener returns `true`. This is helpful if one listener meets a condition you want to act on but prevent any later listeners from acting as well.

```js
myBot.on('message', async (message) => {
    if(message.content.indexOf('say something') !== -1) {
        await message.channel.send('Something said.');   
        return true; // prevents the below listener from executing -- so the bot doesn't respond twice
    }
});
myBot.on('message', async (message) => {
       if(message.content.indexOf('something less important') !== -1) {
           await message.channel.send('yes, less important');    
       }
});
```

## Usage (Developers/Extending The Bot)

Extra functionality, such as persistence (using `db`), "immutable" events, and so on can be added by simply extending the `Bot` class. Using ES6 syntax:

```js
import { Bot } from 'disco-foxx';
import env from './env.json';

class MyCustomBot extends Bot {
    constructor(props) {
        super(props);

        const {env} = props;
        if(env.steam.token === undefined) {
            throw new Error('Must define steam token!');
        }
        console.log('Starting my custom bot');
    }
}

const bot = new MyCustomBot({env});
bot.run();
```

### Events

When extending the `Bot` class the `addEvent` class method can be used to specify further listener types: `user`, `botPre`, `botPost`

`Bot` listener types allow a developer to insert listeners at the beginning or end of any user-specified (using `on` or `once`) listeners. This is useful when the developer wants certain actions to only occur if no user listeners returned early, or if the developer wants to ensure their listeners are executed before any user listeners.

```js
const newEvent = {
    name: 'bot author response',
    type: eventType.BOT_PRE, // will be executed before any user-defined listeners on the same event
    func: async (message) => {
        if(message.author.id === aBotSnowflake) {
            await message.channel.send('I know you!');
            return true;
        }
    }
}
this.addEvent('message', newEvent);
```

## Features

`disco-foxx/features` contains classes that can be used to add complex functionality to your bot. They are provided because the author uses them :)

**Some feature methods features will return a `function` if they are ready to execute a bot behavior, otherwise they return false.** This is to help the user to determine if they should return early on the executing listener.

### Call And Response (CAR)

CAR functionality is a common feature for most bots:

1. A user sends a message to a channel/DM
2. The bot detects a word or words in the message
3. The bot responds with a message or reacts to the user's message

The CAR feature does this with minimal configuration while also allowing fine-tuning of every aspect of the bot's detection and response behavior.

#### Usage

```js
import { Bot } from 'disco-foxx';
import { CallAndResponse } from "disco-foxx/features";
import env from './env.json';

const carObjects = {
    data: [
        {
            call: ['major tom'],
            response: ['ground control, anyone out there?']
        }
    ]
}
const car = new CallAndResponse(carObjects);

const bot = new Bot({env});
bot.on('message', async (message) => {
    const result = car.process(message);
    if (typeof result === 'function') { // so we know callAndResponse matched the content and is ready to send a message
        await result(message);
        return true;
    }
});
```

Refer to the `CARData` interface for a full description of how to configure a CAR object

### Other feature documentation coming soon

## Commands

Most features have a corresponding [commando](https://discord.js.org/#/docs/commando/v0.10.0/general/welcome) command. To use these you must initialize a `CommandBot` instead of `Bot`. Then the commands may be used as normal with a `CommandClient`.

```js
import { CommandBot } from 'disco-foxx';
import { ClipPlayer } from 'disco-foxx/features';
import { SoundCommand } from 'disco-foxx/commands';
import sounds from './sounds.json';
import env from './env.json';

const bot = new CommandBot({env})

bot.client.registry
    .registerDefaults()
    .registerGroups([
        ['audio', 'An Audio Command Group']
    ]);

const player = new ClipPlayer(sounds, path.join(__dirname, 'sounds'));
const soundCmd = new SoundCommand(player, bot.client);

bot.client.registry.registerCommands([soundCmd]);

bot.run();
```

## Example

See [example](https://github.com/FoxxMD/discoFoxx/tree/master/example) folder for a kitchen sink reference of how to use this bot
    
## 3rd Party API Setup

#### Szurubooru

Follow the instructions for [Authentication](https://github.com/rr-/szurubooru/blob/master/doc/API.md#authentication)

* Include [Basic Auth](https://en.wikipedia.org/wiki/Basic_access_authentication) headers to retrieve a [user token](https://github.com/rr-/szurubooru/blob/master/doc/API.md#creating-user-token)
* Create an auth token by base64 encoding this value: `userName:userToken`
* Instantiate a `Szurubooru` object from `disco-foxx/features` and provide with valid constructor arguments (endpoints and token). See `szuruEndpoints` interface.

#### PUBG

* Register a new app on the [pubg dev api site](https://developer.playbattlegrounds.com/apps/new?locale=en).
* Instantiate a new `Pubg` object from `disco-foxx/features`. See `pubgEnv` interface.

## Developing

From the project directory:

* After cloning run `npm install`
* Run `tsc` to compile to `dist` dir
