import {Database} from "sqlite";
import {Match, PlatformRegion, Player, PubgAPI, Roster} from 'pubg-typescript-api';
import {GuildMember, Message} from "discord.js";
import Table from 'cli-table3';

export interface pubgEnv {
    token: string,
    acl?: { // roles
        whitelist?: string[],
        blacklist?: string[],
        ops?: string[],
    }
}

export interface pubgUser {
    id: number,
    snowflake: string,
    discordName: string,
    pubId: string | null,
    pubName: string,
}

export class Pubgg {
    db: Database;
    whitelist: string[];
    blacklist: string[];
    ops: string[];
    api: PubgAPI;

    constructor(db: Database, env: pubgEnv) {
        const {
            token, acl: {
                whitelist = [],
                blacklist = [],
                ops = ['admin']
            } = {}
        } = env;
        this.db = db;
        this.whitelist = whitelist;
        this.blacklist = blacklist;
        this.ops = ops;
        this.createDB().then(() => null);
        this.api = new PubgAPI(token, PlatformRegion.STEAM);
    }

    async setPlayer(user: GuildMember, name: string): Promise<void> {
        const existingUser: (pubgUser | undefined) = await this.db.get('SELECT * from main.pubgUsers where snowflake = ?', user.id);
        const existingName: (pubgUser | undefined) = await this.db.get('SELECT * from main.pubgUsers where pubName = ?', name);

        if (existingName !== undefined) {
            if (existingName.snowflake !== user.id) {
                // then we need to delete this user
                await this.db.run('DELETE FROM main.pubgUsers where id = ? ', existingName.id);
            }

            if (existingUser !== undefined) {
                await this.db.run('UPDATE main.pubgUsers SET pubName = ?, pubId = ? where id = ?', [name, existingName.pubId, existingUser.id]);
                // if(existingUser.snowflake !== user.id && !user.roles.some(x => this.ops.includes(x.name.toLowerCase()))) {
                //     return (m: Message) => m.channel.send('You do not have permission to change the user associated with an existing pubg handle');
                // }
            } else {
                await this.db.run('INSERT INTO main.pubgUsers (snowflake, discordName, pubName, pubId) VALUES(?,?,?,?)', [user.id, user.displayName, name, existingName.pubId]);
            }
        } else if (existingUser !== undefined) {
            await this.db.run('UPDATE main.pubgUsers SET pubName = ?  where id = ?', [name, existingUser.id]);
        } else {
            await this.db.run('INSERT INTO main.pubgUsers (snowflake, discordName, pubName) VALUES(?,?,?)', [user.id, user.displayName, name]);
        }
    }

    async removePlayer(user: GuildMember): Promise<void> {
        await this.db.run('DELETE FROM pubgUsers where snowflake = ?', user.id);
    }

    async discordUserExists(user: GuildMember): Promise<boolean> {
        return await this.db.get('SELECT * FROM main.pubgUsers where snowflake = ?', user.id) !== undefined;
    }

    async pubNameExists(name: string): Promise<[boolean, string?]> {
        const existingRow: (pubgUser | undefined) = await this.db.get('SELECT * FROM main.pubgUsers where pubName = ?', name);
        if (existingRow === undefined) {
            return [false];
        }
        return [true, existingRow.discordName];
    }

    hasInteractionPermissions(user: GuildMember): boolean {
        if (this.whitelist.length > 0) {
            return user.roles.some(x => this.whitelist.includes(x.name.toLocaleLowerCase()))
        } else if (this.blacklist.length > 0) {
            return !user.roles.some(x => this.blacklist.includes(x.name.toLocaleLowerCase()))
        }
        return true;
    }

    hasOpsPermissions(user: GuildMember): boolean {
        return user.roles.some(x => this.ops.includes(x.name.toLocaleLowerCase()))
    }

    private async populatePubgId(pubUser: pubgUser): Promise<string> {
        const players = await Player.filterByName(this.api, [pubUser.pubName]);
        if (players.length === 0) {
            throw new Error(`No player found with the name ${pubUser.pubName}`);
        }
        const player = players[0];
        await this.db.run('UPDATE main.pubgUsers set pubId = ? where id = ?', [player.id, pubUser.id]);
        return player.id;
    }

    private async getPubgUserFromMember(user: GuildMember): Promise<(pubgUser | undefined)> {
        return this.db.get('SELECT * from main.pubgUsers where snowflake = ?', [user.id]);
    }

    private async getMatchFromPubgUser(pubUser: pubgUser) {
        let id = pubUser.pubId;
        if (id === null) {
            id = await this.populatePubgId(pubUser);
        }
        const player = await Player.get(this.api, id);
        return await Match.get(this.api, player.matchIds[0]);
    }

    async displayGroupMatch(user: GuildMember): Promise<Function> {
        const pubUser = await this.getPubgUserFromMember(user);
        if (pubUser === undefined) {
            return (m: Message) => m.channel.send(`PUBG Username not set for ${user.user.username}, see \`!pubg help\` for how to set it.`);
        }
        const match = await this.getMatchFromPubgUser(pubUser);
        const roster = match.rosters.find(x => x.participants.some(y => y.playerId === pubUser.pubId)) as Roster;
        const matchSummary = this.matchSummary(match);
        const rosterSummary = this.rosterSummary(roster);

        let table = new Table({
            head: ['Name', 'Kills', 'Dmg', 'DBNOs', 'Revives', 'Survived'],
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
                , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
                , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
                , 'right': '', 'right-mid': '', 'middle': ' '
            },
            style: {'padding-left': 0, 'padding-right': 0}
        });
        for (const participant of roster.participants) {
            // @ts-ignore
            table.push([
                `${participant.name.substring(0, 8)}${participant.name.length > 8 ? '...' : ''}`,
                participant.kills,
                Math.round(participant.damageDealt),
                participant.DBNOs,
                participant.revives,
                `${Math.round(participant.timeSurvived / 60)} min`]);
        }

        // const embed = {
        //     "title": `Match ${match.id.substring(0, 20)}...`,
        //     "url": `https://pubg-replay.com/match/pc/${match.id}`,
        //     "timestamp": match.dateCreated.toISOString(),
        //     "description": `**Map**: ${match.map}
        //     **Duration**: ${match.duration} minutes
        //     \`\`\`${table.toString()}\`\`\``
        // };


        return (m: Message) => {
            const content = `${roster.hasWon ? '**Winner Winner, Chicken Dinner!**\n' : ''}${matchSummary}\n\n${rosterSummary}\n\`\`\`${table.toString()}\`\`\`\n**Replay**: https://pubg-replay.com/match/pc/${match.id}`;
            return m.channel.send(content.substring(0, 2000));
        };
    }

    private matchSummary(match: Match) {
        return `**Map**: ${match.map}\n**Played On**: ${match.dateCreated}\n**Player Count**: ${match.participants.length}`;
    }

    private rosterSummary(roster: Roster) {
        return `Team placed in position **${roster.rank}**`;
    }

    private async createDB() {
        await this.db.run(`CREATE TABLE IF NOT EXISTS
        pubgUsers (
        id INTEGER PRIMARY KEY,
        snowflake text,
        discordName text,
        pubName text,
        pubId text
        );`);
    }
}

export const createPubgCommand = (pub: Pubgg) => {
    return async (msg: Message, args: string[]): Promise<Function> => {
        if (args.length === 0) {
            // do help file
            return (m: Message) => m.channel.send('Must provide a command! Use `!pubg help` to see what I can do.');
        }
        const [command, ...otherArgs] = args;
        let actionedUser = msg.mentions.users.size > 0 ? msg.mentions.members.first() : msg.member;
        switch (command) {
            case 'username':

                const [nick] = otherArgs;

                if (nick === undefined || nick === '') {
                    return (m: Message) => m.channel.send('Must provide a valid PUBG username!');
                }

                if (!pub.hasInteractionPermissions(msg.member)) {
                    return (m: Message) => m.channel.send('You do not have permission to do that.');
                }

                const [exists, name] = await pub.pubNameExists(nick);

                if (exists && !pub.hasOpsPermissions(msg.member)) {
                    return (m: Message) => m.channel.send(`User ${name} has already claimed that username and you do not have permission to override`);
                }

                await pub.setPlayer(actionedUser, nick);
                return (m: Message) => m.channel.send('PUBG Username set');
            case 'remove':

                if (!pub.hasInteractionPermissions(msg.member)) {
                    return (m: Message) => m.channel.send('You do not have permission to do that.');
                }

                await pub.removePlayer(actionedUser);
                return (m: Message) => m.channel.send('Removed player from PUBG functions');
            case 'match':
                const [displayType = 'me'] = otherArgs;
                if (displayType === 'group') {
                    return pub.displayGroupMatch(actionedUser);
                } else {
                    return (m: Message) => m.channel.send('Only group display type is implemented right now!');
                }
            default:
                return (m: Message) => m.channel.send('I don\'t know that PUBG command yet! :^(');
        }
    }
};
