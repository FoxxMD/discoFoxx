import {Command, CommandMessage, CommandoClient} from 'discord.js-commando';

class hello extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'hello',
            group: 'fun',
            memberName: 'hello',
            aliases: ['yo','hi','hey'],
            description: "I will say hello to you!",
        });
    }

    run(message: CommandMessage) {
        return message.say("Hello!");
    }
}

export default hello
